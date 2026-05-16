import { LlamaCloud } from "@llamaindex/llama-cloud"
import fs from "node:fs"
import { mistral } from "@ai-sdk/mistral"
import { embedMany } from "ai"
import { prisma } from "@repo/db"
import { logger } from "@repo/logger"
import { env } from "../env"

/**
 * Service pour gérer l'ingestion d'un document PDF dans le RAG.
 */
export const ingestDocument = async (documentId: string) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error("Document introuvable")
    }

    logger.info(`[INGESTION] Démarrage pour : ${document.title}`)

    const client = new LlamaCloud({
      apiKey: env.LLAMA_CLOUD_API_KEY,
    })

    const fileObj = await client.files.create({
      file: fs.createReadStream(document.filePath),
      purpose: "parse",
    })

    const result = await client.parsing.parse({
      file_id: fileObj.id,
      tier: "agentic",
      expand: ["markdown_full"],
      version: "latest",
    })

    const fullMarkdown = result.markdown_full || ""

    if (!fullMarkdown) {
      throw new Error("Échec du parsing : aucun texte extrait.")
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: "Contenu Principal",
        order: 1,
        content: fullMarkdown,
        documentId: document.id,
      },
    })

    const chunks = chunkText(fullMarkdown, 1000, 200)
    logger.info(`[INGESTION] ${chunks.length} chunks générés pour le chapitre.`)

    const { embeddings } = await embedMany({
      model: mistral.embedding("mistral-embed"),
      values: chunks,
    })

    // INSERTION VIA L'EXTENSION PRISMA (Sûr et Propre)
    await prisma.chunk.createManyWithVectors(
      chunks.map((content, i) => ({
        content,
        embedding: embeddings[i],
        chapterId: chapter.id,
      })),
    )

    logger.info(`[INGESTION] Réussie pour ${document.title}. ${chunks.length} chunks indexés.`)

    return {
      chaptersCount: 1,
      chunksCount: chunks.length,
    }
  } catch (error) {
    logger.error("[INGESTION_ERROR]", error)
    throw error
  }
}

/**
 * Fonction utilitaire pour découper un texte en morceaux.
 */
function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    chunks.push(text.slice(start, end))
    start += size - overlap
  }

  return chunks
}
