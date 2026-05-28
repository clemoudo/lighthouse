import { prisma, MessageRole } from "@repo/db"
import dayjs from "dayjs"
import { calculateQuotaStatus } from "../lib/utils/usage-utils"

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

    return calculateQuotaStatus(user.role, dailyCount)
  }
}

export const usageService = new UsageService()
