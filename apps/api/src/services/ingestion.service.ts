import { prisma, IngestionStatus } from "@repo/db"
import { logger } from "@repo/logger"
import { parsingService } from "./parsing.service"
import { vectorService } from "./vector.service"
import { storageService } from "./storage.service"

/**
 * Orchestrator service for the RAG ingestion pipeline.
 */
export const ingestDocument = async (documentId: string) => {
  try {
    // 1. Mark document as processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: IngestionStatus.PROCESSING, error: null },
    })

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) throw new Error("Document introuvable")

    logger.info(`[INGESTION] Starting asynchronous pipeline for: ${document.title}`)

    // 2. Parsing Phase (LlamaParse)
    const pages = await parsingService.parseDocument(document.filePath)
    logger.info(`[INGESTION] Successfully parsed ${pages.length} pages.`)

    // 3. Storage Phase: Create a main chapter for the document
    const mainChapter = await storageService.createChapter(
      document.id,
      `Référentiel : ${document.title}`,
      1,
      "Document indexé page par page.",
    )

    // 4. Vector Phase: Generate embeddings for all pages
    const embeddings = await vectorService.generateEmbeddings(pages.map((p) => p.markdown))

    // 5. Final Storage: Bulk insert chunks
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

    // 6. Mark as completed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: IngestionStatus.COMPLETED },
    })

    logger.info(`[INGESTION] Pipeline completed successfully for ${document.title}.`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    logger.error(`[INGESTION_ERROR] ${errorMessage}`)

    // On error, update document status
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: IngestionStatus.FAILED, error: errorMessage },
      })
    } catch (dbError) {
      logger.error(`[INGESTION_CRITICAL_ERROR] Failed to update document status: ${dbError}`)
    }
  }
}
