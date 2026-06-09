import { User, UserRole } from "@repo/db"

const BASE_QUOTA_LIMIT = 5

/**
 * Message limits per user role.
 */
export const QUOTA_LIMITS: Record<UserRole, number> = {
  [UserRole.admin]: 100,
  [UserRole.user]: 30,
}

/**
 * Calculates if the user is allowed to send more messages and how many remain.
 * Pure function: depends only on inputs.
 *
 * @param user
 * @param dailyCount Number of messages already sent today
 * @returns { allowed: boolean, remaining: number, limit: number }
 */
export function calculateQuotaStatus({
  user,
  dailyCount,
}: {
  user: Pick<User, "role" | "isAnonymous">
  dailyCount: number
}) {
  const limit =
    (user.isAnonymous && BASE_QUOTA_LIMIT) ||
    (user.role && QUOTA_LIMITS[user.role]) ||
    BASE_QUOTA_LIMIT

  const remaining = Math.max(0, limit - dailyCount)

  return {
    allowed: dailyCount < limit,
    remaining,
    limit,
  }
}
