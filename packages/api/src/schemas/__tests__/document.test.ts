import {
  DocumentSchema,
  CreateDocumentRequestSchema,
  ListDocumentsResponseSchema,
} from "../document"

describe("Document Schemas", () => {
  const validDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Programme Scolaire",
    filename: "programme.pdf",
    filePath: "uploads/programme.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    status: "PENDING",
    error: null,
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-20T10:00:00Z",
  }

  describe("DocumentSchema", () => {
    it("should validate a valid document", () => {
      expect(DocumentSchema.parse(validDocument)).toEqual(validDocument)
    })

    it("should fail on invalid UUID", () => {
      const invalid = { ...validDocument, id: "invalid" }
      expect(() => DocumentSchema.parse(invalid)).toThrow()
    })

    it("should fail on invalid status", () => {
      const invalid = { ...validDocument, status: "INVALID" }
      expect(() => DocumentSchema.parse(invalid)).toThrow()
    })

    it("should allow null error", () => {
      const valid = { ...validDocument, error: null }
      expect(DocumentSchema.parse(valid)).toEqual(valid)
    })

    it("should allow string error", () => {
      const valid = { ...validDocument, error: "Something went wrong" }
      expect(DocumentSchema.parse(valid)).toEqual(valid)
    })
  })

  describe("CreateDocumentRequestSchema", () => {
    it("should validate a valid request with title", () => {
      const valid = {
        title: "New Doc",
        file: "binary-content",
      }
      expect(CreateDocumentRequestSchema.parse(valid)).toEqual(valid)
    })

    it("should validate a valid request without title", () => {
      const valid = {
        file: "binary-content",
      }
      expect(CreateDocumentRequestSchema.parse(valid)).toEqual(valid)
    })
  })

  describe("ListDocumentsResponseSchema", () => {
    it("should validate a valid response", () => {
      const valid = {
        documents: [validDocument],
        meta: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      }
      expect(ListDocumentsResponseSchema.parse(valid)).toEqual(valid)
    })
  })
})
