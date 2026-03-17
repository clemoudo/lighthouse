import "./globals.css"
import { Providers } from "@/contexts/Providers"

export default function RootLayout({ children }: { children: Readonly<React.ReactNode> }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
