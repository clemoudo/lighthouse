"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, useTheme } from "next-themes"
import { ReactNode, useState, useEffect } from "react"
import { AuthProvider } from "./AuthContext"
import { ConfigProvider, theme, App } from "antd"
import { StyleProvider } from "@ant-design/cssinjs"
import frBE from "antd/locale/fr_BE"

function AntdThemeProvider({ children }: { children: ReactNode }) {
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
            colorPrimary: "#003f71", // Equivalent hex of oklch(0.35 0.12 240) for better tool support
            colorSuccess: "#299236", // Equivalent of oklch(0.58 0.16 145)
            colorWarning: "#d6810c", // Equivalent of oklch(0.68 0.15 65)
            colorError: "#c90019", // Equivalent of oklch(0.52 0.22 25)
            borderRadius: 12,
            fontFamily: "var(--font-inter)",
          },
          cssVar: { key: "ant" },
          hashed: false,
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
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
