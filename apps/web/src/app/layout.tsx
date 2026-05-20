import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/contexts/providers"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Lighthouse - Assistant Programme Scolaire",
  description:
    "Application pour les institutrices maternelles - Recherche sémantique, référentiel et suivi des compétences",
  icons: {
    icon: "/lighthouse-32.ico",
    apple: "/lighthouse-64.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AntdRegistry>
          <Providers>
            <div className="min-h-screen bg-layout text-text">{children}</div>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  )
}
