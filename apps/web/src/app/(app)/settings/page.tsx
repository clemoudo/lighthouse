"use client"

import React, { useState } from "react"
import { Card, Input, Button, Divider, Form, App, Typography } from "antd"
import { User, Lock, Save, ShieldCheck, Trash2, AlertTriangle } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { PageHeader } from "@/components/page-header"
import { SectionHeader } from "@/components/section-header"
import { FormField } from "@/components/form-field"
import { useSession, updateUser, changePassword, deleteUser, authClient } from "@/lib/auth-client"
import { AuthGuard } from "@/components/auth/auth-guard"

const { Text } = Typography

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

const SettingsContent = () => {
  const { message, modal } = App.useApp()
  const { data: session, isPending: isSessionPending, refetch } = useSession()
  const [infoPending, setInfoPending] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

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

  // 3. Clear Data Logic
  const handleClearData = () => {
    modal.confirm({
      title: "Supprimer toutes vos données ?",
      width: 600,
      content: (
        <>
          <Text className="text-base block mb-4">
            Cette action supprimera définitivement toutes vos conversations et messages, mais votre
            compte sera conservé.
          </Text>
          <div className="rounded-md bg-warning-50/50 p-3 text-warning-800 border border-warning-100">
            <Text strong className="text-warning-800 text-sm">
              Attention : Cette action est irréversible.
            </Text>
          </div>
        </>
      ),
      okText: "Oui, supprimer mes données",
      okType: "danger",
      cancelText: "Annuler",
      centered: true,
      onOk: async () => {
        setIsClearing(true)
        try {
          const { error } = await authClient.clearData()
          if (error) {
            message.error("Erreur lors de la suppression des données")
          } else {
            message.success("Toutes vos données ont été supprimées.")
          }
        } catch (err) {
          message.error("Une erreur est survenue")
          console.log(err)
        } finally {
          setIsClearing(false)
        }
      },
    })
  }

  // 4. Delete Account Logic
  const handleDeleteAccount = () => {
    modal.confirm({
      title: "Supprimer définitivement votre compte ?",
      width: 600,
      content: (
        <div className="mt-2 flex flex-col gap-4">
          <Text className="text-base">
            Vous êtes sur le point de supprimer le compte associé à :
          </Text>
          <div className="mx-auto w-fit rounded-full bg-gray-100 px-4 py-1 border border-gray-200">
            <Text strong className="text-lg">
              {user?.email}
            </Text>
          </div>
          <Text>
            Toutes vos données seront supprimées de nos serveurs de manière{" "}
            <strong className="text-error-600 font-bold uppercase">définitive</strong>.
          </Text>
          <div className="mt-2 text-left">
            <Text type="secondary" className="mb-2 block text-sm">
              Pour confirmer, veuillez saisir l'adresse e-mail du compte :
            </Text>
            <Input id="confirm-email-input" placeholder={user?.email} size="large" />
          </div>
        </div>
      ),
      okText: "Supprimer définitivement mon compte",
      okButtonProps: {
        variant: "solid",
        danger: true,
      },
      okType: "primary",
      cancelText: "Annuler",
      centered: true,
      onOk: async () => {
        const input = document.getElementById("confirm-email-input") as HTMLInputElement
        if (input.value !== user?.email) {
          message.error("L'adresse e-mail saisie ne correspond pas.")
          return Promise.reject()
        }

        setIsDeleting(true)
        try {
          const { error } = await deleteUser()
          if (error) {
            message.error(error.message || "Erreur lors de la suppression du compte")
          } else {
            message.success("Votre compte a été supprimé. Au revoir !")
          }
        } catch (err) {
          message.error("Une erreur est survenue")
          console.log(err)
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  return (
    <>
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

        {/* Zone de danger */}
        <Card className="border-error-200 bg-error-50/10 shadow-sm">
          <SectionHeader
            title="Zone de danger"
            icon={AlertTriangle}
            className="mb-6 text-error"
            iconClassName="text-error"
          />

          <div className="flex flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <Text strong className="block">
                  Supprimer mes données
                </Text>
                <Text type="secondary" className="text-sm">
                  Supprime toutes vos conversations et messages, mais conserve votre compte.
                </Text>
              </div>
              <Button
                danger
                onClick={handleClearData}
                loading={isClearing}
                icon={<AlertTriangle size={18} />}
              >
                Supprimer les données
              </Button>
            </div>

            <Divider className="my-0" />

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <Text strong className="block text-error-600">
                  Supprimer mon compte
                </Text>
                <Text type="secondary" className="text-sm">
                  Supprime définitivement votre compte et toutes les données associées.
                </Text>
              </div>
              <Button
                type="primary"
                danger
                onClick={handleDeleteAccount}
                loading={isDeleting}
                icon={<Trash2 size={18} />}
              >
                Supprimer le compte
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

const SettingsPage = () => {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}

export default SettingsPage
