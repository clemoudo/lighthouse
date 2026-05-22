import type { Request, Response } from "express"
import { prisma, MessageRole, MessageIntent, Prisma } from "@repo/db"
import { TokenUsageQuerySchema, type TokenUsageResponse } from "@repo/api"

/**
 * Get token usage statistics for administration.
 */
export const getUsageStats = async (req: Request, res: Response) => {
  const { from, to, userId, model } = TokenUsageQuerySchema.parse(req.query)

  const dateFilter = {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  }

  const whereClause = {
    role: MessageRole.assistant,
    createdAt: dateFilter,
    model: model || undefined,
    conversation: userId ? { userId } : undefined,
  }

  // 1. Summary Statistics
  const summary = await prisma.message.aggregate({
    where: whereClause,
    _sum: {
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
    },
    _count: {
      id: true,
    },
  })

  // Count active users in this period
  // We use findMany with distinct to avoid groupBy issues on conversations which was adding a syntax error
  const activeUsers = await prisma.conversation.findMany({
    where: {
      messages: {
        some: {
          role: MessageRole.assistant,
          createdAt: dateFilter,
        },
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  })

  // Estimated cost (Rough estimation: $0.01 per 1k tokens average)
  const estimatedCost = ((summary._sum.totalTokens || 0) / 1000) * 0.01

  // 2. Daily Usage (Aggregation by date)
  const fromDate = from ? new Date(from) : new Date(0)
  const toDate = to ? new Date(to) : new Date()

  interface DailyUsageRow {
    date: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    count: number
  }

  // Use Prisma.sql fragments to correctly build dynamic queries without nesting errors
  const modelFragment = model ? Prisma.sql`AND m."model" = ${model}` : Prisma.empty

  let dailyRaw: DailyUsageRow[] = []

  if (userId) {
    dailyRaw = await prisma.$queryRaw<DailyUsageRow[]>`
      SELECT 
        TO_CHAR(m."createdAt", 'YYYY-MM-DD') as "date",
        SUM(m."promptTokens")::int as "promptTokens",
        SUM(m."completionTokens")::int as "completionTokens",
        SUM(m."totalTokens")::int as "totalTokens",
        COUNT(m."id")::int as "count"
      FROM "message" m
      JOIN "conversation" c ON m."conversationId" = c."id"
      WHERE c."userId" = ${userId}::uuid
      AND m."role" = ${MessageRole.assistant}::"MessageRole"
      AND m."createdAt" >= ${fromDate}
      AND m."createdAt" <= ${toDate}
      ${modelFragment}
      GROUP BY "date"
      ORDER BY "date" ASC
    `
  } else {
    dailyRaw = await prisma.$queryRaw<DailyUsageRow[]>`
      SELECT 
        TO_CHAR(m."createdAt", 'YYYY-MM-DD') as "date",
        SUM(m."promptTokens")::int as "promptTokens",
        SUM(m."completionTokens")::int as "completionTokens",
        SUM(m."totalTokens")::int as "totalTokens",
        COUNT(m."id")::int as "count"
      FROM "message" m
      WHERE m."role" = ${MessageRole.assistant}::"MessageRole"
      AND m."createdAt" >= ${fromDate}
      AND m."createdAt" <= ${toDate}
      ${modelFragment}
      GROUP BY "date"
      ORDER BY "date" ASC
    `
  }

  // 3. Usage by Model
  const byModel = await prisma.message.groupBy({
    by: ["model"],
    where: whereClause,
    _sum: {
      totalTokens: true,
    },
    _count: {
      id: true,
    },
  })

  // 4. Usage by Intent
  const byIntent = await prisma.message.groupBy({
    by: ["intent"],
    where: whereClause,
    _sum: {
      totalTokens: true,
    },
    _count: {
      id: true,
    },
  })

  const response: TokenUsageResponse = {
    summary: {
      totalTokens: summary._sum.totalTokens || 0,
      promptTokens: summary._sum.promptTokens || 0,
      completionTokens: summary._sum.completionTokens || 0,
      totalMessages: summary._count.id || 0,
      estimatedCost,
      activeUsers: activeUsers.length,
    },
    dailyUsage: dailyRaw.map((d) => ({
      date: d.date,
      promptTokens: d.promptTokens || 0,
      completionTokens: d.completionTokens || 0,
      totalTokens: d.totalTokens || 0,
      count: d.count || 0,
    })),
    byModel: byModel.map((m) => ({
      model: m.model || "Unknown",
      totalTokens: m._sum.totalTokens || 0,
      count: m._count.id || 0,
    })),
    byIntent: byIntent.map((i) => ({
      intent: i.intent || MessageIntent.DIRECT,
      totalTokens: i._sum.totalTokens || 0,
      count: i._count.id || 0,
    })),
  }

  res.json(response)
}

/**
 * Get usage summary for all users (for the user management list).
 */
export const getUsersUsageSummary = async (req: Request, res: Response) => {
  interface UserUsageRow {
    userId: string
    totalTokens: number
    count: number
  }

  // Aggregate tokens per user
  const usersUsage = await prisma.$queryRaw<UserUsageRow[]>`
    SELECT 
      c."userId",
      SUM(m."totalTokens")::int as "totalTokens",
      COUNT(m."id")::int as "count"
    FROM "message" m
    JOIN "conversation" c ON m."conversationId" = c."id"
    WHERE m."role" = ${MessageRole.assistant}::"MessageRole"
    GROUP BY c."userId"
  `

  res.json(usersUsage)
}
