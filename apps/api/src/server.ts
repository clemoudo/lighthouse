import express, { type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import { toNodeHandler } from "better-auth/node"
import { logger } from "@repo/logger"
import { prisma } from "@repo/db"
import { auth } from "./lib/auth"
import { authMiddleware, requireAuth } from "./middlewares/auth"

export const createServer = (): Express => {
  const app = express()

  // 1. CORS MUST BE FIRST
  // In development, origin: true reflects the request origin, which bypasses CORS issues
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Accept"],
    }),
  )

  // 2. DEBUG LOGS (Right after CORS)
  app.use((req, _res, next) => {
    logger.info(
      `[Incoming] ${req.method} ${req.url} - Origin: ${req.headers.origin || "no-origin"}`,
    )
    next()
  })

  // 3. HELMET (Relaxed for development)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  )

  // Better Auth Handler
  const authHandler = toNodeHandler(auth)
  app.all("/auth/*splat", authHandler)
  app.all("/api/auth/*splat", authHandler)

  app.use(express.json())

  // Authentication Middleware
  app.use(authMiddleware)

  // Auth Status Test Route
  app.get("/auth-check", async (req: Request, res: Response) => {
    res.json({
      authenticated: !!req.user,
      user: req.user,
    })
  })

  // Protected Profile Route
  app.get("/me", requireAuth, async (req: Request, res: Response) => {
    res.json({
      user: req.user,
    })
  })

  // Health / Status Route
  app.get("/status", async (_req: Request, res: Response) => {
    try {
      // Check DB connection
      await prisma.$queryRaw`SELECT 1`
      res.json({
        status: "ok",
        uptime: process.uptime(),
        database: "connected",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error("Health check failed:", error)
      res.status(503).json({
        status: "error",
        database: "disconnected",
      })
    }
  })

  // Error Handling
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled error:", err)
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  })

  return app
}
