import { prisma, IngestionStatus, type ParsedPage } from "@repo/db"
import { logger } from "@repo/logger"
import { parsingService } from "./parsing.service"
import { vectorService } from "./vector.service"
import { storageService, type SaveChunksParams } from "./storage.service"
import { sendEmail } from "./email.service"

// --- DEVELOPMENT CONFIG ---
const USE_CACHED_PARSING = true // Set to false to force a new LlamaParse call
// --------------------------

/**
 * Helper to notify admins about ingestion results
 */
async function notifyAdmins(documentTitle: string, status: "SUCCESS" | "FAILURE", error?: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { email: true },
    })

    if (admins.length === 0) {
      logger.warn("[INGESTION_NOTIF] Aucun admin trouvé pour l'envoi de mail.")
      return
    }

    const adminEmails = admins.map((a) => a.email)
    const isSuccess = status === "SUCCESS"

    await sendEmail({
      to: adminEmails,
      subject: `[Lighthouse] ${isSuccess ? "Succès" : "Échec"} de l'ingestion : ${documentTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: ${isSuccess ? "#10b981" : "#ef4444"};">
            Ingestion ${isSuccess ? "terminée avec succès" : "échouée"}
          </h2>
          <p>Le traitement du document <strong>${documentTitle}</strong> vient de se terminer.</p>
          <ul>
            <li><strong>Statut :</strong> ${isSuccess ? "COMPLETED" : "FAILED"}</li>
            ${error ? `<li style="color: #ef4444;"><strong>Erreur :</strong> ${error}</li>` : ""}
          </ul>
          <p>Vous pouvez consulter le document dans l'interface d'administration.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Ceci est un message automatique du système Lighthouse.</p>
        </div>
      `,
    })
  } catch (err) {
    logger.error("[INGESTION_NOTIF] Erreur lors de la notification des admins:", err)
  }
}

/**
 * Orchestrator service for the RAG ingestion pipeline.
 */
export const ingestDocument = async (documentId: string) => {
  let docTitleForNotification = "Document Inconnu"

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
    docTitleForNotification = document.title

    logger.info(`[INGESTION] Starting optimized hierarchical pipeline for: ${document.title}`)

    // 2. Clean existing data (re-ingestion support)
    await storageService.deleteDocumentData(document.id)

    // 3. Parsing Phase (Cache-aware)
    let pages: ParsedPage[] = []

    if (USE_CACHED_PARSING && document.parsedContent) {
      logger.info("[INGESTION] Using cached LlamaParse results from database.")
      pages = document.parsedContent
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

    // 8. Notify admins of success
    await notifyAdmins(docTitleForNotification, "SUCCESS")
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    logger.error(`[INGESTION_ERROR] ${errorMessage}`)

    // On error, update document status
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: IngestionStatus.FAILED, error: errorMessage },
      })

      // Notify admins of failure
      await notifyAdmins(docTitleForNotification, "FAILURE", errorMessage)
    } catch (dbError) {
      logger.error(`[INGESTION_CRITICAL_ERROR] Failed to update document status: ${dbError}`)
    }
  }
}
