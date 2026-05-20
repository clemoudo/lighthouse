"use client"

import { useEffect } from "react"
import { Button, Result } from "antd"
import { logger } from "@repo/logger"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error("Global Frontend Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Result
        status="error"
        title="Une erreur est survenue"
        subTitle={error.message || "Désolé, quelque chose s'est mal passé."}
        extra={[
          <Button type="primary" key="retry" onClick={() => reset()}>
            Réessayer
          </Button>,
          <Button key="home" onClick={() => (window.location.href = "/")}>
            Retour à l'accueil
          </Button>,
        ]}
      />
    </div>
  )
}
