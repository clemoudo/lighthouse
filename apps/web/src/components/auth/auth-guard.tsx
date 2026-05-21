"use client"

import { useSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { Spin } from "antd"
import React from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Spin size="large" description="Vérification de l'authentification..." />
      </div>
    )
  }

  if (!session) {
    redirect("/sign-in")
  }

  return <>{children}</>
}
