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
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
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
    user: {
      paginate: jest.fn(),
    },
    usageRecord: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
  UserRole: { admin: "admin", user: "user" },
  MessageRole: { assistant: "assistant", user: "user" },
  MessageIntent: { RAG: "RAG", DIRECT: "DIRECT" },
  Prisma: {
    sql: jest.fn((strings, ...values) => ({ strings, values })),
    empty: "",
  },
}))

import { createServer } from "../server"
import { prisma, MessageIntent, User } from "@repo/db"

describe("Admin Controller", () => {
  const app = createServer()

  describe("GET /api/admin/stats/users", () => {
    it("should return users usage summary", async () => {
      const mockUsage = [{ userId: "user-1", totalTokens: 1000, count: 5 }]

      const queryRawMock = jest.mocked(prisma.$queryRaw)
      queryRawMock.mockResolvedValue(mockUsage)

      const response = await request(app).get("/api/admin/stats/users")

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].userId).toBe("user-1")
    })
  })

  describe("GET /api/admin/stats/usage", () => {
    it("should return token usage stats", async () => {
      const aggregateMock = jest.mocked(prisma.usageRecord.aggregate)
      aggregateMock.mockResolvedValue({
        _sum: { promptTokens: 600, completionTokens: 400, totalTokens: 1000 },
        _count: { id: 10 },
        _avg: {},
        _min: {},
        _max: {},
      })

      const findManyMock = jest.mocked(prisma.usageRecord.findMany)
      findManyMock.mockResolvedValue([
        {
          id: "usage-1",
          userId: "user-1",
          role: "user",
          model: "gpt-4o",
          intent: MessageIntent.RAG,
          promptTokens: 600,
          completionTokens: 400,
          totalTokens: 1000,
          messageId: "msg-1",
          createdAt: new Date(),
        },
      ])

      const queryRawMock = jest.mocked(prisma.$queryRaw)
      queryRawMock.mockResolvedValue([
        {
          date: "2024-05-22",
          promptTokens: 600,
          completionTokens: 400,
          totalTokens: 1000,
          count: 10,
        },
      ])

      const groupByMock = jest.mocked(prisma.usageRecord.groupBy)
      groupByMock.mockResolvedValue([
        {
          model: "gpt-4o",
          intent: MessageIntent.RAG,
          _sum: { totalTokens: 1000 },
          _count: { id: 10 },
        },
      ])

      const response = await request(app).get("/api/admin/stats/usage")

      expect(response.status).toBe(200)
      expect(response.body.summary.totalTokens).toBe(1000)
    })
  })
})
