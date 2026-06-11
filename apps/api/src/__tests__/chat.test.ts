import request from "supertest"
import { jest } from "@jest/globals"
import { NextFunction, Request, Response } from "express"

// Mock better-auth
jest.mock("better-auth", () => ({ betterAuth: jest.fn() }))
jest.mock("better-auth/plugins", () => ({
  admin: jest.fn(),
  emailOTP: jest.fn(),
  anonymous: jest.fn(),
}))
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
    conversation: {
      paginate: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
  MessageRole: { user: "user", assistant: "assistant" },
  MessageIntent: { RAG: "RAG", DIRECT: "DIRECT" },
  UserRole: { admin: "admin", user: "user" },
}))

import { createServer } from "../server"
import { prisma } from "@repo/db"
import type { Conversation, Message, PaginatedResult, User } from "@repo/db"

describe("Chat Controller", () => {
  const app = createServer()

  describe("GET /api/chat/conversations", () => {
    it("should return a list of conversations", async () => {
      const mockConversations: Conversation[] = [
        {
          id: "conv-1",
          title: "Discussion 1",
          userId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const paginateMock = jest.mocked(prisma.conversation.paginate)
      paginateMock.mockResolvedValue({
        data: [mockConversations],
        meta: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      } as PaginatedResult<Conversation[]>)

      const response = await request(app).get("/api/chat/conversations")

      expect(response.status).toBe(200)
      expect(response.body.conversations).toHaveLength(1)
      expect(response.body.conversations[0][0].id).toBe("conv-1")
    })
  })

  describe("GET /api/chat/conversations/:id", () => {
    it("should return a specific conversation with messages", async () => {
      const mockConversation = {
        id: "conv-1",
        title: "Discussion 1",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: "msg-1",
            role: "user" as const,
            content: "Hello",
            conversationId: "conv-1",
            createdAt: new Date(),
            sources: null,
          },
        ],
      }

      const findFirstMock = jest.mocked(prisma.conversation.findFirst)
      findFirstMock.mockResolvedValue(mockConversation as Conversation & { messages: Message[] })

      const response = await request(app).get("/api/chat/conversations/conv-1")

      expect(response.status).toBe(200)
      expect(response.body.id).toBe("conv-1")
      expect(response.body.messages).toHaveLength(1)
    })

    it("should return 404 if conversation is not found", async () => {
      const findFirstMock = jest.mocked(prisma.conversation.findFirst)
      findFirstMock.mockResolvedValue(null)

      const response = await request(app).get("/api/chat/conversations/non-existent")

      expect(response.status).toBe(404)
    })
  })

  describe("DELETE /api/chat/conversations/:id", () => {
    it("should delete a conversation", async () => {
      const findFirstMock = jest.mocked(prisma.conversation.findFirst)
      findFirstMock.mockResolvedValue({
        id: "conv-1",
        userId: "user-1",
        title: "Discussion 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Conversation)

      const deleteMock = jest.mocked(prisma.conversation.delete)
      deleteMock.mockResolvedValue({
        id: "conv-1",
        userId: "user-1",
        title: "Discussion 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Conversation)

      const response = await request(app).delete("/api/chat/conversations/conv-1")

      expect(response.status).toBe(204)
      expect(deleteMock).toHaveBeenCalledWith({ where: { id: "conv-1" } })
    })
  })
})
