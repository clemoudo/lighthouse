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
import { PaginationQuerySchema } from "@repo/api"
import { vectorService } from "../services/vector.service"
import { storageService } from "../services/storage.service"
import { chatService } from "../services/chat.service"
import { usageService } from "../services/usage.service"
import { ApiError } from "../types/error"

const MAX_MESSAGES = 10
const CHAT_MODEL_DIRECT = "mistral-small-latest"
const CHAT_MODEL_RAG = "mistral-small-latest"

/**
 * Controller to list all conversations for the authenticated user.
 */
export const getConversations = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Utilisateur non authentifié")

  const { page, pageSize } = PaginationQuerySchema.parse(req.query)

  const { data, meta } = await prisma.conversation.paginate({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    page,
    pageSize,
  })

  res.json({
    conversations: data,
    meta,
  })
}

/**
 * Controller to get a specific conversation with its messages.
 */
export const getConversationById = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const userId = req.user?.id

  if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Utilisateur non authentifié")

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!conversation) {
    throw new ApiError(404, "NOT_FOUND", "Conversation introuvable")
  }

  res.json(conversation)
}

/**
 * Controller to delete a conversation.
 */
export const deleteConversation = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const userId = req.user?.id

  if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Utilisateur non authentifié")

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
  })

  if (!conversation) {
    throw new ApiError(404, "NOT_FOUND", "Conversation introuvable")
  }

  await prisma.conversation.delete({
    where: { id },
  })

  res.status(204).send()
}

/**
 * Controller to get user usage statistics.
 */
export const getChatUsage = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Utilisateur non authentifié")

  const usage = await usageService.checkQuota(userId)
  res.json({
    count: usage.limit - usage.remaining,
    limit: usage.limit,
    remaining: usage.remaining,
  })
}

/**
 * Controller to handle RAG-based chat interactions with persistence and monitoring.
 */
export const handleChat = async (req: Request, res: Response) => {
  const { messages, conversationId: existingConversationId } = req.body
  const userId = req.user?.id

  if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Utilisateur non authentifié")

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
      throw new ApiError(403, "FORBIDDEN", "Conversation introuvable ou accès refusé")
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
  let modelMessages: ModelMessage[] = []
  if (messages && messages.length > 1) {
    modelMessages = await convertToModelMessages(messages.slice(-MAX_MESSAGES))
  } else {
    modelMessages = await chatService.getHistory(conversationId, MAX_MESSAGES)

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

    // Persist user message only if it's new
    if (messages && messages.length > 0) {
      await chatService.saveMessage({
        userId,
        conversationId,
        role: MessageRole.user,
        content: query,
      })
    }
  }

  logger.info(`[CHAT] Request for conversation ${conversationId} from user ${userId}`)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // 3.5 Quota Check Phase
      const { allowed, limit } = await usageService.checkQuota(userId)

      if (!allowed) {
        logger.warn(`[CHAT] Quota reached for user ${userId} (${limit}/${limit})`)
        writer.write({
          type: "text-start",
          id: "quota-limit",
        })
        writer.write({
          type: "text-delta",
          delta: `Désolé, vous avez atteint votre limite quotidienne de **${limit} messages**. Votre quota sera réinitialisé demain ! 🕊️`,
          id: "quota-limit",
        })
        writer.write({
          type: "text-end",
          id: "quota-limit",
        })
        return
      }

      if (!query) {
        logger.warn("[CHAT] No user query found.")
        const result = await streamText({
          model: mistral(CHAT_MODEL_DIRECT),
          system: chatService.getDirectSystemPrompt(),
          messages: modelMessages,
        })
        return writer.merge(result.toUIMessageStream())
      }

      // 4. Intent Classification Phase
      const { intent, usage: classificationUsage } = await chatService.classifyIntent(query)
      const { needsRAG, reasoning } = intent
      logger.info(`[CHAT] Intent: ${needsRAG ? "RAG" : "DIRECT"} (Reason: ${reasoning})`)

      let relevantChunks: ChunkSearchResult[] = []
      let context = ""

      if (needsRAG) {
        // 4a. RAG Path (Mistral Large + Retrieval)
        const embedding = await vectorService.generateEmbedding(query)
        relevantChunks = await storageService.searchSimilarChunks(embedding, 5)

        writer.write({
          type: "data-sources",
          data: chatService.formatSourcesForUI(relevantChunks),
        })

        context = chatService.formatRAGContext(relevantChunks)
      }

      const model = needsRAG ? CHAT_MODEL_RAG : CHAT_MODEL_DIRECT
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
            // Increment usage counter
            await usageService.incrementUsage(userId)

            const promptTokens = (usage.inputTokens ?? 0) + (classificationUsage.inputTokens ?? 0)
            const completionTokens =
              (usage.outputTokens ?? 0) + (classificationUsage.outputTokens ?? 0)
            const totalTokens = (usage.totalTokens ?? 0) + (classificationUsage.totalTokens ?? 0)

            await chatService.saveMessage({
              userId,
              conversationId,
              role: MessageRole.assistant,
              content: text,
              model,
              intent: needsRAG ? MessageIntent.RAG : MessageIntent.DIRECT,
              promptTokens,
              completionTokens,
              totalTokens,
              sources: needsRAG ? chatService.formatSourcesForUI(relevantChunks) : undefined,
            })
          } catch (dbError) {
            logger.error("[CHAT_DB_ERROR] Failed to persist assistant message", dbError)
          }
        },
      })

      writer.merge(result.toUIMessageStream())
    },
  })

  res.setHeader("x-conversation-id", conversationId)
  pipeUIMessageStreamToResponse({ response: res, stream })
}
