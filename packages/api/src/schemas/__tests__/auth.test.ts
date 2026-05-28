import { UserSchema, SessionSchema, AuthSessionSchema } from "../auth"

describe("Auth Schemas", () => {
  const validUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "John Doe",
    email: "john@example.com",
    emailVerified: true,
    image: "https://example.com/avatar.png",
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-20T10:00:00Z",
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
  }

  const validSession = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    userId: "550e8400-e29b-41d4-a716-446655440000",
    expiresAt: "2024-04-20T10:00:00Z",
    token: "session-token",
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-20T10:00:00Z",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    impersonatedBy: null,
  }

  describe("UserSchema", () => {
    it("should validate a valid user", () => {
      expect(UserSchema.parse(validUser)).toEqual(validUser)
    })

    it("should fail on invalid email", () => {
      const invalid = { ...validUser, email: "invalid-email" }
      expect(() => UserSchema.parse(invalid)).toThrow()
    })

    it("should fail on invalid URL for image", () => {
      const invalid = { ...validUser, image: "not-a-url" }
      expect(() => UserSchema.parse(invalid)).toThrow()
    })
  })

  describe("SessionSchema", () => {
    it("should validate a valid session", () => {
      expect(SessionSchema.parse(validSession)).toEqual(validSession)
    })
  })

  describe("AuthSessionSchema", () => {
    it("should validate a valid session response", () => {
      const validResponse = {
        user: validUser,
        session: validSession,
      }
      expect(AuthSessionSchema.parse(validResponse)).toEqual(validResponse)
    })

    it("should allow null response", () => {
      expect(AuthSessionSchema.parse(null)).toBeNull()
    })
  })
})
