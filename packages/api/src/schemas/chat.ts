import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { PaginationMetaSchema } from "./common"

extendZodWithOpenApi(z)

export const ChatSourceSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    page: z.number(),
  })
  .openapi("ChatSource")

export type ChatSource = z.infer<typeof ChatSourceSchema>

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
})

export const ChatRequestSchema = z
  .object({
    conversationId: z.uuid().optional().openapi({
      description: "L'ID de la conversation existante pour maintenir le contexte.",
    }),
    messages: z.array(ChatMessageSchema).openapi({
      example: [{ role: "user", content: "Comment favoriser l'autonomie en classe ?" }],
    }),
  })
  .openapi("ChatRequest")

export const ChatResponseSchema = z.string().openapi("ChatResponse")

export const MessageSchema = z
  .object({
    id: z.uuid(),
    role: z.enum(["USER", "ASSISTANT"]),
    content: z.string(),
    model: z.string().optional().nullable(),
    intent: z.enum(["RAG", "DIRECT", "CLASSIFICATION"]).optional().nullable(),
    sources: z.array(ChatSourceSchema).optional().nullable(),
    createdAt: z.iso.datetime(),
  })
  .openapi("Message")

export const ConversationSchema = z
  .object({
    id: z.uuid(),
    title: z.string().nullable(),
    userId: z.uuid(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    messages: z.array(MessageSchema).optional(),
  })
  .openapi("Conversation")

export const ListConversationsResponseSchema = z
  .object({
    conversations: z.array(ConversationSchema),
    meta: PaginationMetaSchema,
  })
  .openapi("ListConversationsResponse")
