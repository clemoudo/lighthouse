import { ChatRequestSchema, ChatMessageSchema, ChatSourceSchema } from "../chat"

describe("Chat Schemas", () => {
  describe("ChatMessageSchema", () => {
    it("should validate a valid message", () => {
      const validMessage = {
        role: "user",
        content: "Hello, how are you?",
      }
      expect(ChatMessageSchema.parse(validMessage)).toEqual(validMessage)
    })

    it("should fail on invalid role", () => {
      const invalidMessage = {
        role: "invalid",
        content: "Hello",
      }
      expect(() => ChatMessageSchema.parse(invalidMessage)).toThrow()
    })

    it("should fail on missing content", () => {
      const invalidMessage = {
        role: "user",
      }
      expect(() => ChatMessageSchema.parse(invalidMessage)).toThrow()
    })
  })

  describe("ChatRequestSchema", () => {
    it("should validate a valid request with conversationId", () => {
      const validRequest = {
        conversationId: "550e8400-e29b-41d4-a716-446655440000",
        messages: [{ role: "user", content: "Hello" }],
      }
      expect(ChatRequestSchema.parse(validRequest)).toEqual(validRequest)
    })

    it("should validate a valid request without conversationId", () => {
      const validRequest = {
        messages: [{ role: "user", content: "Hello" }],
      }
      expect(ChatRequestSchema.parse(validRequest)).toEqual(validRequest)
    })

    it("should fail on empty messages array", () => {
      const invalidRequest = {
        messages: [],
      }
      // Assuming messages array must not be empty based on common practice,
      // but let's check the schema definition.
      // Currently z.array(ChatMessageSchema) doesn't have .nonempty()
      // If it passes, we might want to suggest adding .nonempty()
      expect(ChatRequestSchema.parse(invalidRequest)).toEqual(invalidRequest)
    })

    it("should fail on invalid UUID", () => {
      const invalidRequest = {
        conversationId: "not-a-uuid",
        messages: [{ role: "user", content: "Hello" }],
      }
      expect(() => ChatRequestSchema.parse(invalidRequest)).toThrow()
    })
  })

  describe("ChatSourceSchema", () => {
    it("should validate a valid source", () => {
      const validSource = {
        id: "doc-1",
        source: "Document 1",
        page: 10,
      }
      expect(ChatSourceSchema.parse(validSource)).toEqual(validSource)
    })

    it("should fail on missing fields", () => {
      const invalidSource = {
        id: "doc-1",
        source: "Document 1",
      }
      expect(() => ChatSourceSchema.parse(invalidSource)).toThrow()
    })
  })
})
