"use client"

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import { ThemeProvider, useTheme } from "next-themes"
import { ReactNode, useState, useEffect } from "react"
import { AuthProvider } from "./AuthContext"
import { ConfigProvider, theme, App } from "antd"
import type { MessageInstance } from "antd/es/message/interface"
import type { NotificationInstance } from "antd/es/notification/interface"
import type { ModalStaticFunctions } from "antd/es/modal/confirm"
import { StyleProvider } from "@ant-design/cssinjs"
import frBE from "antd/locale/fr_BE"
import { logger } from "@repo/logger"

// Global references for antd static methods
export let message: MessageInstance
export let notification: NotificationInstance
export let modal: Omit<ModalStaticFunctions, "warn">

interface ApiError {
  status?: number
  message?: string
  data?: {
    code?: string
    message?: string
    details?: unknown
  }
}

const AntdThemeProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for component to mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <StyleProvider layer>
      <ConfigProvider
        locale={frBE}
        theme={{
          algorithm:
            mounted && resolvedTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#003f71",
            colorInfo: "#3c91e6",
            colorSuccess: "#4fba5a",
            colorWarning: "#ea890b",
            colorError: "#d13523",
            borderRadius: 12,
            fontFamily: "var(--font-inter)",
          },
          cssVar: { key: "ant" },
          hashed: false,
        }}
      >
        <App>
          <GlobalErrorHandler />
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  )
}

/**
 * Component to catch and display global errors via Ant Design App context
 * It populates the global references for use outside of React components (like QueryClient)
 */
const GlobalErrorHandler = () => {
  const staticApp = App.useApp()

  useEffect(() => {
    message = staticApp.message
    notification = staticApp.notification
    modal = staticApp.modal
  }, [staticApp])

  return null
}

export const Providers = ({ children }: Readonly<{ children: ReactNode }>) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: (failureCount, error: ApiError) => {
              // Non-retryable status codes
              const status = error?.status
              if (status === 401 || status === 403 || status === 404 || status === 429) {
                return false
              }
              // Max 3 retries
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
        queryCache: new QueryCache({
          onError: (error: ApiError, query) => {
            // Display error message if defined in meta, or if it's a critical error
            if (query.meta?.errorMessage && message) {
              message.error(String(query.meta.errorMessage))
            } else if (error?.status === 429 && message) {
              message.warning("Trop de requêtes. Veuillez patienter un instant.")
            }
            logger.error(`[Query Error] ${query.queryKey}:`, error)
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: ApiError, _variables, _context, mutation) => {
            const responseData = error?.data
            const errorMessage =
              mutation.meta?.errorMessage ||
              responseData?.message ||
              error?.message ||
              "Une erreur est survenue."

            if (message) {
              message.error(String(errorMessage))
            }
            logger.error(`[Mutation Error]:`, error)
          },
        }),
      }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AntdThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </AntdThemeProvider>
    </ThemeProvider>
  )
}
