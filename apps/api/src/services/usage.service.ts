import { prisma, UserRole, MessageRole } from "@repo/db"
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
   * Based on the real-time count in UsageRecord table.
   *
   * @returns {Object} { allowed: boolean, remaining: number, limit: number }
   */
  async checkQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const role = user.role || UserRole.user
    const limit = LIMITS[role]
    const startOfDay = dayjs().startOf("day").toDate()

    // Count assistant messages sent to this user today
    const dailyCount = await prisma.usageRecord.count({
      where: {
        userId,
        role: MessageRole.assistant,
        createdAt: {
          gte: startOfDay,
        },
      },
    })

    const remaining = limit - dailyCount
    return {
      allowed: dailyCount < limit,
      remaining: Math.max(0, remaining),
      limit,
    }
  }
}

export const usageService = new UsageService()
