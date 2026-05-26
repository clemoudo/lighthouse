"use client"

import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Card,
  Input,
  Button,
  Alert,
  Typography,
  Checkbox,
  Form,
  Divider,
  App,
  Row,
  Col,
} from "antd"
import { Mail, Lock, Send, UserPlus, Loader2 } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { authClient, signIn, sendVerificationEmail } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"
import { FormField } from "@/components/form-field"

const { Title, Text } = Typography

const signInSchema = z.object({
  email: z.email("Veuillez saisir un email valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  remember: z.boolean(),
})

const SignInContent = () => {
  const { message } = App.useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refetch } = useAuth()

  const [error, setError] = useState<React.ReactNode | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isUnverified, setIsUnverified] = useState(false)
  const [resendPending, setResendPending] = useState(false)

  const initialEmail = searchParams.get("email") || ""

  const form = useForm({
    defaultValues: {
      email: initialEmail,
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
            // Check if user exists for intelligent redirection
            const { data: checkData } = await authClient.checkEmail({ email: value.email })

            if (checkData && !checkData.exists) {
              setError(
                <div className="flex flex-col gap-2">
                  <Text strong>Cet e-mail n'est pas reconnu.</Text>
                  <Text className="text-sm">Il semble que vous n'ayez pas encore de compte.</Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<UserPlus size={14} />}
                    onClick={() => router.push(`/sign-up?email=${encodeURIComponent(value.email)}`)}
                    className="w-fit"
                  >
                    Créer un compte
                  </Button>
                </div>,
              )
            } else {
              setError(signInError.message || "Email ou mot de passe incorrect.")
            }
          }
          setIsPending(false)
        } else {
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

      {error && <Alert description={error} type="error" showIcon className="mb-4" />}

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

        <FormField
          form={form}
          name="password"
          label="Mot de passe"
          extra={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          }
          required
        >
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

      <Divider plain>Ou continuer avec</Divider>

      <Row gutter={12}>
        <Col span={12}>
          <Button
            block
            icon={
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            }
            onClick={async () => {
              await signIn.social({
                provider: "google",
                callbackURL: "/",
              })
            }}
          >
            Google
          </Button>
        </Col>
        <Col span={12}>
          <Button
            block
            icon={
              <svg
                viewBox="0 0 23 23"
                width="18"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2"
              >
                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
            }
            onClick={async () => {
              await signIn.social({
                provider: "microsoft",
                callbackURL: "/",
              })
            }}
          >
            Microsoft
          </Button>
        </Col>
      </Row>

      {/* <Divider plain>Ou</Divider>

      <Link href="/">
        <Button block className="flex items-center justify-center">
          <span className="flex items-center gap-2">
            Continuer sans compte
            <ArrowRight size={18} />
          </span>
        </Button>
      </Link> */}
    </Card>
  )
}

const SignInPage = () => (
  <Suspense
    fallback={
      <Card className="flex items-center justify-center py-20 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    }
  >
    <SignInContent />
  </Suspense>
)

export default SignInPage
