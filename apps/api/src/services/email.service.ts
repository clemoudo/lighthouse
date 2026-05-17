import { Resend } from "resend"
import type { CreateEmailOptions } from "resend"
import { env } from "../env"
import { logger } from "@repo/logger"

const resend = new Resend(env.RESEND_API_KEY)

type SendEmailOptions = {
  to: string | string[]
  subject: string
} & ({ text: string; html?: string } | { html: string; text?: string })

export const sendEmail = async (options: SendEmailOptions) => {
  const { to, subject, text, html } = options
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    } as CreateEmailOptions)

    if (error) {
      logger.error("Failed to send email", { error, to, subject })
      return { data: null, error }
    }

    logger.info("Email sent successfully", { id: data?.id, to, subject })
    return { data, error: null }
  } catch (err) {
    logger.error("Unexpected error while sending email", { error: err, to, subject })
    return { data: null, error: err }
  }
}
