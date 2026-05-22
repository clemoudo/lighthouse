import { prisma, UserRole } from "@repo/db"
import { logger } from "@repo/logger"
import dayjs from "dayjs"

const LIMITS = {
  [UserRole.admin]: 100,
  [UserRole.user]: 30,
}

/**
 * Service to manage user usage quotas and limits.
 */
export class UsageService {
  /**
   * Checks if a user has reached their daily message limit.
   * Automatically resets the counter if it's a new day.
   *
   * @returns {Object} { allowed: boolean, remaining: number, limit: number }
   */
  async checkQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyMessageCount: true, lastMessageAt: true, role: true },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const role = user.role || UserRole.user
    const limit = LIMITS[role]
    const now = dayjs()
    const lastAt = dayjs(user.lastMessageAt || 0)

    // Check if it's a new day
    const isNewDay = !now.isSame(lastAt, "day")

    if (isNewDay) {
      // Reset for new day
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyMessageCount: 0,
          lastMessageAt: now.toDate(),
        },
      })
      return { allowed: true, remaining: limit, limit }
    }

    const remaining = limit - user.dailyMessageCount
    return {
      allowed: user.dailyMessageCount < limit,
      remaining: Math.max(0, remaining),
      limit,
    }
  }

  /**
   * Increments the daily message count for a user.
   */
  async incrementUsage(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyMessageCount: { increment: 1 },
          lastMessageAt: new Date(),
        },
      })
    } catch (err) {
      logger.error(`[USAGE_SERVICE] Failed to increment usage for user ${userId}`, err)
    }
  }
}

export const usageService = new UsageService()
