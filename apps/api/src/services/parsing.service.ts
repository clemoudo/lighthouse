import { LlamaCloud } from "@llamaindex/llama-cloud"
import fs from "node:fs"
import { env } from "../env"
import { logger } from "@repo/logger"
import { mistral } from "@ai-sdk/mistral"
import { generateText, Output } from "ai"
import { z } from "zod"

const PARSING_PROMPT = `Convertis ce document PDF en Markdown structuré. 

RÈGLE MAJEURE : TOUS les tableaux doivent être générés en HTML pur (<table>, <tr>, <th>, <td>). N'utilise JAMAIS le formatage de tableau Markdown.

Respecte strictement ces 5 règles pour le rendu :

1. FORMATAGE DES CELLULES : Si une cellule contient plusieurs éléments, utilise les balises <ul> et <li> pour créer une liste propre au lieu de tout coller sur une seule ligne. Conserve les numérotations (ex: 1.1.1).

2. FUSIONS (COLSPAN / ROWSPAN) : 
- Utilise "colspan" pour les en-têtes qui surplombent plusieurs colonnes (ex: "REPÈRES" au-dessus de "ÉCOUTER" et "PARLER").
- Utilise "rowspan" pour le texte orienté verticalement qui couvre plusieurs lignes (ex: "VIVRE DES EXPÉRIENCES...").

3. POINTS VISUELS (MATRICES) : Dans les tableaux à double entrée, si tu vois un point de couleur ou une coche dans une case, écris simplement "X" dans la balise <td> correspondante. Laisse la balise vide s'il n'y a rien.

4. ENCADRÉS HORS TABLEAUX : Les blocs de couleur en bas de page (ex: "Liens possibles vers EPC...") NE SONT PAS dans le tableau. Ferme la balise </table> avant, et formate ce texte en citation Markdown (avec le préfixe "> ").

5. NETTOYAGE DES ICÔNES : Ignore les icônes décoratives (mains, flèches colorées). Si elles servent de puces, remplace-les par un simple tiret ou une balise <li>.`

const TOC_PROMPT = (
  tocMarkdown: string,
) => `Analyse le texte suivant extrait du sommaire d'un programme scolaire et extrais les chapitres de manière hiérarchique.
      
      Règles :
      - Les chapitres "ROOT" (principaux) sont généralement en MAJUSCULES.
      - Les sous-sections sont rattachées à leur chapitre parent.
      - Conserve IMPÉRATIVEMENT la numérotation originale dans le titre (ex: "1.", "1.1.", "A.", etc.).
      - Les numéros de pages réels et imprimés sont identiques.
      - Si une section n'a qu'une seule page, startPage et endPage sont identiques.
      - Assure-toi que les plages se suivent logiquement.
      
      Texte du sommaire :
      ${tocMarkdown}`

export interface ParsedPage {
  markdown: string
  pageNumber: number
  printedPageNumber?: string
}

export interface TableOfContentsEntry {
  title: string
  startPage: number
  endPage: number
  subSections?: TableOfContentsEntry[]
}

export class ParsingService {
  private client: LlamaCloud

  constructor() {
    this.client = new LlamaCloud({
      apiKey: env.LLAMA_CLOUD_API_KEY,
    })
  }

  /**
   * Parse a PDF file into structured pages with markdown and metadata.
   */
  async parseDocument(filePath: string): Promise<ParsedPage[]> {
    logger.info(`[PARSING] Starting LlamaParse for: ${filePath}`)

    // 1. Upload file to LlamaCloud
    const fileObj = await this.client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "parse",
    })

    // 2. Trigger parsing job
    const result = await this.client.parsing.parse({
      file_id: fileObj.id,
      tier: "agentic",
      expand: ["markdown", "metadata"],
      version: "latest",
      disable_cache: true,
      crop_box: {
        top: 0.075,
      },
      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: false,
          },
        },
        extract_printed_page_number: true,
      },
      agentic_options: {
        custom_prompt: PARSING_PROMPT,
      },
      processing_options: {
        ocr_parameters: {
          languages: ["fr"],
        },
      },
    })

    // 3. Extract and validate pages
    const allMarkdownPages = result.markdown?.pages || []
    const allMetadataPages = result.metadata?.pages || []

    if (allMarkdownPages.length === 0) {
      throw new Error("No pages returned from LlamaParse.")
    }

    // Strict validation
    const failedCount = allMarkdownPages.filter((p) => !p.success).length
    if (failedCount > 0) {
      throw new Error(`Parsing failed for ${failedCount} pages.`)
    }

    // 4. Map results to internal interface
    return (allMarkdownPages as Array<{ markdown: string; page_number: number }>).map((p) => {
      const meta = allMetadataPages.find((m) => m.page_number === p.page_number)
      return {
        markdown: p.markdown.trim(),
        pageNumber: p.page_number,
        printedPageNumber: meta?.printed_page_number ? String(meta.printed_page_number) : undefined,
      }
    })
  }

  /**
   * Extract a structured hierarchical table of contents from the markdown of the ToC page.
   */
  async extractTableOfContents(tocMarkdown: string): Promise<TableOfContentsEntry[]> {
    logger.info("[PARSING] Extracting structured hierarchical ToC using Mistral")

    const { output } = await generateText({
      model: mistral.chat("mistral-large-latest"),
      output: Output.object({
        schema: z.object({
          chapters: z.array(
            z.object({
              title: z.string().describe("Le titre complet du chapitre (ex: '1. INTRODUCTION')"),
              startPage: z.number().describe("Le numéro de la page de début"),
              endPage: z.number().describe("Le numéro de la page de fin"),
              subSections: z
                .array(
                  z.object({
                    title: z
                      .string()
                      .describe("Le titre complet de la sous-section (ex: '1.1. Objectifs')"),
                    startPage: z.number(),
                    endPage: z.number(),
                  }),
                )
                .optional(),
            }),
          ),
        }),
      }),
      prompt: TOC_PROMPT(tocMarkdown),
    })

    return output.chapters
  }
}

export const parsingService = new ParsingService()
