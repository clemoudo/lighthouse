import { z } from "zod"

/**
 * Ce schéma définit TOUTES les variables, mais marque les variables serveurs
 * comme optionnelles pour ne pas faire planter le navigateur.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  WEB_PORT: z.string().default("3000"),

  // Variables Client (doivent commencer par NEXT_PUBLIC_)
  NEXT_PUBLIC_API_URL: z.url().default("http://lighthouse.local/api"),

  // Variables Serveur (optionnelles ici pour la compatibilité navigateur)
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
})

/**
 * Schéma strict utilisé UNIQUEMENT côté serveur.
 */
const serverSchema = envSchema.extend({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET est requis"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL doit être une URL valide"),
})

export type Env = z.infer<typeof envSchema>

const isServer = typeof window === "undefined"

// Extraction manuelle pour garantir la compatibilité Next.js
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  WEB_PORT: process.env.WEB_PORT,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}

// Validation : Schéma strict sur le serveur, schéma souple sur le client
const result = isServer ? serverSchema.safeParse(processEnv) : envSchema.safeParse(processEnv)

if (!result.success) {
  console.error(
    `❌ Invalid environment variables in Web app (${isServer ? "Server" : "Client"}):`,
    result.error.flatten().fieldErrors,
  )

  if (isServer) {
    process.exit(1)
  } else {
    // Sur le client, on peut lever une erreur plus douce
    throw new Error("Invalid environment variables")
  }
}

export const env = result.data
