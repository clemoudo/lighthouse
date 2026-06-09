import request from "supertest"
import { jest } from "@jest/globals"
import { NextFunction, Request, Response } from "express"

// Mock better-auth
jest.mock("better-auth", () => ({ betterAuth: jest.fn() }))
jest.mock("better-auth/plugins", () => ({ admin: jest.fn(), emailOTP: jest.fn() }))
jest.mock("better-auth/api", () => ({
  createAuthEndpoint: jest.fn(),
  sessionMiddleware: jest.fn(),
}))
jest.mock("better-auth/adapters/prisma", () => ({ prismaAdapter: jest.fn() }))
jest.mock("better-auth/node", () => ({
  toNodeHandler: jest.fn(() => (req: Request, res: Response) => res.end()),
}))

// Mock authMiddleware
jest.mock("../middlewares/auth", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      banned: false,
    } as User
    next()
  },
  requireAuth: (req: Request, res: Response, next: NextFunction) => next(),
  requireAdmin: (req: Request, res: Response, next: NextFunction) => next(),
}))

// Mock repo/db
jest.mock("@repo/db", () => ({
  prisma: {
    document: {
      paginate: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
  IngestionStatus: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
  UserRole: { admin: "admin", user: "user" },
}))

import { createServer } from "../server"
import { prisma, IngestionStatus, User } from "@repo/db"

describe("Document Controller", () => {
  const app = createServer()

  const mockDocumentBase = {
    id: "doc-1",
    title: "Document 1",
    filename: "doc1.pdf",
    filePath: "uploads/doc1.pdf",
    fileSize: 100,
    mimeType: "application/pdf",
    status: IngestionStatus.PENDING,
    error: null,
    parsedContent: [{ markdown: "hello", pageNumber: 1, printedPageNumber: "1" }],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe("GET /api/documents", () => {
    it("should return a list of documents", async () => {
      const mockDocuments = [mockDocumentBase]

      const paginateMock = jest.mocked(prisma.document.paginate)
      paginateMock.mockResolvedValue({
        data: [mockDocuments],
        meta: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      })

      const response = await request(app).get("/api/documents")

      expect(response.status).toBe(200)
      expect(response.body.documents).toHaveLength(1)
      expect(response.body.documents[0][0].id).toBe("doc-1")
    })
  })

  describe("DELETE /api/documents/:id", () => {
    it("should delete a document", async () => {
      const findUniqueMock = jest.mocked(prisma.document.findUnique)
      findUniqueMock.mockResolvedValue(mockDocumentBase)

      const deleteMock = jest.mocked(prisma.document.delete)
      deleteMock.mockResolvedValue(mockDocumentBase)

      const response = await request(app).delete("/api/documents/doc-1")

      expect(response.status).toBe(200) // Controller returns 200 with message for success delete in document.controller.ts
    })

    it("should return 404 if document is not found", async () => {
      const findUniqueMock = jest.mocked(prisma.document.findUnique)
      findUniqueMock.mockResolvedValue(null)

      const response = await request(app).delete("/api/documents/non-existent")

      expect(response.status).toBe(404)
    })
  })
})
