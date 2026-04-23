"use client"

import React, { createContext, useContext, ReactNode, useMemo } from "react"
import { useGetAuthCheck } from "@/api/generated/lighthouse"
import type { User, Session } from "@/api/generated/model"

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetAuthCheck({
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: true,
    },
  })

  const value = useMemo(() => {
    // Orval wraps the response in a 'data' property because of multiple status codes
    const authData = response?.data

    return {
      user: authData?.user?.user ?? null,
      session: authData?.user?.session ?? null,
      isAuthenticated: !!authData?.authenticated,
      isLoading,
      isError,
      refetch,
    }
  }, [response, isLoading, isError, refetch])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
