"use client"

import { useEffect } from "react"
import { Button, Result, Flex, Space } from "antd"
import { logger } from "@repo/logger"
import { RefreshCcw } from "lucide-react"

const Error = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    logger.error("Global Frontend Error:", error)
  }, [error])

  return (
    <Flex align="center" justify="center" className="min-h-screen p-4">
      <Result
        status="error"
        title="Une erreur est survenue"
        subTitle="Désolé, quelque chose s'est mal passé."
        extra={
          <Space>
            <Button type="primary" icon={<RefreshCcw size={16} />} onClick={() => reset()}>
              Réessayer
            </Button>
            <Button onClick={() => (window.location.href = "/")}>Retour à l'accueil</Button>
          </Space>
        }
      />
    </Flex>
  )
}

export default Error
