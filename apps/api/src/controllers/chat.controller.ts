import type { Request, Response } from "express"
import { streamText, convertToModelMessages } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { logger } from "@repo/logger"
import { vectorService } from "../services/vector.service"
import { storageService } from "../services/storage.service"

/**
 * Controller to handle RAG-based chat interactions.
 */
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body

    logger.info(`[CHAT] Request received with ${messages?.length} messages.`)

    // 1. Convert UI messages to model messages
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

    // 2. RAG Retrieval Phase
    let context = ""
    if (query) {
      logger.info(`[RAG] Searching context for: "${query}"`)

      // Generate query embedding
      const embedding = await vectorService.generateEmbedding(query)

      // Search for relevant chunks in PostgreSQL
      const relevantChunks = await storageService.searchSimilarChunks(embedding, 5)

      logger.info(`[RAG] Found ${relevantChunks.length} chunks.`)
      relevantChunks.forEach((chunk, i) => {
        logger.info(
          `  #${i + 1} [Sim: ${chunk.similarity.toFixed(4)}] : ${chunk.content.substring(0, 150).replace(/\n/g, " ")}...`,
        )
      })

      context = relevantChunks.map((c) => c.content).join("\n\n---\n\n")
    } else {
      logger.warn("[RAG] No user query found in history.")
    }

    // 3. AI Generation Phase (Streaming)
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
