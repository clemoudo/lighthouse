import request from "supertest"
import { jest } from "@jest/globals"
import { NextFunction, Request, Response } from "express"

// Mock better-auth and its variations before importing server
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

// Mock authMiddleware to bypass authentication in this test
jest.mock("../middlewares/auth", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => next(),
  requireAuth: (req: Request, res: Response, next: NextFunction) => next(),
  requireAdmin: (req: Request, res: Response, next: NextFunction) => next(),
}))

import { createServer } from "../server"
import { prisma } from "@repo/db"

// Mock prisma for integration tests
jest.mock("@repo/db", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
  IngestionStatus: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
  MessageRole: {
    user: "user",
    assistant: "assistant",
  },
  MessageIntent: {
    RAG: "RAG",
    DIRECT: "DIRECT",
  },
  UserRole: {
    admin: "admin",
    user: "user",
  },
}))

describe("GET /api/status", () => {
  const app = createServer()

  it("should return 200 and status ok when database is connected", async () => {
    ;(
      prisma.$queryRaw as jest.Mock<(...args: unknown[]) => Promise<number[]>>
    ).mockResolvedValueOnce([1])

    const response = await request(app).get("/api/status")

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: "ok",
      database: "connected",
    })
  })

  it("should return 503 when database is disconnected", async () => {
    ;(
      prisma.$queryRaw as jest.Mock<(...args: unknown[]) => Promise<unknown>>
    ).mockRejectedValueOnce(new Error("Connection failed"))

    const response = await request(app).get("/api/status")

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({
      status: "error",
      database: "disconnected",
    })
  })
})
