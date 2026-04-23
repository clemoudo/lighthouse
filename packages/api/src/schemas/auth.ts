import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"

extendZodWithOpenApi(z)

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
    createdAt: z.date(),
    updatedAt: z.date(),
    role: z.string().optional(), // Admin role
  })
  .openapi("User")

/**
 * Session schema reflecting the Better Auth session
 */
export const SessionSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    expiresAt: z.date(),
    token: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
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
