import { prisma, MessageRole, MessageIntent, type ChunkSearchResult } from "@repo/db"
import { type ChatSource } from "@repo/api"
import { generateText, Output, type ModelMessage } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { z } from "zod"
import { logger } from "@repo/logger"
import * as chatUtils from "../lib/utils/chat-utils"

/**
 * Service to handle chat-related logic like prompt assembly and RAG formatting.
 */
export class ChatService {
  /**
   * Formats the context chunks into a single string with source markers.
   */
  formatRAGContext(chunks: ChunkSearchResult[]): string {
    return chatUtils.formatRAGContext(chunks)
  }

  /**
   * Analyzes the query to decide if RAG is needed.
   * This ensures pedagogical questions are grounded in the official curriculum.
   */
  async classifyIntent(query: string) {
    const { output, usage } = await generateText({
      model: mistral("mistral-small-latest"),
      system: chatUtils.INTENT_CLASSIFICATION_SYSTEM_PROMPT,
      output: Output.object({
        schema: z.object({
          needsRAG: z.boolean(),
          reasoning: z.string(),
        }),
      }),
      prompt: query,
    })
    return { intent: output, usage }
  }

  /**
   * Generates the system prompt for Félix.
   */
  getSystemPrompt(context: string): string {
    return chatUtils.getSystemPrompt(context)
  }

  /**
   * Generates a simpler system prompt for general conversation without RAG.
   */
  getDirectSystemPrompt(): string {
    return chatUtils.getDirectSystemPrompt()
  }

  /**
   * Formats sources for the frontend.
   */
  formatSourcesForUI(chunks: ChunkSearchResult[]): ChatSource[] {
    return chatUtils.formatSourcesForUI(chunks)
  }

  /**
   * Persists a message and its usage metadata to the database.
   */
  async saveMessage(data: {
    userId: string
    conversationId: string
    role: MessageRole
    content: string
    model?: string
    intent?: MessageIntent
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    sources?: ChatSource[]
  }) {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          sources: data.sources,
          usageRecord: {
            create: {
              userId: data.userId,
              role: data.role,
              model: data.model,
              intent: data.intent,
              promptTokens: data.promptTokens,
              completionTokens: data.completionTokens,
              totalTokens: data.totalTokens,
            },
          },
        },
      })

      // Update title if it's the first message (from user)
      if (data.role === MessageRole.user) {
        const messageCount = await prisma.message.count({
          where: { conversationId: data.conversationId },
        })
        if (messageCount === 1 && data.content) {
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: { title: data.content },
          })
        }
      }

      return message
    } catch (err) {
      logger.error("[CHAT_SERVICE] Failed to save message", err)
      throw err
    }
  }

  /**
   * Loads conversation history from the database.
   */
  async getHistory(conversationId: string, limit = 10): Promise<ModelMessage[]> {
    const dbMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return dbMessages.reverse().map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }))
  }
}

export const chatService = new ChatService()
