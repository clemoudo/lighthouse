import { prisma, type ChunkSearchResult, type ChunkMetadata } from "@repo/db"
import { logger } from "@repo/logger"

export interface SaveChunksParams {
  content: string | null
  embedding: number[] | null
  documentId: string
  metadata?: ChunkMetadata
}

export class StorageService {
  /**
   * Bulk insert chunks with their vectors using the Prisma extension.
   */
  async saveChunksWithVectors(chunks: SaveChunksParams[]) {
    logger.info(`[STORAGE] Saving ${chunks.length} chunks to database.`)
    return prisma.chunk.createManyWithVectors(chunks)
  }

  /**
   * Remove all chunks associated with a document.
   * Useful for re-ingestion.
   */
  async deleteDocumentData(documentId: string) {
    logger.info(`[STORAGE] Cleaning existing RAG data for document: ${documentId}`)
    return prisma.chunk.deleteMany({
      where: { documentId },
    })
  }

  /**
   * Delete a document record from the database.
   * Cascade will handle chunks.
   */
  async deleteDocument(documentId: string) {
    logger.info(`[STORAGE] Deleting document record: ${documentId}`)
    return prisma.document.delete({
      where: { id: documentId },
    })
  }

  /**
   * Search for relevant chunks using vector similarity.
   */
  async searchSimilarChunks(embedding: number[], limit = 5): Promise<ChunkSearchResult[]> {
    return prisma.chunk.search(embedding, limit)
  }
}

export const storageService = new StorageService()
