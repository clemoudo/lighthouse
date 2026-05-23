"use client"

import React, { useState, Suspense, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, Input, Button, Alert, Typography, Form, Divider, Result, Col, Row } from "antd"
import { User, Mail, Lock, ShieldCheck, LogIn, Loader2 } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { authClient, signUp, signIn } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"
import { FormField } from "@/components/form-field"

const { Title, Text } = Typography
const { OTP } = Input

const signUpSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.email("Veuillez saisir un email valide").min(1, "L'email est requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

const SignUpContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refetch } = useAuth()

  const [error, setError] = useState<React.ReactNode | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  // Only keep email for OTP step
  const [email, setEmail] = useState("")

  // Handle countdown for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const initialEmail = searchParams.get("email") || ""

  const form = useForm({
    defaultValues: {
      name: "",
      email: initialEmail,
      password: "",
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setIsPending(true)
      setEmail(value.email)

      try {
        const { error: signUpError } = await signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
          callbackURL: "/",
        })

        if (signUpError) {
          if (signUpError.code === "USER_ALREADY_EXISTS") {
            setError(
              <div className="flex flex-col gap-2">
                <Text strong>Cet e-mail est déjà utilisé.</Text>
                <Text className="text-sm">Il semble que vous ayez déjà un compte.</Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<LogIn size={14} />}
                  onClick={() => router.push(`/sign-in?email=${encodeURIComponent(value.email)}`)}
                  className="w-fit"
                >
                  Se connecter
                </Button>
              </div>,
            )
          } else {
            setError(signUpError.message || "Une erreur est survenue lors de l'inscription.")
          }
          setIsPending(false)
        } else {
          // Manual send OTP with type 'sign-in' to allow session creation later
          await authClient.emailOtp.sendVerificationOtp({
            email: value.email,
            type: "sign-in",
          })
          setShowOtp(true)
          setIsPending(false)
        }
      } catch (err) {
        setError(`Une erreur inattendue est survenue : ${err}`)
        setIsPending(false)
      }
    },
  })

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return

    setIsResending(true)
    setError(null)

    try {
      const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
      })

      if (resendError) {
        setError(resendError.message || "Impossible de renvoyer le code.")
      } else {
        setResendCountdown(60) // 1 minute cooldown
        setOtpValue("") // Clear previous OTP
      }
    } catch (err) {
      setError(`Erreur lors du renvoi : ${err}`)
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyOtp = async (value?: string) => {
    const currentOtp = value || otpValue
    if (currentOtp.length < 6 || isVerifying) return

    setError(null)
    setIsVerifying(true)

    try {
      // Use signIn.emailOtp: it verifies the email AND logs the user in (creates session)
      const { error: signInError } = await authClient.signIn.emailOtp({
        email: email,
        otp: currentOtp,
      })

      if (signInError) {
        setError(signInError.message || "Code invalide ou expiré.")
        setIsVerifying(false)
      } else {
        setIsSuccess(true)
        await refetch()
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      setError(`Erreur lors de la vérification : ${err}`)
      setIsVerifying(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="shadow-lg">
        <Result
          status="success"
          title="Inscription réussie !"
          subTitle="Votre compte a été vérifié avec succès. Redirection vers l'accueil..."
        />
      </Card>
    )
  }

  if (showOtp) {
    return (
      <Card className="shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={24} />
          </div>
          <Title level={2} style={{ margin: 0 }}>
            Vérifiez votre e-mail
          </Title>
          <Text type="secondary">
            Nous avons envoyé un code de 6 chiffres à <strong>{email}</strong>. Ce code est valide
            pendant 5 minutes.
          </Text>
        </div>

        {error && <Alert description={error} type="error" showIcon className="mb-4" />}

        <Form layout="vertical" size="large">
          <Form.Item label="Code de vérification">
            <OTP
              value={otpValue}
              onChange={(val) => {
                setOtpValue(val)
                if (val.length === 6) {
                  handleVerifyOtp(val)
                }
              }}
              length={6}
              className="flex justify-center"
              autoFocus
            />
          </Form.Item>

          <Button
            type="primary"
            block
            onClick={() => handleVerifyOtp()}
            loading={isVerifying}
            disabled={otpValue.length < 6}
          >
            Vérifier le code
          </Button>

          <div className="mt-4 text-center">
            <Text type="secondary" className="text-sm">
              Vous n'avez pas reçu le code ?{" "}
            </Text>
            <Button
              type="link"
              size="small"
              onClick={handleResendOtp}
              disabled={resendCountdown > 0}
              loading={isResending}
              className="p-0 font-medium"
            >
              {resendCountdown > 0 ? `Renvoyer (${resendCountdown}s)` : "Renvoyer un code"}
            </Button>
          </div>

          <Button type="link" block onClick={() => setShowOtp(false)} className="mt-2">
            Retour
          </Button>
        </Form>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <div className="mb-6 text-center">
        <Title level={2} style={{ margin: 0 }}>
          Créer un compte
        </Title>
        <Text type="secondary">Inscrivez-vous pour accéder au programme scolaire</Text>
      </div>

      {error && <Alert description={error} type="error" showIcon className="mb-4" />}

      <Form
        layout="vertical"
        size="large"
        onFinish={() => form.handleSubmit()}
        requiredMark="optional"
      >
        <FormField form={form} name="name" label="Nom complet" required>
          {(field) => (
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              prefix={<User size={18} style={{ opacity: 0.45 }} />}
              placeholder="Jean Dupont"
            />
          )}
        </FormField>

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

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" block loading={isPending} className="mt-4">
            S'inscrire
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Text type="secondary" className="text-sm">
          Déjà un compte ?{" "}
          <Link href="/sign-in" className="font-medium text-primary">
            Se connecter
          </Link>
        </Text>
      </div>

      <Divider plain>Ou s'inscrire avec</Divider>

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

const SignUpPage = () => (
  <Suspense
    fallback={
      <Card className="flex items-center justify-center py-20 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    }
  >
    <SignUpContent />
  </Suspense>
)

export default SignUpPage
