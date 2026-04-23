"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, useTheme } from "next-themes"
import { ReactNode, useState, useEffect } from "react"
import { AuthProvider } from "./AuthContext"
import { ConfigProvider, theme } from "antd"
import frBE from "antd/locale/fr_BE"

function AntdThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for component to mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ConfigProvider
      locale={frBE}
      theme={{
        algorithm:
          mounted && resolvedTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#2563eb", // Using your primary blue
          borderRadius: 20,
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
          },
        },
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
