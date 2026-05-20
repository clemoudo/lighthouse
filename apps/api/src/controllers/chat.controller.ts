import type { Request, Response } from "express"
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
} from "ai"
import { mistral } from "@ai-sdk/mistral"
import { logger } from "@repo/logger"
import { vectorService } from "../services/vector.service"
import { storageService } from "../services/storage.service"
import { chatService } from "../services/chat.service"

const MAX_MESSAGES = 10

/**
 * Controller to handle RAG-based chat interactions.
 */
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body
    const limitedMessages = messages?.slice(-MAX_MESSAGES) ?? []

    logger.info(
      `[CHAT] Request received with ${messages?.length} messages (limited to last ${MAX_MESSAGES}).`,
    )

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // 1. Convert UI messages to model messages
        const modelMessages = await convertToModelMessages(limitedMessages)
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

          // Write formatted sources to the stream for the UI
          writer.write({
            type: "data-sources",
            data: chatService.formatSourcesForUI(relevantChunks),
          })

          relevantChunks.forEach((chunk, i) => {
            logger.info(
              `  #${i + 1} [Sim: ${chunk.similarity.toFixed(4)}] : ${chunk.content.substring(0, 150).replace(/\n/g, " ")}...`,
            )
          })

          // Build context for the AI
          context = chatService.formatRAGContext(relevantChunks)
        } else {
          logger.warn("[RAG] No user query found in history.")
        }

        // 3. AI Generation Phase (Streaming)
        const result = await streamText({
          model: mistral("mistral-large-latest"),
          system: chatService.getSystemPrompt(context),
          messages: modelMessages,
        })

        writer.merge(result.toUIMessageStream())
      },
    })

    pipeUIMessageStreamToResponse({
      response: res,
      stream,
    })
  } catch (error) {
    logger.error("[CHAT_ERROR]", error)
    res.status(500).json({ error: "Erreur lors de la génération de la réponse" })
  }
}
