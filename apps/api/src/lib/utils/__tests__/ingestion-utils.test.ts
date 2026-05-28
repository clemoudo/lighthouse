import {
  generateIngestionEmailHtml,
  mapPagesToChunks,
  filterPagesForEmbedding,
} from "../ingestion-utils"
import { type ParsedPage } from "@repo/db"

describe("ingestion-utils", () => {
  describe("generateIngestionEmailHtml", () => {
    it("should generate success email", () => {
      const html = generateIngestionEmailHtml("Test Doc", "SUCCESS")
      expect(html).toContain("terminée avec succès")
      expect(html).toContain("Test Doc")
      expect(html).toContain("COMPLETED")
    })

    it("should generate failure email with error", () => {
      const html = generateIngestionEmailHtml("Test Doc", "FAILURE", "Something went wrong")
      expect(html).toContain("échouée")
      expect(html).toContain("Something went wrong")
      expect(html).toContain("FAILED")
    })
  })

  describe("filterPagesForEmbedding", () => {
    it("should filter out empty or whitespace-only pages", () => {
      const pages: ParsedPage[] = [
        { pageNumber: 1, printedPageNumber: undefined, markdown: "Content" },
        { pageNumber: 2, printedPageNumber: undefined, markdown: "  " },
        { pageNumber: 3, printedPageNumber: undefined, markdown: "" },
        { pageNumber: 4, printedPageNumber: undefined, markdown: "More Content" },
      ]
      const filtered = filterPagesForEmbedding(pages)
      expect(filtered).toHaveLength(2)
      expect(filtered[0].pageNumber).toBe(1)
      expect(filtered[1].pageNumber).toBe(4)
    })
  })

  describe("mapPagesToChunks", () => {
    it("should map pages and embeddings correctly", () => {
      const pages: ParsedPage[] = [
        { pageNumber: 1, printedPageNumber: undefined, markdown: "Page 1 content" },
        { pageNumber: 2, printedPageNumber: "2", markdown: "" }, // Empty page
        { pageNumber: 3, printedPageNumber: "3", markdown: "Page 3 content" },
      ]
      const embeddings = [
        [0.1, 0.2],
        [0.3, 0.4],
      ]
      const docId = "doc-123"
      const docTitle = "My Document"

      const chunks = mapPagesToChunks(pages, embeddings, docId, docTitle)

      expect(chunks).toHaveLength(3)

      // Page 1
      expect(chunks[0].content).toBe("Page 1 content")
      expect(chunks[0].embedding).toEqual([0.1, 0.2])
      expect(chunks[0].metadata?.pdfPageNumber).toBe(1)

      // Page 2 (Empty)
      expect(chunks[1].content).toBeNull()
      expect(chunks[1].embedding).toBeNull()

      // Page 3
      expect(chunks[2].content).toBe("Page 3 content")
      expect(chunks[2].embedding).toEqual([0.3, 0.4])
      expect(chunks[2].metadata?.pdfPageNumber).toBe(3)
    })
  })
})
