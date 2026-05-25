"use client"

import { useAuth } from "@/contexts/AuthContext"
import { redirect } from "next/navigation"
import { Spin, Flex } from "antd"
import { UserRole } from "@/api/generated/model"
import React from "react"

interface AdminGuardProps {
  children: React.ReactNode
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="h-[80vh] w-full">
        <Spin size="large" description="Vérification des accès administrateur..." />
      </Flex>
    )
  }

  // Si pas de session ou pas admin, redirection vers l'accueil
  if (!user || user.role !== UserRole.admin) {
    redirect("/")
  }

  return <>{children}</>
}
