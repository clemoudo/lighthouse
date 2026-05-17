import { LlamaCloud } from "@llamaindex/llama-cloud"
import fs from "node:fs"
import { mistral } from "@ai-sdk/mistral"
import { embedMany } from "ai"
import { prisma } from "@repo/db"
import { logger } from "@repo/logger"
import { env } from "../env"

const CUSTOM_PROMPT = `Tu es un expert en extraction de documents pédagogiques complexes. 
Ta mission est de convertir ce document en un format structuré mêlant Markdown et HTML.

LOGIQUE DE MISE EN PAGE :
- SI la page contient les colonnes "OBJECTIFS" et "ÊTRE PROGRESSIVEMENT CAPABLE DE..." : 
  Utilise impérativement une table HTML (<table>) pour préserver le lien entre les objectifs (gauche) et les capacités (droite).
- SINON (postures, balises, rituels, outils) : 
  Utilise un Markdown standard avec des listes à puces. Respecte scrupuleusement la hiérarchie des titres.

Ne génère aucun texte d'introduction, renvoie uniquement le contenu structuré.`

/**
 * Service d'ingestion RAG V3.2 : Utilisation native des pages JSON + Metadata.
 */
export const ingestDocument = async (documentId: string) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) throw new Error("Document introuvable")

    logger.info(`[INGESTION] Démarrage V3.2 (Native Page Ingestion) pour : ${document.title}`)

    const client = new LlamaCloud({
      apiKey: env.LLAMA_CLOUD_API_KEY,
    })

    const fileObj = await client.files.create({
      file: fs.createReadStream(document.filePath),
      purpose: "parse",
    })

    // Configuration optimale basée sur la documentation
    const result = await client.parsing.parse({
      file_id: fileObj.id,
      tier: "agentic",
      expand: ["markdown", "metadata"], // Récupère le résultat page par page avec métadonnées
      version: "latest",
      disable_cache: true,
      crop_box: {
        top: 0.06, // 6% du haut
        bottom: 0.08, // 8% du bas
      },
      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: false, // Tables en HTML
          },
        },
        extract_printed_page_number: true,
      },
      agentic_options: {
        custom_prompt: CUSTOM_PROMPT,
      },
      processing_options: {
        ocr_parameters: {
          languages: ["fr"],
        },
      },
    })

    // 1. Récupération des pages de toutes les expansions
    const allMarkdownPages = result.markdown?.pages || []
    const allMetadataPages = result.metadata?.pages || []

    if (allMarkdownPages.length === 0) {
      throw new Error("Échec du parsing : aucune page n'a été retournée par LlamaParse.")
    }

    // 2. Vérification stricte : si une seule page a échoué, on arrête tout
    const failedPages = allMarkdownPages.filter((p) => !p.success)
    if (failedPages.length > 0) {
      throw new Error(
        `Le parsing a échoué pour ${failedPages.length} pages. Ingestion annulée pour garantir l'intégrité des données.`,
      )
    }

    // 3. À ce stade, on garantit que toutes les pages ont la propriété 'markdown'
    const markdownPages = allMarkdownPages as Array<{ markdown: string; page_number: number }>

    logger.info(`[INGESTION] Les ${markdownPages.length} pages ont été parsées avec succès.`)

    // 4. Création d'un chapitre parent unique pour le document
    const mainChapter = await prisma.chapter.create({
      data: {
        title: `Référentiel : ${document.title}`,
        order: 1,
        content: "Document indexé page par page via l'API JSON de LlamaParse.",
        documentId: document.id,
      },
    })

    // 5. Génération massive d'embeddings pour toutes les pages
    const { embeddings } = await embedMany({
      model: mistral.embedding("mistral-embed"),
      values: markdownPages.map((p) => p.markdown),
    })

    // 6. Sauvegarde massive incluant les métadonnées de chaque page
    await prisma.chunk.createManyWithVectors(
      markdownPages.map((page, i) => {
        const content = page.markdown.trim()

        // On cherche la métadonnée correspondante par numéro de page
        const meta = allMetadataPages.find((m) => m.page_number === page.page_number)

        return {
          content: content,
          embedding: embeddings[i],
          chapterId: mainChapter.id,
          metadata: {
            pdfPageNumber: page.page_number,
            printedPageNumber: meta?.printed_page_number,
            source: document.title,
          },
        }
      }),
    )

    logger.info(`[INGESTION] Réussie ! ${markdownPages.length} pages indexées avec succès.`)

    return {
      chaptersCount: 1,
      chunksCount: markdownPages.length,
    }
  } catch (error) {
    logger.error("[INGESTION_ERROR]", error)
    throw error
  }
}
