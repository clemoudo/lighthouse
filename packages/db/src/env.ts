import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error("❌ Invalid environment variables in @repo/db:", result.error.flatten().fieldErrors)
  throw new Error("Invalid environment variables in @repo/db")
}

export const env = result.data
