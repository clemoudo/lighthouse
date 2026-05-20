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
        // 1. Extract query from last user message
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

        if (!query) {
          logger.warn("[CHAT] No user query found.")
          const result = await streamText({
            model: mistral("mistral-small-latest"),
            system: chatService.getDirectSystemPrompt(),
            messages: modelMessages,
          })
          return writer.merge(result.toUIMessageStream())
        }

        // 2. Intent Classification Phase
        logger.info(`[CHAT] Classifying intent for: "${query}"`)
        const { needsRAG, reasoning } = await chatService.classifyIntent(query)
        logger.info(`[CHAT] Intent: ${needsRAG ? "RAG" : "DIRECT"} (Reason: ${reasoning})`)

        if (needsRAG) {
          // 3a. RAG Path (Mistral Large + Retrieval)
          const embedding = await vectorService.generateEmbedding(query)
          const relevantChunks = await storageService.searchSimilarChunks(embedding, 5)

          logger.info(`[RAG] Found ${relevantChunks.length} chunks.`)

          writer.write({
            type: "data-sources",
            data: chatService.formatSourcesForUI(relevantChunks),
          })

          const context = chatService.formatRAGContext(relevantChunks)
          const result = await streamText({
            model: mistral("mistral-large-latest"),
            system: chatService.getSystemPrompt(context),
            messages: modelMessages,
          })
          writer.merge(result.toUIMessageStream())
        } else {
          // 3b. Direct Path (Mistral Small)
          const result = await streamText({
            model: mistral("mistral-small-latest"),
            system: chatService.getDirectSystemPrompt(),
            messages: modelMessages,
          })
          writer.merge(result.toUIMessageStream())
        }
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
