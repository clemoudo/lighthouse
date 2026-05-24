import type { Request, Response } from "express"
import fs from "node:fs/promises"
import path from "node:path"
import { prisma, IngestionStatus } from "@repo/db"
import { logger } from "@repo/logger"
import { PaginationQuerySchema } from "@repo/api"
import { ingestDocument } from "../services/ingestion.service"
import { storageService } from "../services/storage.service"
import { ApiError } from "../types/error"

export const listDocuments = async (req: Request, res: Response) => {
  const { page, pageSize } = PaginationQuerySchema.parse(req.query)

  const { data, meta } = await prisma.document.paginate({
    orderBy: { createdAt: "desc" },
    page,
    pageSize,
    select: {
      id: true,
      title: true,
      filename: true,
      filePath: true,
      fileSize: true,
      mimeType: true,
      status: true,
      error: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  res.json({
    documents: data,
    meta,
  })
}

/**
 * Serves the physical PDF file for a document.
 */
export const getDocumentFile = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  const document = await prisma.document.findUnique({
    where: { id },
  })

  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document introuvable")
  }

  const absolutePath = path.resolve(document.filePath)

  // Verify file exists on disk
  try {
    await fs.access(absolutePath)
  } catch (err) {
    logger.error(`[ADMIN] File not found on disk: ${absolutePath}`, err)
    throw new ApiError(404, "NOT_FOUND", "Fichier physique introuvable")
  }

  // Add cache headers for performance (1 day)
  res.setHeader("Cache-Control", "private, max-age=86400")
  res.setHeader("Content-Type", document.mimeType)

  res.sendFile(absolutePath)
}

export const uploadDocument = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "VALIDATION_ERROR", "Aucun fichier n'a été téléchargé")
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
}

/**
 * Delete a document and its associated data (DB + Filesystem).
 */
export const deleteDocument = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  const document = await prisma.document.findUnique({
    where: { id },
  })

  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document introuvable")
  }

  // 1. Delete from DB (Cascade will handle chapters/chunks)
  await storageService.deleteDocument(id)

  // 2. Delete physical file
  try {
    await fs.unlink(document.filePath)
    logger.info(`[ADMIN] Deleted physical file: ${document.filePath}`)
  } catch (err) {
    // We log but don't fail the request if file is already gone
    logger.error(`[ADMIN] Could not delete physical file: ${document.filePath}`, err)
  }

  res.json({ message: "Document supprimé avec succès" })
}

/**
 * Trigger document ingestion in the background.
 */
export const runIngestion = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  // Check if document exists and its current status
  const document = await prisma.document.findUnique({
    where: { id },
  })

  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document introuvable")
  }

  if (document.status === IngestionStatus.PROCESSING) {
    throw new ApiError(400, "VALIDATION_ERROR", "L'ingestion est déjà en cours pour ce document")
  }

  // Launch ingestion in the background (fire and forget)
  ingestDocument(id).catch((err) => {
    logger.error(`[BACKGROUND_INGESTION_FATAL] Unexpected error for doc ${id}:`, err)
  })

  // Return 202 Accepted immediately
  res.status(202).json({
    message: "Ingestion démarrée avec succès en arrière-plan",
  })
}
