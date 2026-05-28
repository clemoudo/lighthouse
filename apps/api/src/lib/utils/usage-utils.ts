import { UserRole } from "@repo/db"

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
 * @param role The user role (admin, user)
 * @param dailyCount Number of messages already sent today
 * @returns { allowed: boolean, remaining: number, limit: number }
 */
export function calculateQuotaStatus(role: UserRole | null | undefined, dailyCount: number) {
  const effectiveRole = role || UserRole.user
  const limit = QUOTA_LIMITS[effectiveRole] || QUOTA_LIMITS[UserRole.user]

  const remaining = Math.max(0, limit - dailyCount)

  return {
    allowed: dailyCount < limit,
    remaining,
    limit,
  }
}
