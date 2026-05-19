import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
})

const isBuild = process.env.SKIP_ENV_VALIDATION === "1"
const isTest = process.env.NODE_ENV === "test"

const result =
  isBuild || isTest
    ? envSchema.safeParse(process.env)
    : serverSchema.extend(envSchema.shape).safeParse(process.env)

if (!result.success) {
  console.error("❌ Invalid environment variables in @repo/db:", result.error.flatten().fieldErrors)
  throw new Error("Invalid environment variables in @repo/db")
}

export const env = result.data
