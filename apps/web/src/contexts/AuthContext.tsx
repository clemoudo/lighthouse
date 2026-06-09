"use client"

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from "react"
import { authClient, useSession, signIn } from "@/lib/auth-client"

type Session = typeof authClient.$Infer.Session.session
type User = typeof authClient.$Infer.Session.user

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isAnonymous: boolean
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: sessionData, isPending: isSessionPending, error, refetch } = useSession()
  const [isInitializingAnonymous, setIsInitializingAnonymous] = useState(false)

  useEffect(() => {
    const initAnonymous = async () => {
      if (!isSessionPending && !sessionData && !isInitializingAnonymous) {
        setIsInitializingAnonymous(true)
        try {
          await signIn.anonymous()
          await refetch()
        } catch (err) {
          console.error("Failed to initialize anonymous session:", err)
        } finally {
          setIsInitializingAnonymous(false)
        }
      }
    }

    initAnonymous()
  }, [sessionData, isSessionPending, isInitializingAnonymous, refetch])

  const isLoading = isSessionPending || isInitializingAnonymous

  const value = useMemo(() => {
    return {
      user: sessionData?.user ?? null,
      session: sessionData?.session ?? null,
      isAuthenticated: !!sessionData,
      isAnonymous: !!sessionData?.user?.isAnonymous,
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
