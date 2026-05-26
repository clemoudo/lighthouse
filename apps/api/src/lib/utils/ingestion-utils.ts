import { type ParsedPage, type ChunkMetadata } from "@repo/db"

export interface SaveChunksParams {
  content: string | null
  embedding: number[] | null
  documentId: string
  metadata?: ChunkMetadata
}

/**
 * Generates the HTML template for admin notifications.
 * Pure function.
 */
export function generateIngestionEmailHtml(
  documentTitle: string,
  status: "SUCCESS" | "FAILURE",
  error?: string,
): string {
  const isSuccess = status === "SUCCESS"
  return `
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
      `
}

/**
 * Maps parsed pages and embeddings to chunk parameters for storage.
 * Pure function.
 */
export function mapPagesToChunks(
  pages: ParsedPage[],
  embeddings: number[][],
  documentId: string,
  documentTitle: string,
): SaveChunksParams[] {
  let embeddingIndex = 0
  return pages.map((page) => {
    const isEmpty = page.markdown.trim().length === 0

    return {
      content: isEmpty ? null : page.markdown,
      embedding: isEmpty ? null : embeddings[embeddingIndex++],
      documentId: documentId,
      metadata: {
        pdfPageNumber: page.pageNumber,
        printedPageNumber: page.printedPageNumber,
        source: documentTitle,
      },
    }
  })
}
