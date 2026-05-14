"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, Input, Button, Alert, Typography, Form, Divider } from "antd"
import { User, Mail, Lock, ArrowRight } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { signUp } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"
import { FormField } from "@/components/ui/form-field"
import { getGetMeQueryKey } from "@/api/generated/lighthouse"

const { Title, Text } = Typography

// Zod 4 Schema for Registration
const signUpSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().min(1, "L'email est requis").email("Veuillez saisir un email valide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export default function SignUpPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { refetch } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setIsPending(true)

      try {
        const { error: signUpError } = await signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
          callbackURL: "/",
        })

        if (signUpError) {
          setError(signUpError.message || "Une erreur est survenue lors de l'inscription.")
          setIsPending(false)
        } else {
          // Invalidate user profile query in React Query
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() })
          // Refresh Better-Auth context
          await refetch()
          router.push("/")
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
          Créer un compte
        </Title>
        <Text type="secondary">Inscrivez-vous pour accéder au programme scolaire</Text>
      </div>

      {error && <Alert title="Erreur" description={error} type="error" showIcon className="mb-4" />}

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
