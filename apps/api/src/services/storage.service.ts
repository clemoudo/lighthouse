import { prisma, type ChunkSearchResult } from "@repo/db"
import { logger } from "@repo/logger"

export interface SaveChunksParams {
  content: string
  embedding: number[]
  chapterId: string
  metadata?: Record<string, unknown>
}

export class StorageService {
  /**
   * Create a chapter for a document.
   */
  async createChapter(documentId: string, title: string, order: number, content: string) {
    return prisma.chapter.create({
      data: {
        title,
        order,
        content,
        documentId,
      },
    })
  }

  /**
   * Bulk insert chunks with their vectors using the Prisma extension.
   */
  async saveChunksWithVectors(chunks: SaveChunksParams[]) {
    logger.info(`[STORAGE] Saving ${chunks.length} chunks to database.`)
    return prisma.chunk.createManyWithVectors(chunks)
  }

  /**
   * Search for relevant chunks using vector similarity.
   */
  async searchSimilarChunks(embedding: number[], limit = 5): Promise<ChunkSearchResult[]> {
    return prisma.chunk.search(embedding, limit)
  }
}

export const storageService = new StorageService()
