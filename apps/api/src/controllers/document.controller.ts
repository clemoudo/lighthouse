import type { Request, Response } from "express"
import { prisma, IngestionStatus } from "@repo/db"
import { logger } from "@repo/logger"
import { ingestDocument } from "../services/ingestion.service"

export const listDocuments = async (_req: Request, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    })
    res.json({ documents })
  } catch (error) {
    logger.error("Erreur lors de la récupération des documents:", error)
    res.status(500).json({ error: "Erreur interne" })
  }
}

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier n'a été téléchargé" })
    }

    const { title } = req.body

    const document = await prisma.document.create({
      data: {
        title: title || req.file.originalname,
        filename: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: IngestionStatus.PENDING,
      },
    })

    logger.info(`[ADMIN] Document uploaded: ${document.title} (ID: ${document.id})`)

    res.status(201).json({
      message: "Document téléchargé avec succès",
      document,
    })
  } catch (error) {
    logger.error("Erreur lors de l'upload du document:", error)
    res.status(500).json({ error: "Erreur interne lors de l'enregistrement du document" })
  }
}

/**
 * Trigger document ingestion in the background.
 */
export const runIngestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }

    // Check if document exists and its current status
    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      return res.status(404).json({ error: "Document introuvable" })
    }

    if (document.status === IngestionStatus.PROCESSING) {
      return res.status(400).json({ error: "L'ingestion est déjà en cours pour ce document" })
    }

    // Launch ingestion in the background (fire and forget)
    // We don't await this call
    ingestDocument(id).catch((err) => {
      logger.error(`[BACKGROUND_INGESTION_FATAL] Unexpected error for doc ${id}:`, err)
    })

    // Return 202 Accepted immediately
    res.status(202).json({
      message: "Ingestion démarrée avec succès en arrière-plan",
    })
  } catch (error) {
    logger.error("Erreur lors du lancement de l'ingestion:", error)
    res.status(500).json({
      error: "Impossible de lancer l'ingestion",
      message: error instanceof Error ? error.message : "Erreur inconnue",
    })
  }
}
