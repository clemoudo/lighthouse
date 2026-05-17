import express, { type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import multer from "multer"
import fs from "node:fs"
import { toNodeHandler } from "better-auth/node"
import { streamText, embed, convertToModelMessages } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { logger } from "@repo/logger"
import { prisma, type ChunkSearchResult } from "@repo/db"
import { auth } from "./lib/auth"
import { authMiddleware, requireAuth, requireAdmin } from "./middlewares/auth"
import { env } from "./env"
import { ingestDocument } from "./lib/ingestion"

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

  // Chat: RAG Endpoint
  app.post("/chat", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body

      logger.info(`[CHAT] Requête reçue avec ${messages?.length} messages`)

      // 1. Convertir les messages UI en messages modèles pour extraire le contenu proprement
      const modelMessages = await convertToModelMessages(messages)
      const lastUserMessage = [...modelMessages].reverse().find((m) => m.role === "user")

      // En v5, le contenu peut être une chaîne ou un tableau d'objets
      let query = ""
      if (lastUserMessage) {
        if (typeof lastUserMessage.content === "string") {
          query = lastUserMessage.content
        } else if (Array.isArray(lastUserMessage.content)) {
          query = lastUserMessage.content
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join(" ")
        }
      }

      // 2. RAG : Recherche de contexte
      let context = ""
      if (query) {
        logger.info(`[RAG] Recherche pour la question : "${query}"`)

        const { embedding } = await embed({
          model: mistral.embedding("mistral-embed"),
          value: query,
        })

        const relevantChunks: ChunkSearchResult[] = await prisma.chunk.search(embedding, 5)

        logger.info(`[RAG] ${relevantChunks.length} chunks trouvés`)
        relevantChunks.forEach((chunk, i) => {
          logger.info(
            `  #${i + 1} [Sim: ${chunk.similarity.toFixed(4)}] : ${chunk.content.substring(0, 150).replace(/\n/g, " ")}...`,
          )
        })

        context = relevantChunks.map((c) => c.content).join("\n\n---\n\n")
      } else {
        logger.warn("[RAG] Aucune question utilisateur trouvée dans l'historique")
      }

      // 3. Streaming de la réponse via Vercel AI SDK
      const result = await streamText({
        model: mistral("mistral-large-latest"),
        system: `Tu es l'assistant Lighthouse, expert du programme scolaire belge (Pacte pour un Enseignement d'excellence). 
Ton rôle est d'aider les institutrices maternelles à planifier leurs activités en t'appuyant EXCLUSIVEMENT sur le contexte fourni ci-dessous.
Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas.
Réponds de manière pédagogique, bienveillante et structurée.

CONTEXTE :
${context}`,
        messages: modelMessages,
      })

      return result.pipeUIMessageStreamToResponse(res)
    } catch (error) {
      logger.error("[CHAT_ERROR]", error)
      res.status(500).json({ error: "Erreur lors de la génération de la réponse" })
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

  // Admin: Ingest Document
  app.post("/admin/documents/:id/ingest", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string }
      const result = await ingestDocument(id)

      res.json({
        message: "Ingestion réussie",
        ...result,
      })
    } catch (error) {
      logger.error("Erreur lors de l'ingestion du document:", error)
      res.status(500).json({
        error: "Échec de l'ingestion IA",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      })
    }
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
