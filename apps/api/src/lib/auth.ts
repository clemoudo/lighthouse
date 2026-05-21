import { betterAuth } from "better-auth"
import { admin, emailOTP } from "better-auth/plugins"
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@repo/db"
import { sendEmail } from "../services/email.service"
import * as z from "zod"

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
    sendOnSignUp: false,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  socialProviders: {},
  plugins: [
    admin(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        let subject = "Vérifiez votre adresse e-mail"
        let title = "Vérification de votre e-mail"

        if (type === "sign-in") {
          subject = "Votre code de connexion"
          title = "Connexion à Lighthouse"
        } else if (type === "forget-password") {
          subject = "Réinitialisation de votre mot de passe"
          title = "Mot de passe oublié ?"
        }

        await sendEmail({
          to: email,
          subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">${title}</h2>
              <p style="font-size: 16px; color: #555;">Bonjour,</p>
              <p style="font-size: 16px; color: #555;">Voici votre code de vérification à usage unique pour Lighthouse :</p>
              <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #000; border: 1px solid #ddd;">
                ${otp}
              </div>
              <p style="font-size: 14px; color: #777; text-align: center;">Ce code expirera dans 5 minutes.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
            </div>
          `,
        })
      },
    }),
    {
      id: "user-helper",
      endpoints: {
        checkEmail: createAuthEndpoint(
          "/check-email",
          {
            method: "GET",
            query: z.object({
              email: z.email(),
            }),
          },
          async (ctx) => {
            const user = await prisma.user.findUnique({
              where: { email: ctx.query.email },
            })
            return ctx.json({ exists: !!user })
          },
        ),
        clearData: createAuthEndpoint(
          "/clear-data",
          {
            method: "POST",
            use: [sessionMiddleware],
          },
          async (ctx) => {
            const userId = ctx.context.session.user.id
            // Delete all user conversations (messages will be deleted by cascade if configured in Prisma)
            await prisma.conversation.deleteMany({
              where: { userId },
            })
            return ctx.json({ success: true })
          },
        ),
      },
    },
  ],
  advanced: {
    database: {
      generateId: false,
    },
  },
})
