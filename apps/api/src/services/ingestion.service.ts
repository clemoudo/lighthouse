import { prisma, IngestionStatus } from "@repo/db"
import { logger } from "@repo/logger"
import { parsingService, type ParsedPage } from "./parsing.service"
import { vectorService } from "./vector.service"
import { storageService, type SaveChunksParams } from "./storage.service"

// --- DEVELOPMENT CONFIG ---
const USE_CACHED_PARSING = true // Set to false to force a new LlamaParse call
// --------------------------

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

    logger.info(`[INGESTION] Starting optimized hierarchical pipeline for: ${document.title}`)

    // 2. Clean existing data (re-ingestion support)
    await storageService.deleteDocumentData(document.id)

    // 3. Parsing Phase (Cache-aware)
    let pages: ParsedPage[] = []

    if (USE_CACHED_PARSING && document.parsedContent) {
      logger.info("[INGESTION] Using cached LlamaParse results from database.")
      pages = document.parsedContent as unknown as ParsedPage[]
    } else {
      logger.info("[INGESTION] Calling LlamaParse API...")
      pages = await parsingService.parseDocument(document.filePath)

      // Update document with raw parsed content for next time
      await prisma.document.update({
        where: { id: documentId },
        data: { parsedContent: pages },
      })
      logger.info(`[INGESTION] Successfully parsed and cached ${pages.length} pages.`)
    }

    // 4. ToC Extraction & Chapter Creation
    const page3 = pages.find((p) => p.pageNumber === 3)
    const chapterMapping: { id: string; startPage: number; endPage: number; title: string }[] = []

    // ALWAYS Add Manual Intro/ToC Chapter (Pages 1-4)
    const introChapter = await storageService.createChapter({
      documentId: document.id,
      title: "INTRODUCTION ET SOMMAIRE",
      order: 1,
      metadata: { startPage: 1, endPage: 4 },
    })

    chapterMapping.push({
      id: introChapter.id,
      title: introChapter.title,
      startPage: 1,
      endPage: 4,
    })

    if (page3) {
      const tocEntries = await parsingService.extractTableOfContents(page3.markdown)
      logger.info(`[INGESTION] Extracted ${tocEntries.length} root chapters from ToC.`)

      let currentOrder = 2
      for (const entry of tocEntries) {
        // Create Root Chapter
        const rootChapter = await storageService.createChapter({
          documentId: document.id,
          title: entry.title,
          order: currentOrder++,
          metadata: { startPage: entry.startPage, endPage: entry.endPage },
        })

        chapterMapping.push({
          id: rootChapter.id,
          title: rootChapter.title,
          startPage: entry.startPage,
          endPage: entry.endPage,
        })

        // Create Subsections
        if (entry.subSections && entry.subSections.length > 0) {
          for (const sub of entry.subSections) {
            const subChapter = await storageService.createChapter({
              documentId: document.id,
              title: sub.title,
              order: currentOrder++,
              parentId: rootChapter.id,
              metadata: { startPage: sub.startPage, endPage: sub.endPage },
            })

            chapterMapping.push({
              id: subChapter.id,
              title: subChapter.title,
              startPage: sub.startPage,
              endPage: sub.endPage,
            })
          }
        }
      }
    }

    // 5. Batch Vector Phase (Skipping empty pages)
    const nonEmptyPages = pages.filter((p) => p.markdown.trim().length > 0)
    logger.info(
      `[INGESTION] Generating embeddings for ${nonEmptyPages.length} non-empty pages (skipped ${pages.length - nonEmptyPages.length}).`,
    )

    let embeddings: number[][] = []
    if (nonEmptyPages.length > 0) {
      embeddings = await vectorService.generateEmbeddings(nonEmptyPages.map((p) => p.markdown))
    }

    // 6. Mapping & Storage Phase
    let embeddingIndex = 0
    const saveChunksParams: SaveChunksParams[] = pages
      .map((page) => {
        // Find ALL chapters this page belongs to
        const potentialChapters = chapterMapping.filter(
          (c) => page.pageNumber >= c.startPage && page.pageNumber <= c.endPage,
        )

        if (potentialChapters.length === 0) return null

        // Sort by "specificity": subsections are more specific than roots
        const targetChapter = potentialChapters[potentialChapters.length - 1]

        const isEmpty = page.markdown.trim().length === 0

        const chunk: SaveChunksParams = {
          content: isEmpty ? null : page.markdown,
          embedding: isEmpty ? null : embeddings[embeddingIndex++],
          chapterId: targetChapter.id,
          metadata: {
            pdfPageNumber: page.pageNumber,
            printedPageNumber: page.printedPageNumber,
            source: document.title,
            chapterTitle: targetChapter.title,
          },
        }

        return chunk
      })
      .filter((p) => p !== null)

    // Bulk insert chunks
    await storageService.saveChunksWithVectors(saveChunksParams)

    // 7. Mark as completed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: IngestionStatus.COMPLETED },
    })

    logger.info(
      `[INGESTION] Optimized hierarchical pipeline completed successfully for ${document.title}.`,
    )
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
