import { z } from "zod"

const envSchema = z.object({
  // Server-side environment variables
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET est requis"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL doit être une URL valide"),
  WEB_PORT: z.string().default("3000"),

  // Client-side environment variables (must start with NEXT_PUBLIC_)
  NEXT_PUBLIC_API_URL: z.url().default("http://lighthouse.local/api"),
})

export type Env = z.infer<typeof envSchema>

// Safely parse the environment variables
// In Next.js, process.env is a bit special, so we use safeParse
const result = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  WEB_PORT: process.env.WEB_PORT,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
})

if (!result.success) {
  console.error("❌ Invalid environment variables in Web app:", result.error.flatten().fieldErrors)
  // We don't exit in browser, but we throw an error to catch it during build/server-side
  if (typeof window === "undefined") {
    process.exit(1)
  } else {
    throw new Error("Invalid environment variables")
  }
}

export const env = result.data
