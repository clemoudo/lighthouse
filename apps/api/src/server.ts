import express, { type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import multer from "multer"
import fs from "node:fs"
import { toNodeHandler } from "better-auth/node"
import { logger } from "@repo/logger"
import { prisma } from "@repo/db"
import { auth } from "./lib/auth"
import { authMiddleware, requireAuth, requireAdmin } from "./middlewares/auth"
import { env } from "./env"

export const createServer = (): Express => {
  const app = express()

  // Ensure upload directory exists
  if (!fs.existsSync(env.UPLOAD_DIR)) {
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true })
  }

  // Multer Configuration
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, env.UPLOAD_DIR)
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      cb(null, `${uniqueSuffix}-${file.originalname}`)
    },
  })

  const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === "application/pdf") {
        cb(null, true)
      } else {
        cb(new Error("Seuls les fichiers PDF sont autorisés"))
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  })

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

  // Documents: List
  app.get("/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const documents = await prisma.document.findMany({
        orderBy: { createdAt: "desc" },
      })
      res.json({ documents })
    } catch (error) {
      logger.error("Erreur lors de la récupération des documents:", error)
      res.status(500).json({ error: "Erreur interne" })
    }
  })

  // Admin: Upload Document
  app.post(
    "/admin/documents",
    requireAdmin,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Aucun fichier n'a été téléchargé" })
        }

        const { title } = req.body

        const document = await prisma.document.create({
          data: {
            title: title || req.file.originalname,
            filename: req.file.filename,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
          },
        })

        logger.info(`[ADMIN] Document uploaded: ${document.title} (ID: ${document.id})`)

        res.status(201).json({
          message: "Document téléchargé avec succès",
          document,
        })
      } catch (error) {
        logger.error("Erreur lors de l'upload du document:", error)
        res.status(500).json({ error: "Erreur interne lors de l'enregistrement du document" })
      }
    },
  )

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
