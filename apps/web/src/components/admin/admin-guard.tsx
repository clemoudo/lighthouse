"use client"

import { useSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { Spin, Flex } from "antd"
import { UserRole } from "@/api/generated/model"
import React from "react"

interface AdminGuardProps {
  children: React.ReactNode
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <Flex align="center" justify="center" className="h-[80vh] w-full">
        <Spin size="large" tip="Vérification des accès administrateur..." />
      </Flex>
    )
  }

  // Si pas de session ou pas admin, redirection vers l'accueil
  if (!session || session.user.role !== UserRole.admin) {
    redirect("/")
  }

  return <>{children}</>
}
