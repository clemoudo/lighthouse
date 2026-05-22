import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { MessageIntent } from "./chat"

extendZodWithOpenApi(z)

/**
 * Filter for token usage statistics.
 */
export const TokenUsageQuerySchema = z
  .object({
    from: z.iso.datetime().optional().openapi({
      description: "Date de début (ISO 8601)",
      example: "2024-05-01T00:00:00.000Z",
    }),
    to: z.iso.datetime().optional().openapi({
      description: "Date de fin (ISO 8601)",
      example: "2024-05-31T23:59:59.999Z",
    }),
    userId: z.uuid().optional().openapi({
      description: "ID de l'utilisateur spécifique",
    }),
    model: z.string().optional().openapi({
      description: "Modèle spécifique",
    }),
  })
  .openapi("TokenUsageQuery")

export type TokenUsageQuery = z.infer<typeof TokenUsageQuerySchema>

/**
 * Daily usage data point for charts.
 */
export const DailyUsageSchema = z
  .object({
    date: z.string().openapi({ example: "2024-05-22" }),
    promptTokens: z.number().openapi({ example: 1200 }),
    completionTokens: z.number().openapi({ example: 800 }),
    totalTokens: z.number().openapi({ example: 2000 }),
    count: z.number().openapi({ example: 15, description: "Nombre de messages" }),
  })
  .openapi("DailyUsage")

/**
 * Usage distribution by model.
 */
export const UsageByModelSchema = z
  .object({
    model: z.string().openapi({ example: "gpt-4o" }),
    totalTokens: z.number().openapi({ example: 50000 }),
    count: z.number().openapi({ example: 120 }),
  })
  .openapi("UsageByModel")

/**
 * Usage distribution by intent.
 */
export const UsageByIntentSchema = z
  .object({
    intent: z.enum(MessageIntent).openapi({ example: "RAG" }),
    totalTokens: z.number().openapi({ example: 45000 }),
    count: z.number().openapi({ example: 100 }),
  })
  .openapi("UsageByIntent")

/**
 * Complete token usage statistics response.
 */
export const TokenUsageResponseSchema = z
  .object({
    summary: z.object({
      totalTokens: z.number().openapi({ example: 150000 }),
      promptTokens: z.number().openapi({ example: 100000 }),
      completionTokens: z.number().openapi({ example: 50000 }),
      totalMessages: z.number().openapi({ example: 450 }),
      estimatedCost: z.number().openapi({ example: 12.5, description: "Coût estimé en EUR/USD" }),
      activeUsers: z.number().openapi({ example: 25 }),
    }),
    dailyUsage: z.array(DailyUsageSchema),
    byModel: z.array(UsageByModelSchema),
    byIntent: z.array(UsageByIntentSchema),
  })
  .openapi("TokenUsageResponse")

export type TokenUsageResponse = z.infer<typeof TokenUsageResponseSchema>

/**
 * Simplified usage for the user list.
 */
export const UserUsageSummarySchema = z
  .object({
    userId: z.uuid(),
    totalTokens: z.number().openapi({ example: 2500 }),
    count: z.number().openapi({ example: 12 }),
  })
  .openapi("UserUsageSummary")

export type UserUsageSummary = z.infer<typeof UserUsageSummarySchema>
