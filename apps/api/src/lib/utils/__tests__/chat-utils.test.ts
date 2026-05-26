import { formatRAGContext, formatSourcesForUI } from "../chat-utils"
import { type ChunkSearchResult } from "@repo/db"

describe("chat-utils", () => {
  describe("formatRAGContext", () => {
    it("should return empty string if no chunks", () => {
      expect(formatRAGContext([])).toBe("")
    })

    it("should format chunks correctly", () => {
      const chunks: ChunkSearchResult[] = [
        {
          id: "1",
          content: "Content 1",
          documentId: "doc1",
          metadata: { source: "Doc 1", pdfPageNumber: 10 },
          similarity: 0.9,
        },
        {
          id: "2",
          content: "Content 2",
          documentId: "doc2",
          metadata: { source: "Doc 2", pdfPageNumber: 20 },
          similarity: 0.8,
        },
      ]
      const result = formatRAGContext(chunks)
      expect(result).toContain("[Source 1]: Doc 1 (Page: 10)")
      expect(result).toContain("Content 1")
      expect(result).toContain("[Source 2]: Doc 2 (Page: 20)")
      expect(result).toContain("Content 2")
      expect(result).toContain("---")
    })
  })

  describe("formatSourcesForUI", () => {
    it("should format chunks to ChatSource[]", () => {
      const chunks: ChunkSearchResult[] = [
        {
          id: "1",
          content: "C1",
          documentId: "doc-id-1",
          metadata: { source: "Doc Name", pdfPageNumber: 5 },
          similarity: 0.95,
        },
      ]
      const result = formatSourcesForUI(chunks)
      expect(result).toEqual([
        {
          id: "doc-id-1",
          source: "Doc Name",
          page: 5,
        },
      ])
    })
  })
})
