"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, Form, Input, Button, Alert, Typography, Checkbox } from "antd"
import { Mail, Lock } from "lucide-react"
import { signIn } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"

const { Title, Text } = Typography

interface SignInValues {
  email: string
  password: string
  remember?: boolean
}

export default function SignInPage() {
  const router = useRouter()
  const { refetch } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const onFinish = async (values: SignInValues) => {
    setError(null)
    setIsPending(true)

    try {
      const { error: signInError } = await signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/",
      })

      if (signInError) {
        setError(signInError.message || "Email ou mot de passe incorrect.")
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
          Connexion
        </Title>
        <Text type="secondary">Ravi de vous revoir ! Connectez-vous à votre compte.</Text>
      </div>

      {error && <Alert title="Erreur" description={error} type="error" showIcon className="mb-4" />}

      <Form
        name="signin"
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        size="large"
        initialValues={{ remember: true }}
      >
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

        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>Se souvenir de moi</Checkbox>
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" block loading={isPending}>
            Se connecter
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Text type="secondary" className="text-sm">
          Pas encore de compte ?{" "}
          <a href="/sign-up" className="font-medium text-primary">
            S'inscrire
          </a>
        </Text>
      </div>
    </Card>
  )
}
