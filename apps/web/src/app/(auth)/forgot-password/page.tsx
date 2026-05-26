"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, Input, Button, Alert, Typography, Form, App } from "antd"
import { Mail, ArrowLeft, Send } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { authClient, emailOtp } from "@/lib/auth-client"
import { FormField } from "@/components/form-field"

const { Title, Text } = Typography

const forgotPasswordSchema = z.object({
  email: z.email("Veuillez saisir un email valide"),
})

const ForgotPasswordPage = () => {
  const { message } = App.useApp()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onChange: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setIsPending(true)

      try {
        // Vérifier si l'e-mail existe avant d'envoyer le code
        const { data: checkData } = await authClient.checkEmail({ email: value.email })

        if (checkData && !checkData.exists) {
          setError(
            "Cette adresse e-mail n'est pas reconnue. Veuillez vérifier votre saisie ou créer un compte.",
          )
          setIsPending(false)
          return
        }

        const { error: otpError } = await emailOtp.sendVerificationOtp({
          email: value.email,
          type: "forget-password",
        })

        if (otpError) {
          setError(otpError.message || "Une erreur est survenue lors de l'envoi du code.")
          setIsPending(false)
        } else {
          message.success("Code de réinitialisation envoyé par e-mail !")
          router.push(`/reset-password?email=${encodeURIComponent(value.email)}`)
        }
      } catch (err) {
        setError(`Une erreur inattendue est survenue : ${err}`)
        setIsPending(false)
      }
    },
  })

  return (
    <Card className="shadow-lg">
      <div className="mb-6 text-center">
        <Title level={2} style={{ margin: 0 }}>
          Mot de passe oublié
        </Title>
        <Text type="secondary">
          Saisissez votre e-mail pour recevoir un code de réinitialisation.
        </Text>
      </div>

      {error && <Alert title={error} type="error" showIcon className="mb-4" />}

      <Form
        layout="vertical"
        size="large"
        onFinish={() => form.handleSubmit()}
        requiredMark="optional"
      >
        <FormField form={form} name="email" label="Email" required>
          {(field) => (
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              prefix={<Mail size={18} style={{ opacity: 0.45 }} />}
              placeholder="jean.dupont@example.com"
            />
          )}
        </FormField>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={isPending}
          icon={<Send size={18} />}
          className="mt-2"
        >
          Envoyer le code
        </Button>
      </Form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link
          href="/sign-in"
          className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>
      </div>
    </Card>
  )
}

export default ForgotPasswordPage
