"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, Form, Input, Button, Alert, Typography } from "antd"
import { User, Mail, Lock } from "lucide-react"
import { signUp } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"

const { Title, Text } = Typography

interface SignUpValues {
  name: string
  email: string
  password: string
}

export default function SignUpPage() {
  const router = useRouter()
  const { refetch } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const onFinish = async (values: SignUpValues) => {
    setError(null)
    setIsPending(true)

    try {
      const { error: signUpError } = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
        callbackURL: "/",
      })

      if (signUpError) {
        setError(signUpError.message || "Une erreur est survenue lors de l'inscription.")
        setIsPending(false)
      } else {
        await refetch()
        router.push("/")
      }
    } catch (err) {
      setError(`Une erreur inattendue est survenue : ${err}`)
      setIsPending(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="mb-6 text-center">
        <Title level={2} style={{ margin: 0 }}>
          Créer un compte
        </Title>
        <Text type="secondary">Inscrivez-vous pour accéder au programme scolaire</Text>
      </div>

      {error && <Alert title="Erreur" description={error} type="error" showIcon className="mb-4" />}

      <Form name="signup" layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
        <Form.Item
          label="Nom complet"
          name="name"
          rules={[{ required: true, message: "Veuillez saisir votre nom complet" }]}
        >
          <Input prefix={<User size={18} style={{ opacity: 0.45 }} />} placeholder="Jean Dupont" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Veuillez saisir votre email" },
            { type: "email", message: "Veuillez saisir un email valide" },
          ]}
        >
          <Input
            prefix={<Mail size={18} style={{ opacity: 0.45 }} />}
            placeholder="jean.dupont@example.com"
          />
        </Form.Item>

        <Form.Item
          label="Mot de passe"
          name="password"
          rules={[{ required: true, message: "Veuillez saisir votre mot de passe" }]}
        >
          <Input.Password
            prefix={<Lock size={18} style={{ opacity: 0.45 }} />}
            placeholder="••••••••"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" block loading={isPending}>
            S'inscrire
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Text type="secondary" className="text-sm">
          Déjà un compte ?{" "}
          <a href="/sign-in" className="font-medium text-primary">
            Se connecter
          </a>
        </Text>
      </div>
    </Card>
  )
}
