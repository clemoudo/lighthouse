import { createServer } from "./server"
import { logger } from "@repo/logger"

const port = process.env.API_PORT || 5001
const server = createServer()

const nodeServer = server.listen(port, () => {
  logger.info(`🚀 API Gateway running on port ${port}`)
})

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`)
  nodeServer.close(() => {
    logger.info("HTTP server closed.")
    process.exit(0)
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
