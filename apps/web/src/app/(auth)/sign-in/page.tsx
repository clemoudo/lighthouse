"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, Input, Button, Alert, Typography, Checkbox, Form, Divider, message } from "antd"
import { Mail, Lock, ArrowRight, Send } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { signIn, sendVerificationEmail } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"
import { FormField } from "@/components/ui/form-field"

const { Title, Text } = Typography

// Corrected Zod 4 Schema
const signInSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Veuillez saisir un email valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  remember: z.boolean(),
})

export default function SignInPage() {
  const router = useRouter()
  const { refetch } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isUnverified, setIsUnverified] = useState(false)
  const [resendPending, setResendPending] = useState(false)

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
    validators: {
      onChange: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setIsUnverified(false)
      setIsPending(true)

      try {
        const { error: signInError } = await signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: "/",
        })

        if (signInError) {
          if (signInError.status === 403) {
            setIsUnverified(true)
          } else {
            setError(signInError.message || "Email ou mot de passe incorrect.")
          }
          setIsPending(false)
        } else {
          // Refetch Better-Auth session context
          await refetch()
          router.push("/")
        }
      } catch (err) {
        setError(`Une erreur inattendue est survenue : ${err}`)
        setIsPending(false)
      }
    },
  })

  const handleResendEmail = async () => {
    setResendPending(true)
    try {
      const { error: resendError } = await sendVerificationEmail({
        email: form.getFieldValue("email"),
        callbackURL: "/",
      })

      if (resendError) {
        message.error(resendError.message || "Erreur lors de l'envoi de l'email.")
      } else {
        message.success("Email de vérification envoyé avec succès !")
      }
    } catch (err) {
      message.error("Une erreur est survenue.")
      console.error(err)
    } finally {
      setResendPending(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="mb-6 text-center">
        <Title level={2} style={{ margin: 0 }}>
          Connexion
        </Title>
        <Text type="secondary">Ravi de vous revoir ! Connectez-vous à votre compte.</Text>
      </div>

      {error && <Alert title="Erreur" description={error} type="error" showIcon className="mb-4" />}

      {isUnverified && (
        <Alert
          message="Email non vérifié"
          description={
            <div className="flex flex-col gap-3">
              <Text className="text-sm">
                Votre adresse e-mail n'a pas encore été vérifiée. Veuillez consulter votre boîte de
                réception ou cliquer sur le bouton ci-dessous pour renvoyer le lien.
              </Text>
              <Button
                size="small"
                icon={<Send size={14} />}
                onClick={handleResendEmail}
                loading={resendPending}
                className="w-fit"
              >
                Renvoyer l'email
              </Button>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

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

        <FormField form={form} name="password" label="Mot de passe" required>
          {(field) => (
            <Input.Password
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              prefix={<Lock size={18} style={{ opacity: 0.45 }} />}
              placeholder="••••••••"
            />
          )}
        </FormField>

        <FormField form={form} name="remember" valuePropName="checked">
          {(field) => (
            <Checkbox
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            >
              Se souvenir de moi
            </Checkbox>
          )}
        </FormField>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" block loading={isPending} className="mt-2">
            Se connecter
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Text type="secondary" className="text-sm">
          Pas encore de compte ?{" "}
          <Link href="/sign-up" className="font-medium text-primary">
            S'inscrire
          </Link>
        </Text>
      </div>

      <Divider plain>Ou</Divider>

      <Link href="/">
        <Button block className="flex items-center justify-center">
          <span className="flex items-center gap-2">
            Continuer sans compte
            <ArrowRight size={18} />
          </span>
        </Button>
      </Link>
    </Card>
  )
}
