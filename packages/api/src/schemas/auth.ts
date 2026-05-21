import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"

extendZodWithOpenApi(z)

/**
 * User roles available in the system.
 * Defined here for frontend and OpenAPI consistency.
 * Matches the UserRole enum in the database.
 */
export const UserRole = {
  admin: "admin",
  user: "user",
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

/**
 * Base user schema reflecting the Prisma model and Better Auth extensions
 */
export const UserSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    emailVerified: z.boolean(),
    image: z.url().nullable().optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    role: z
      .enum(UserRole)
      .optional()
      .openapi({ enum: Object.values(UserRole) }),
    banned: z.boolean().nullable().optional(),
    banReason: z.string().nullable().optional(),
    banExpires: z.iso.datetime().nullable().optional(),
  })
  .openapi("User")

/**
 * Session schema reflecting the Better Auth session
 */
export const SessionSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    expiresAt: z.iso.datetime(),
    token: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    impersonatedBy: z.string().nullable().optional(),
  })
  .openapi("Session")

/**
 * Combined session and user returned by auth.getSession
 */
export const AuthSessionSchema = z
  .object({
    user: UserSchema,
    session: SessionSchema,
  })
  .nullable()
  .openapi("AuthSession")

export type User = z.infer<typeof UserSchema>
export type Session = z.infer<typeof SessionSchema>
export type AuthSession = z.infer<typeof AuthSessionSchema>
