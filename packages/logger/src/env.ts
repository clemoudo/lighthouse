import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

const result = envSchema.safeParse(process.env)

// We don't exit here as logger might be used in environments where process.exit is not available
// but we still want to know if something is wrong.
export const env = result.success ? result.data : { NODE_ENV: "development" }
