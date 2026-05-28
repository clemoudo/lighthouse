import { TokenUsageQuerySchema, TokenUsageResponseSchema, UserUsageSummarySchema } from "../admin"

describe("Admin Schemas", () => {
  describe("TokenUsageQuerySchema", () => {
    it("should validate a valid query", () => {
      const valid = {
        from: "2024-05-01T00:00:00.000Z",
        userId: "550e8400-e29b-41d4-a716-446655440000",
        model: "gpt-4o",
      }
      expect(TokenUsageQuerySchema.parse(valid)).toEqual(valid)
    })

    it("should allow empty object", () => {
      expect(TokenUsageQuerySchema.parse({})).toEqual({})
    })
  })

  describe("TokenUsageResponseSchema", () => {
    it("should validate a valid response", () => {
      const valid = {
        summary: {
          totalTokens: 1000,
          promptTokens: 600,
          completionTokens: 400,
          totalMessages: 10,
          estimatedCost: 0.05,
          activeUsers: 5,
        },
        dailyUsage: [
          {
            date: "2024-05-22",
            promptTokens: 120,
            completionTokens: 80,
            totalTokens: 200,
            count: 2,
          },
        ],
        byModel: [
          {
            model: "gpt-4o",
            totalTokens: 1000,
            count: 10,
          },
        ],
        byIntent: [
          {
            intent: "RAG",
            totalTokens: 800,
            count: 8,
          },
        ],
      }
      expect(TokenUsageResponseSchema.parse(valid)).toEqual(valid)
    })
  })

  describe("UserUsageSummarySchema", () => {
    it("should validate a valid summary", () => {
      const valid = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        totalTokens: 2500,
        count: 12,
      }
      expect(UserUsageSummarySchema.parse(valid)).toEqual(valid)
    })
  })
})
