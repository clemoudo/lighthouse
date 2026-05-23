import { mistral } from "@ai-sdk/mistral"
import { embed, embedMany } from "ai"
import { logger } from "@repo/logger"

export class VectorService {
  /**
   * Generate an embedding for a single text query.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: mistral.embedding("mistral-embed"),
      value: text,
    })
    return embedding
  }

  /**
   * Generate embeddings for multiple text chunks.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    logger.info(`[VECTOR] Generating embeddings for ${texts.length} chunks.`)
    const { embeddings } = await embedMany({
      model: mistral.embedding("mistral-embed"),
      values: texts,
    })
    return embeddings
  }
}

export const vectorService = new VectorService()
