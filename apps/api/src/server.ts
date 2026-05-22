import express, { type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import { toNodeHandler } from "better-auth/node"
import createError from "http-errors"
import { logger } from "@repo/logger"
import { prisma } from "@repo/db"
import { auth } from "./lib/auth"
import { authMiddleware } from "./middlewares/auth"
import { apiRateLimiter, authRateLimiter } from "./middlewares/rate-limiter"
import { env } from "./env"
import { ApiError, type ApiErrorResponse, type ErrorCode } from "./types/error"

// Routers
import documentRoutes from "./routes/document.routes"
import chatRoutes from "./routes/chat.routes"
import adminRoutes from "./routes/admin.routes"

export const createServer = (): Express => {
  const app = express()

  // Standard Logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`)
    next()
  })

  // Trust proxy for rate limiting (behind Traefik)
  app.set("trust proxy", 1)

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

  // Global Rate Limiter
  app.use(apiRateLimiter)

  // Better Auth Handler with Auth Rate Limiter
  app.use("/auth", authRateLimiter)
  app.all("/auth/*splat", toNodeHandler(auth))

  app.use(express.json())

  // Authentication Middleware
  app.use(authMiddleware)

  // API Routes
  app.use("/documents", documentRoutes)
  app.use("/chat", chatRoutes)
  app.use("/admin", adminRoutes)

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
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // Determine status code
    let statusCode = 500
    let message = "Internal Server Error"
    let stack: string | undefined
    let details: unknown

    if (err instanceof createError.HttpError) {
      statusCode = err.statusCode
      message = err.message
      stack = err.stack
    } else if (err instanceof Error) {
      message = err.message
      stack = err.stack
    }

    const isApiError = err instanceof ApiError
    if (isApiError) {
      details = err.details
    }

    // Map standard HTTP errors to our codes if not already an ApiError
    let code: ErrorCode = isApiError ? err.code : "INTERNAL_SERVER_ERROR"

    if (!isApiError && createError.isHttpError(err)) {
      if (statusCode === 401) code = "UNAUTHORIZED"
      else if (statusCode === 403) code = "FORBIDDEN"
      else if (statusCode === 404) code = "NOT_FOUND"
      else if (statusCode === 429) code = "RATE_LIMIT_EXCEEDED"
    }

    const response: ApiErrorResponse = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    }

    // Sanitize production errors
    if (statusCode >= 500) {
      logger.error(`[SERVER ERROR] ${message}`, { stack, details })
      if (env.NODE_ENV === "production") {
        response.message = "Internal Server Error"
      }
    } else {
      logger.warn(`[CLIENT ERROR] ${statusCode} - ${message}`)
    }

    res.status(statusCode).json(response)
  })

  return app
}
