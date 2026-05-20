import type { Request, Response } from "express"
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  type ModelMessage,
} from "ai"
import { mistral } from "@ai-sdk/mistral"
import { prisma, MessageRole, MessageIntent, type ChunkSearchResult } from "@repo/db"
import { logger } from "@repo/logger"
import { vectorService } from "../services/vector.service"
import { storageService } from "../services/storage.service"
import { chatService } from "../services/chat.service"

const MAX_MESSAGES = 10

/**
 * Controller to handle RAG-based chat interactions with persistence and monitoring.
 */
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { messages, conversationId: existingConversationId } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // 1. Manage Conversation & Ownership
    let conversationId = existingConversationId
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      })
      if (!conversation) {
        logger.warn(
          `[CHAT] Unauthorized access attempt to conversation ${conversationId} by user ${userId}`,
        )
        return res.status(403).json({ error: "Conversation introuvable ou accès refusé" })
      }
    } else {
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: "Nouvelle discussion",
        },
      })
      conversationId = conversation.id
    }

    // 2. Process History
    // If messages are empty or only contain the latest, try to recover from DB
    let modelMessages: ModelMessage[] = []
    if (messages && messages.length > 1) {
      modelMessages = await convertToModelMessages(messages.slice(-MAX_MESSAGES))
    } else {
      // Load history from DB
      const dbMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: MAX_MESSAGES,
      })

      modelMessages = dbMessages.reverse().map((m) => ({
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
      }))

      // If there's a new message in the request not in DB yet, append it
      if (messages && messages.length === 1) {
        const latestRequestMessage = await convertToModelMessages(messages)
        modelMessages.push(...latestRequestMessage)
      }
    }

    // 3. Extract last user query
    const lastUserMessage = [...modelMessages].reverse().find((m) => m.role === "user")

    let query = ""
    if (lastUserMessage) {
      if (typeof lastUserMessage.content === "string") {
        query = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        query = lastUserMessage.content
          .filter((part) => part.type === "text")
          .map((part) => (part.type === "text" ? part.text : ""))
          .join(" ")
      }

      // Persist user message only if it's not already in history (from request)
      // Actually, if it was in history, it should be in DB.
      // If messages.length > 1, the frontend sent it, but we might not have it in DB yet.
      // To simplify: if it's a new request with messages, we save the last one.
      if (messages && messages.length > 0) {
        await prisma.message.create({
          data: {
            conversationId,
            role: MessageRole.USER,
            content: query,
          },
        })
      }
    }

    logger.info(`[CHAT] Request for conversation ${conversationId} from user ${userId}`)

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        if (!query) {
          logger.warn("[CHAT] No user query found.")
          const result = await streamText({
            model: mistral("mistral-small-latest"),
            system: chatService.getDirectSystemPrompt(),
            messages: modelMessages,
          })
          return writer.merge(result.toUIMessageStream())
        }

        // 4. Intent Classification Phase
        logger.info(`[CHAT] Classifying intent for: "${query}"`)
        const { intent, usage: classificationUsage } = await chatService.classifyIntent(query)
        const { needsRAG, reasoning } = intent
        logger.info(`[CHAT] Intent: ${needsRAG ? "RAG" : "DIRECT"} (Reason: ${reasoning})`)

        let relevantChunks: ChunkSearchResult[] = []
        let context = ""

        if (needsRAG) {
          // 4a. RAG Path (Mistral Large + Retrieval)
          const embedding = await vectorService.generateEmbedding(query)
          relevantChunks = await storageService.searchSimilarChunks(embedding, 5)

          logger.info(`[RAG] Found ${relevantChunks.length} chunks.`)

          writer.write({
            type: "data-sources",
            data: chatService.formatSourcesForUI(relevantChunks),
          })

          context = chatService.formatRAGContext(relevantChunks)
        }

        const model = needsRAG ? "mistral-small-latest" : "mistral-small-latest"
        const systemPrompt = needsRAG
          ? chatService.getSystemPrompt(context)
          : chatService.getDirectSystemPrompt()

        // 5. Generation & Persistence on Finish
        const result = await streamText({
          model: mistral(model),
          system: systemPrompt,
          messages: modelMessages,
          onFinish: async ({ text, usage }) => {
            try {
              // Map AI SDK tokens to DB fields
              const promptTokens = (usage.inputTokens ?? 0) + (classificationUsage.inputTokens ?? 0)
              const completionTokens =
                (usage.outputTokens ?? 0) + (classificationUsage.outputTokens ?? 0)
              const totalTokens = (usage.totalTokens ?? 0) + (classificationUsage.totalTokens ?? 0)

              // Save Assistant message with usage stats
              await prisma.message.create({
                data: {
                  conversationId,
                  role: MessageRole.ASSISTANT,
                  content: text,
                  model,
                  intent: needsRAG ? MessageIntent.RAG : MessageIntent.DIRECT,
                  promptTokens,
                  completionTokens,
                  totalTokens,
                  sources: needsRAG ? chatService.formatSourcesForUI(relevantChunks) : undefined,
                },
              })

              // Update conversation title if it's the first exchange (async)
              const messageCount = await prisma.message.count({ where: { conversationId } })
              if (messageCount <= 2 && text) {
                const title = text.split(/[.!?]/)[0].substring(0, 50).trim()
                await prisma.conversation.update({
                  where: { id: conversationId },
                  data: { title: title || "Discussion" },
                })
              }
            } catch (dbError) {
              logger.error("[CHAT_DB_ERROR] Failed to persist assistant message", dbError)
            }
          },
        })

        writer.merge(result.toUIMessageStream())
      },
    })

    // Add conversationId to header for frontend awareness
    res.setHeader("x-conversation-id", conversationId)

    pipeUIMessageStreamToResponse({
      response: res,
      stream,
    })
  } catch (error) {
    logger.error("[CHAT_ERROR]", error)
    res.status(500).json({ error: "Erreur lors de la génération de la réponse" })
  }
}
