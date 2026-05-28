import { describe, it, expect } from "@jest/globals"
import { UserRole } from "@repo/db"
import { calculateQuotaStatus, QUOTA_LIMITS } from "../usage-utils"

describe("usage-utils", () => {
  describe("calculateQuotaStatus", () => {
    it("should return correct status for a user within limits", () => {
      const result = calculateQuotaStatus(UserRole.user, 10)

      expect(result).toEqual({
        allowed: true,
        remaining: QUOTA_LIMITS[UserRole.user] - 10,
        limit: QUOTA_LIMITS[UserRole.user],
      })
    })

    it("should return correct status for an admin within limits", () => {
      const result = calculateQuotaStatus(UserRole.admin, 50)

      expect(result).toEqual({
        allowed: true,
        remaining: QUOTA_LIMITS[UserRole.admin] - 50,
        limit: QUOTA_LIMITS[UserRole.admin],
      })
    })

    it("should deny access when limit is reached (user)", () => {
      const result = calculateQuotaStatus(UserRole.user, QUOTA_LIMITS[UserRole.user])

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should deny access when limit is exceeded (user)", () => {
      const result = calculateQuotaStatus(UserRole.user, QUOTA_LIMITS[UserRole.user] + 5)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should use default UserRole.user if role is null", () => {
      const result = calculateQuotaStatus(null, 0)

      expect(result.limit).toBe(QUOTA_LIMITS[UserRole.user])
    })

    it("should handle 0 messages correctly", () => {
      const result = calculateQuotaStatus(UserRole.user, 0)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(QUOTA_LIMITS[UserRole.user])
    })
  })
})
