"use client"

import React, { useState } from "react"
import { Card, Input, Button, Divider, Form, App } from "antd"
import { User, Lock, Save, ShieldCheck } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { PageHeader } from "@/components/page-header"
import { SectionHeader } from "@/components/section-header"
import { FormField } from "@/components/ui/form-field"
import { useSession, updateUser, changePassword } from "@/lib/auth-client"
import { AuthGuard } from "@/components/auth/auth-guard"

// Validation Schemas
const infoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "La confirmation est requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

function SettingsContent() {
  const { message } = App.useApp()
  const { data: session, isPending: isSessionPending, refetch } = useSession()
  const [infoPending, setInfoPending] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)

  const user = session?.user

  // 1. Info Form
  const infoForm = useForm({
    defaultValues: {
      name: user?.name ?? "",
    },
    validators: {
      onChange: infoSchema,
    },
    onSubmit: async ({ value }) => {
      setInfoPending(true)
      try {
        const { error } = await updateUser({
          name: value.name,
        })

        if (error) {
          message.error(error.message || "Erreur lors de la mise à jour.")
        } else {
          message.success("Informations mises à jour avec succès")
          await refetch()
        }
      } catch (err) {
        message.error("Une erreur inattendue est survenue")
        console.log(err)
      } finally {
        setInfoPending(false)
      }
    },
  })

  // 2. Password Form
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onChange: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      setPasswordPending(true)
      try {
        const { error } = await changePassword({
          newPassword: value.newPassword,
          currentPassword: value.currentPassword,
          revokeOtherSessions: true,
        })

        if (error) {
          message.error(error.message || "Erreur lors du changement de mot de passe.")
        } else {
          message.success("Mot de passe modifié avec succès")
          passwordForm.reset()
        }
      } catch (err) {
        message.error("Une erreur inattendue est survenue")
        console.log(err)
      } finally {
        setPasswordPending(false)
      }
    },
  })

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Paramètres du compte"
        description="Gérez vos informations personnelles et la sécurité de votre compte."
        icon={User}
      />

      <div className="flex flex-col gap-8">
        {/* Informations personnelles */}
        <Card className="shadow-sm">
          <SectionHeader title="Informations personnelles" icon={User} className="mb-6" />

          <Form
            key={user?.id} // Re-initialize when user data is ready
            layout="vertical"
            size="large"
            onFinish={() => infoForm.handleSubmit()}
            requiredMark="optional"
            disabled={isSessionPending}
          >
            <FormField form={infoForm} name="name" label="Nom complet" required>
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  prefix={<User size={18} style={{ opacity: 0.45 }} />}
                />
              )}
            </FormField>

            <Form.Item label="Adresse e-mail">
              <Input
                value={user?.email}
                disabled
                prefix={<User size={18} style={{ opacity: 0.45 }} className="invisible" />}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Save size={18} />}
                loading={infoPending}
                className="mt-2"
              >
                Enregistrer les modifications
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Sécurité */}
        <Card className="shadow-sm">
          <SectionHeader title="Sécurité" icon={ShieldCheck} className="mb-6" />
          <Divider titlePlacement="start" className="mt-0">
            Changer le mot de passe
          </Divider>

          <Form
            layout="vertical"
            size="large"
            onFinish={() => passwordForm.handleSubmit()}
            requiredMark="optional"
          >
            <FormField
              form={passwordForm}
              name="currentPassword"
              label="Mot de passe actuel"
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

            <FormField form={passwordForm} name="newPassword" label="Nouveau mot de passe" required>
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

            <FormField
              form={passwordForm}
              name="confirmPassword"
              label="Confirmer le nouveau mot de passe"
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

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Lock size={18} />}
                loading={passwordPending}
                className="mt-2"
              >
                Mettre à jour le mot de passe
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}
