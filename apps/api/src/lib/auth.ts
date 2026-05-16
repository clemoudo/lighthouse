import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@repo/db"
import { sendEmail } from "./email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: "/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const apiPaddedUrl = url.replace("/auth/verify-email", "/api/auth/verify-email")
      await sendEmail({
        to: user.email,
        subject: "Vérifiez votre adresse e-mail",
        html: `<p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail : <a href="${apiPaddedUrl}">${apiPaddedUrl}</a></p>`,
      })
    },
  },
  socialProviders: {},
  advanced: {
    database: {
      generateId: false,
    },
  },
})
