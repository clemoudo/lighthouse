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
    userId: userId || undefined,
  }

  // 1. Summary Statistics
  const summary = await prisma.usageRecord.aggregate({
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
  const activeUsers = await prisma.usageRecord.findMany({
    where: {
      role: MessageRole.assistant,
      createdAt: dateFilter,
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  })

  // Estimated cost (Rough estimation: $0.50 per 1M tokens average)
  const estimatedCost = ((summary._sum.totalTokens || 0) / 1000000) * 0.5

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
  const modelFragment = model ? Prisma.sql`AND u."model" = ${model}` : Prisma.empty
  const userFragment = userId ? Prisma.sql`AND u."userId" = ${userId}::uuid` : Prisma.empty

  const dailyRaw = await prisma.$queryRaw<DailyUsageRow[]>`
    SELECT 
      TO_CHAR(u."createdAt", 'YYYY-MM-DD') as "date",
      SUM(u."promptTokens")::int as "promptTokens",
      SUM(u."completionTokens")::int as "completionTokens",
      SUM(u."totalTokens")::int as "totalTokens",
      COUNT(u."id")::int as "count"
    FROM "usage_record" u
    WHERE u."role" = ${MessageRole.assistant}::"MessageRole"
    AND u."createdAt" >= ${fromDate}
    AND u."createdAt" <= ${toDate}
    ${modelFragment}
    ${userFragment}
    GROUP BY "date"
    ORDER BY "date" ASC
  `

  // 3. Usage by Model
  const byModel = await prisma.usageRecord.groupBy({
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
  const byIntent = await prisma.usageRecord.groupBy({
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
      "userId",
      SUM("totalTokens")::int as "totalTokens",
      COUNT("id")::int as "count"
    FROM "usage_record"
    WHERE "role" = ${MessageRole.assistant}::"MessageRole"
    GROUP BY "userId"
  `

  res.json(usersUsage)
}
