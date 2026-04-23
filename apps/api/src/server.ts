import express, { type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import { toNodeHandler } from "better-auth/node"
import { logger } from "@repo/logger"
import { prisma } from "@repo/db"
import { auth } from "./lib/auth"
import { authMiddleware, requireAuth } from "./middlewares/auth"
import { env } from "./env"

export const createServer = (): Express => {
  const app = express()

  // Security & Middleware
  app.use(helmet())

  const formattedOrigins = env.ALLOWED_ORIGINS.flatMap((origin) => [
    `http://${origin}`,
    `https://${origin}`,
  ])

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || formattedOrigins.includes(origin) || env.NODE_ENV === "development") {
          callback(null, true)
        } else {
          logger.warn(`[CORS REJECTED] Origin: "${origin}" not in [${formattedOrigins.join(", ")}]`)
          callback(new Error("Not allowed by CORS"))
        }
      },
      credentials: true,
    }),
  )

  // Better Auth Handler
  app.all("/auth/*splat", toNodeHandler(auth))

  app.use(express.json())

  // Authentication Middleware
  app.use(authMiddleware)

  // Standard Logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`)
    next()
  })

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
      message: env.NODE_ENV === "development" ? err.message : undefined,
    })
  })

  return app
}
