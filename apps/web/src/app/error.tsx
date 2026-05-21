"use client"

import { useEffect } from "react"
import { Button, Result } from "antd"
import { logger } from "@repo/logger"

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    logger.error("Global Frontend Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Result
        status="error"
        title="Une erreur est survenue"
        subTitle={"Désolé, quelque chose s'est mal passé."}
        extra={
          <Button type="primary" key="home" onClick={() => (window.location.href = "/")}>
            Retour à l'accueil
          </Button>
        }
      />
    </div>
  )
}
