import type { Request, Response } from "express"
import { streamText, embed, convertToModelMessages } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { logger } from "@repo/logger"
import { prisma, type ChunkSearchResult } from "@repo/db"

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body

    logger.info(`[CHAT] Requête reçue avec ${messages?.length} messages`)

    // 1. Convertir les messages UI en messages modèles
    const modelMessages = await convertToModelMessages(messages)
    const lastUserMessage = [...modelMessages].reverse().find((m) => m.role === "user")

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
}
