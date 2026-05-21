"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, Input, Button, Alert, Typography, Form, Divider, Result } from "antd"
import { User, Mail, Lock, ArrowRight, ShieldCheck, LogIn } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { authClient, signUp, signIn } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"
import { FormField } from "@/components/ui/form-field"

const { Title, Text } = Typography
const { OTP } = Input

const signUpSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().min(1, "L'email est requis").email("Veuillez saisir un email valide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refetch } = useAuth()

  const [error, setError] = useState<React.ReactNode | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  // States to keep info for automatic sign-in
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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
      setPassword(value.password)

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
          setShowOtp(true)
          setIsPending(false)
        }
      } catch (err) {
        setError(`Une erreur inattendue est survenue : ${err}`)
        setIsPending(false)
      }
    },
  })

  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) return

    setError(null)
    setIsVerifying(true)

    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email: email,
        otp: otpValue,
      })

      if (verifyError) {
        setError(verifyError.message || "Code invalide ou expiré.")
        setIsVerifying(false)
      } else {
        // Automatic sign-in after verification
        const { error: signInError } = await signIn.email({
          email,
          password,
          callbackURL: "/",
        })

        if (signInError) {
          // If auto-signin fails (shouldn't happen here), redirect to sign-in anyway
          router.push(`/sign-in?email=${encodeURIComponent(email)}`)
        } else {
          setIsSuccess(true)
          await refetch()
          setTimeout(() => {
            router.push("/")
          }, 2000)
        }
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
            Nous avons envoyé un code de 6 chiffres à <strong>{email}</strong>
          </Text>
        </div>

        {error && <Alert description={error} type="error" showIcon className="mb-4" />}

        <Form layout="vertical" size="large">
          <Form.Item label="Code de vérification">
            <OTP
              value={otpValue}
              onChange={(e) => setOtpValue(e)}
              length={6}
              className="text-center text-2xl tracking-[10px]"
              autoFocus
            />
          </Form.Item>

          <Button
            type="primary"
            block
            onClick={handleVerifyOtp}
            loading={isVerifying}
            disabled={otpValue.length < 6}
          >
            Vérifier le code
          </Button>

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
