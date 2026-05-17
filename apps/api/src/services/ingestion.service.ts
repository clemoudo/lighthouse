import { prisma } from "@repo/db"
import { logger } from "@repo/logger"
import { parsingService } from "./parsing.service"
import { vectorService } from "./vector.service"
import { storageService } from "./storage.service"

/**
 * Orchestrator service for the RAG ingestion pipeline.
 */
export const ingestDocument = async (documentId: string) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) throw new Error("Document introuvable")

    logger.info(`[INGESTION] Starting refactored pipeline for: ${document.title}`)

    // 1. Parsing Phase (LlamaParse)
    const pages = await parsingService.parseDocument(document.filePath)
    logger.info(`[INGESTION] Successfully parsed ${pages.length} pages.`)

    // 2. Storage Phase: Create a main chapter for the document
    // (We keep the single chapter logic for now, but modularity allows splitting later)
    const mainChapter = await storageService.createChapter(
      document.id,
      `Référentiel : ${document.title}`,
      1,
      "Document indexé page par page.",
    )

    // 3. Vector Phase: Generate embeddings for all pages
    const embeddings = await vectorService.generateEmbeddings(pages.map((p) => p.markdown))

    // 4. Final Storage: Bulk insert chunks
    await storageService.saveChunksWithVectors(
      pages.map((page, i) => ({
        content: page.markdown,
        embedding: embeddings[i],
        chapterId: mainChapter.id,
        metadata: {
          pdfPageNumber: page.pageNumber,
          printedPageNumber: page.printedPageNumber,
          source: document.title,
        },
      })),
    )

    logger.info(`[INGESTION] Pipeline completed for ${document.title}.`)

    return {
      chaptersCount: 1,
      chunksCount: pages.length,
    }
  } catch (error) {
    logger.error("[INGESTION_ERROR]", error)
    throw error
  }
}
