import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  API_PORT: z.string().default("3001"),
  ALLOWED_ORIGINS: z
    .string()
    .default("")
    .transform((s) => (s ? s.split(",").map((o) => o.trim()) : [])),
  UPLOAD_DIR: z.string().default("./uploads"),
})

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET est requis"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL doit être une URL valide"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY est requise"),
})

export type Env = z.infer<typeof envSchema>

const isBuild = process.env.SKIP_ENV_VALIDATION === "1"

// Validate process.env and export the result
const result = !isBuild
  ? serverSchema.extend(envSchema.shape).safeParse(process.env)
  : envSchema.safeParse(process.env)

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = result.data
