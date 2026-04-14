import express, { type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import { toNodeHandler } from "better-auth/node"
import { logger } from "@repo/logger"
import { prisma } from "@repo/db"
import { auth } from "./lib/auth"

export const createServer = (): Express => {
  const app = express()

  // Security & Middleware
  app.use(helmet())
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(","),
      credentials: true,
    }),
  )

  // Better Auth Handler (Must be before express.json())
  app.all("/auth/*splat", toNodeHandler(auth))

  app.use(express.json())

  // Logging Middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`)
    next()
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
