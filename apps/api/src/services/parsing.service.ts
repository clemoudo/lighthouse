import { LlamaCloud } from "@llamaindex/llama-cloud"
import fs from "node:fs"
import { env } from "../env"
import { logger } from "@repo/logger"

const CUSTOM_PROMPT = `Tu es un expert en extraction de documents pédagogiques complexes. 
Ta mission est de convertir ce document en un format structuré mêlant Markdown et HTML.

LOGIQUE DE MISE EN PAGE :
- SI la page contient les colonnes "OBJECTIFS" et "ÊTRE PROGRESSIVEMENT CAPABLE DE..." : 
  Utilise impérativement une table HTML (<table>) pour préserver le lien entre les objectifs (gauche) et les capacités (droite).
- SINON (postures, balises, rituels, outils) : 
  Utilise un Markdown standard avec des listes à puces. Respecte scrupuleusement la hiérarchie des titres.

Ne génère aucun texte d'introduction, renvoie uniquement le contenu structuré.`

export interface ParsedPage {
  markdown: string
  pageNumber: number
  printedPageNumber?: string
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
        top: 0.06,
        bottom: 0.08,
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
        custom_prompt: CUSTOM_PROMPT,
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
}

export const parsingService = new ParsingService()
