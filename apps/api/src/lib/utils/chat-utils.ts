import { type ChunkSearchResult } from "@repo/db"
import { type ChatSource } from "@repo/api"

/**
 * Formats the context chunks into a single string with source markers.
 * Pure function: depends only on inputs.
 */
export function formatRAGContext(chunks: ChunkSearchResult[]): string {
  if (chunks.length === 0) return ""

  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}]: ${c.metadata.source} (Page: ${c.metadata.pdfPageNumber})\n${c.content}`,
    )
    .join("\n\n---\n\n")
}

/**
 * Formats sources for the frontend.
 * Pure function: depends only on inputs.
 */
export function formatSourcesForUI(chunks: ChunkSearchResult[]): ChatSource[] {
  return chunks.map((chunk) => ({
    id: chunk.documentId,
    source: chunk.metadata.source,
    page: chunk.metadata.pdfPageNumber,
  }))
}
