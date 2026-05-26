"use client"

import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, Input, Button, Alert, Typography, Form, App, Spin } from "antd"
import { Lock, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { emailOtp } from "@/lib/auth-client"
import { FormField } from "@/components/form-field"

const { Title, Text } = Typography
const { Password, OTP } = Input

const resetPasswordSchema = z
  .object({
    otp: z.string().min(1, "Le code est requis"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "La confirmation est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

const ResetPasswordContent = () => {
  const { message } = App.useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [step, setStep] = useState<"otp" | "password">("otp")
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm({
    defaultValues: {
      otp: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      if (!email) {
        setError("Adresse e-mail manquante. Veuillez recommencer la procédure.")
        return
      }

      setError(null)
      setIsPending(true)

      try {
        const { error: resetError } = await emailOtp.resetPassword({
          email: email,
          otp: value.otp,
          password: value.password,
        })

        if (resetError) {
          setError(resetError.message || "Code invalide ou expiré.")
          setIsPending(false)
        } else {
          setIsSuccess(true)
          message.success("Mot de passe réinitialisé avec succès !")
          setTimeout(() => {
            router.push("/sign-in")
          }, 3000)
        }
      } catch (err) {
        setError(`Une erreur inattendue est survenue : ${err}`)
        setIsPending(false)
      }
    },
  })

  const handleVerifyOtp = async (otp: string) => {
    if (otp.length !== 6) return

    setIsVerifying(true)
    setError(null)

    try {
      const { error: verifyError } = await emailOtp.checkVerificationOtp({
        email,
        otp,
        type: "forget-password",
      })

      if (verifyError) {
        setError(verifyError.message || "Code de vérification incorrect ou expiré.")
      } else {
        setStep("password")
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la vérification du code.")
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  if (!email && !isSuccess) {
    return (
      <Card className="shadow-lg text-center">
        <Alert
          title="Lien invalide"
          description="L'adresse e-mail est manquante dans l'URL. Veuillez demander un nouveau code."
          type="error"
          showIcon
          className="mb-6"
        />
        <Link href="/forgot-password">
          <Button type="primary">Demander un nouveau code</Button>
        </Link>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className="shadow-lg text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 size={64} className="text-success" />
          <Title level={2} style={{ margin: 0 }}>
            Mot de passe réinitialisé
          </Title>
          <Text type="secondary">
            Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page
            de connexion dans quelques secondes...
          </Text>
          <Link href="/sign-in" className="mt-4">
            <Button type="primary">Se connecter maintenant</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <div className="mb-6 text-center">
        <Title level={2} style={{ margin: 0 }}>
          {step === "otp" ? "Vérification du code" : "Nouveau mot de passe"}
        </Title>
        <Text type="secondary">
          {step === "otp"
            ? `Saisissez le code reçu par e-mail pour ${email}`
            : `Choisissez un nouveau mot de passe pour ${email}`}
        </Text>
      </div>

      {error && <Alert title={error} type="error" showIcon className="mb-4" />}

      <Form
        layout="vertical"
        size="large"
        onFinish={() => {
          if (step === "otp") {
            handleVerifyOtp(form.getFieldValue("otp"))
          } else {
            form.handleSubmit()
          }
        }}
        requiredMark="optional"
      >
        {step === "otp" ? (
          <div className="flex flex-col items-center gap-6">
            <FormField form={form} name="otp" required>
              {(field) => (
                <div className="relative">
                  <OTP
                    length={6}
                    value={field.state.value}
                    onChange={(val) => {
                      field.handleChange(val)
                      if (val.length === 6) {
                        handleVerifyOtp(val)
                      }
                    }}
                    disabled={isVerifying}
                    size="large"
                    autoFocus
                  />
                  {isVerifying && (
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2">
                      <Spin size="small" />
                    </div>
                  )}
                </div>
              )}
            </FormField>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isVerifying}
              icon={!isVerifying && <CheckCircle2 size={18} />}
            >
              Valider le code
            </Button>
          </div>
        ) : (
          <>
            <FormField form={form} name="password" label="Nouveau mot de passe" required>
              {(field) => (
                <Password
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  prefix={<Lock size={18} style={{ opacity: 0.45 }} />}
                  placeholder="••••••••"
                  autoFocus
                />
              )}
            </FormField>

            <FormField
              form={form}
              name="confirmPassword"
              label="Confirmer le mot de passe"
              required
            >
              {(field) => (
                <Password
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  prefix={<Lock size={18} style={{ opacity: 0.45 }} />}
                  placeholder="••••••••"
                />
              )}
            </FormField>

            <Button type="primary" htmlType="submit" block loading={isPending}>
              Réinitialiser le mot de passe
            </Button>
          </>
        )}
      </Form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link
          href="/forgot-password"
          className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <ArrowLeft size={16} />
          Renvoyer un code
        </Link>
      </div>
    </Card>
  )
}

const ResetPasswordPage = () => (
  <Suspense
    fallback={
      <Card className="flex items-center justify-center py-20 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    }
  >
    <ResetPasswordContent />
  </Suspense>
)

export default ResetPasswordPage
