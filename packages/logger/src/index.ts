type LogLevel = "info" | "warn" | "error" | "debug"

const logMessage = (level: LogLevel, message: unknown, ...args: unknown[]) => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  switch (level) {
    case "info":
      console.info(prefix, message, ...args)
      break
    case "warn":
      console.warn(prefix, message, ...args)
      break
    case "error":
      console.error(prefix, message, ...args)
      break
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(prefix, message, ...args)
      }
      break
  }
}

export const logger = {
  info: (message: unknown, ...args: unknown[]) => logMessage("info", message, ...args),
  warn: (message: unknown, ...args: unknown[]) => logMessage("warn", message, ...args),
  error: (message: unknown, ...args: unknown[]) => logMessage("error", message, ...args),
  debug: (message: unknown, ...args: unknown[]) => logMessage("debug", message, ...args),
}

// Keep backward compatibility
export const log = logger.info
