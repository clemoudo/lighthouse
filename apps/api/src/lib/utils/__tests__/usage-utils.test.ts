import { describe, it, expect } from "@jest/globals"
import { UserRole } from "@repo/db"
import { calculateQuotaStatus, QUOTA_LIMITS } from "../usage-utils"

describe("usage-utils", () => {
  describe("calculateQuotaStatus", () => {
    it("should return correct status for a user within limits", () => {
      const result = calculateQuotaStatus({
        user: { role: UserRole.user, isAnonymous: false },
        dailyCount: 10,
      })

      expect(result).toEqual({
        allowed: true,
        remaining: QUOTA_LIMITS[UserRole.user] - 10,
        limit: QUOTA_LIMITS[UserRole.user],
      })
    })

    it("should return correct status for an admin within limits", () => {
      const result = calculateQuotaStatus({
        user: { role: UserRole.admin, isAnonymous: false },
        dailyCount: 50,
      })

      expect(result).toEqual({
        allowed: true,
        remaining: QUOTA_LIMITS[UserRole.admin] - 50,
        limit: QUOTA_LIMITS[UserRole.admin],
      })
    })

    it("should return base quota for anonymous users regardless of role", () => {
      const result = calculateQuotaStatus({
        user: { role: UserRole.admin, isAnonymous: true },
        dailyCount: 2,
      })

      expect(result).toEqual({
        allowed: true,
        remaining: 3,
        limit: 5,
      })
    })

    it("should deny access when limit is reached (user)", () => {
      const result = calculateQuotaStatus({
        user: { role: UserRole.user, isAnonymous: false },
        dailyCount: QUOTA_LIMITS[UserRole.user],
      })

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should deny access when limit is exceeded (anonymous)", () => {
      const result = calculateQuotaStatus({
        user: { role: null, isAnonymous: true },
        dailyCount: 6,
      })

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should use base quota (5) if role is null and not anonymous", () => {
      const result = calculateQuotaStatus({
        user: { role: null, isAnonymous: false },
        dailyCount: 0,
      })

      expect(result.limit).toBe(5)
      expect(result.allowed).toBe(true)
    })

    it("should handle 0 messages correctly", () => {
      const result = calculateQuotaStatus({
        user: { role: UserRole.user, isAnonymous: false },
        dailyCount: 0,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(QUOTA_LIMITS[UserRole.user])
    })
  })
})
