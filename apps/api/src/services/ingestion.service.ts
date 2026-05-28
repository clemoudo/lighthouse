import { prisma, IngestionStatus, type ParsedPage, UserRole } from "@repo/db"
import { logger } from "@repo/logger"
import { parsingService } from "./parsing.service"
import { vectorService } from "./vector.service"
import { storageService } from "./storage.service"
import { sendEmail } from "./email.service"
import { env } from "@/env"
import {
  generateIngestionEmailHtml,
  mapPagesToChunks,
  filterPagesForEmbedding,
  type SaveChunksParams,
} from "../lib/utils/ingestion-utils"

// --- DEVELOPMENT CONFIG ---
const USE_CACHED_PARSING = true // Set to false to force a new LlamaParse call
// --------------------------

/**
 * Helper to notify admins about ingestion results
 */
async function notifyAdmins(documentTitle: string, status: "SUCCESS" | "FAILURE", error?: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.admin },
      select: { email: true },
    })

    if (admins.length === 0) {
      logger.warn("[INGESTION_NOTIF] Aucun admin trouvé pour l'envoi de mail.")
      return
    }

    const adminEmails = admins.map((a) => a.email)

    await sendEmail({
      to: adminEmails,
      subject: `[Lighthouse] ${status === "SUCCESS" ? "Succès" : "Échec"} de l'ingestion : ${documentTitle}`,
      html: generateIngestionEmailHtml(documentTitle, status, error),
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

    logger.info(`[INGESTION] Starting simplified pipeline for: ${document.title}`)

    // 2. Clean existing data (re-ingestion support)
    await storageService.deleteDocumentData(document.id)

    // 3. Parsing Phase (Cache-aware)
    let pages: ParsedPage[] = []

    if (env.NODE_ENV === "development" && USE_CACHED_PARSING && document.parsedContent) {
      logger.info("[INGESTION] Using cached LlamaParse results from database.")
      pages = document.parsedContent as ParsedPage[]
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

    // 4. Batch Vector Phase (Skipping empty pages)
    const nonEmptyPages = filterPagesForEmbedding(pages)
    logger.info(
      `[INGESTION] Generating embeddings for ${nonEmptyPages.length} non-empty pages (skipped ${pages.length - nonEmptyPages.length}).`,
    )

    let embeddings: number[][] = []
    if (nonEmptyPages.length > 0) {
      embeddings = await vectorService.generateEmbeddings(nonEmptyPages.map((p) => p.markdown))
    }

    // 5. Mapping & Storage Phase
    const saveChunksParams = mapPagesToChunks(
      pages,
      embeddings,
      document.id,
      document.title,
    ) as SaveChunksParams[]

    // Bulk insert chunks
    await storageService.saveChunksWithVectors(saveChunksParams)

    // 6. Mark as completed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: IngestionStatus.COMPLETED },
    })

    logger.info(`[INGESTION] Simplified pipeline completed successfully for ${document.title}.`)

    // 7. Notify admins of success
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
