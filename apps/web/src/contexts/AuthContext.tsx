"use client"

import React, { createContext, useContext, ReactNode, useMemo } from "react"
import { authClient, useSession } from "@/lib/auth-client"

type Session = typeof authClient.$Infer.Session.session
type User = typeof authClient.$Infer.Session.user

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: sessionData, isPending: isLoading, error, refetch } = useSession()

  const value = useMemo(() => {
    return {
      user: sessionData?.user ?? null,
      session: sessionData?.session ?? null,
      isAuthenticated: !!sessionData,
      isLoading,
      isError: !!error,
      refetch: async () => {
        await refetch()
      },
    }
  }, [sessionData, isLoading, error, refetch])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
