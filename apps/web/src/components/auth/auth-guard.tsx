"use client"

import { useSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { Spin, Flex } from "antd"
import React from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <Flex align="center" justify="center" className="h-[80vh] w-full">
        <Spin size="large" description="Vérification de l'authentification..." />
      </Flex>
    )
  }

  if (!session) {
    redirect("/sign-in")
  }

  return <>{children}</>
}
