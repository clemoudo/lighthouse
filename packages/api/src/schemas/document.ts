import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { PaginationMetaSchema } from "./common"

extendZodWithOpenApi(z)

export const IngestionStatusSchema = z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"])

export const DocumentSchema = z
  .object({
    id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    title: z.string().openapi({ example: "Programme Scolaire - Volume 1" }),
    filename: z.string().openapi({ example: "programme_v1.pdf" }),
    filePath: z.string().openapi({ example: "uploads/programme_v1.pdf" }),
    fileSize: z.number().openapi({ example: 1024567 }),
    mimeType: z.string().openapi({ example: "application/pdf" }),
    status: IngestionStatusSchema.openapi({ example: "PENDING" }),
    error: z.string().nullable().openapi({ example: null }),
    createdAt: z.iso.datetime().openapi({ example: "2024-03-20T10:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-03-20T10:00:00Z" }),
  })
  .openapi("Document")

export const CreateDocumentRequestSchema = z
  .object({
    title: z.string().optional().openapi({ example: "Programme Scolaire - Volume 1" }),
    file: z
      .any()
      .openapi({ type: "string", format: "binary", description: "Le fichier PDF à uploader" }),
  })
  .openapi("CreateDocumentRequest")

export const CreateDocumentResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Document téléchargé avec succès" }),
    document: DocumentSchema,
  })
  .openapi("CreateDocumentResponse")

export const ListDocumentsResponseSchema = z
  .object({
    documents: z.array(DocumentSchema).openapi({ description: "Liste des documents" }),
    meta: PaginationMetaSchema,
  })
  .openapi("ListDocumentsResponse")

export const IngestDocumentResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Ingestion démarrée avec succès" }),
  })
  .openapi("IngestDocumentResponse")
