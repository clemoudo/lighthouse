"use client"

import { useAuth } from "@/contexts/AuthContext"
import { redirect } from "next/navigation"
import { Spin, Flex } from "antd"
import React from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { session, isLoading, isAnonymous } = useAuth()

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="h-[80vh] w-full">
        <Spin size="large" description="Vérification de l'authentification..." />
      </Flex>
    )
  }

  if (!session || isAnonymous) {
    redirect("/sign-in")
  }

  return <>{children}</>
}
