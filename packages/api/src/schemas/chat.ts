import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"

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
    messages: z.array(ChatMessageSchema).openapi({
      example: [{ role: "user", content: "Comment favoriser l'autonomie en classe ?" }],
    }),
  })
  .openapi("ChatRequest")

export const ChatResponseSchema = z.string().openapi("ChatResponse")
