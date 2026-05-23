import { rateLimit } from "express-rate-limit"
import type { Request } from "express"
import { logger } from "@repo/logger"

/**
 * Whitelist for localhost and private networks (Docker gateway)
 * to allow healthchecks and local development.
 */
const isLocalhost = (req: Request) => {
  const ip = req.ip || "0.0.0.0"

  return (
    ip === "127.0.0.1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "::1" ||
    // Private ranges common in Docker / Local networks
    ip.startsWith("172.") ||
    ip.startsWith("::ffff:172.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::ffff:192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("::ffff:10.")
  )
}

/**
 * Default rate limiter for the API.
 * 100 requests per 15 minutes.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
  handler: (req, res, _next, options) => {
    logger.warn(`[RATE LIMIT EXCEEDED] IP: ${req.ip} tried to access ${req.path}`)
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: options.message,
    })
  },
})

/**
 * More restrictive rate limiter for authentication/sensitive routes.
 * 5 attempts per 15 minutes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
  handler: (req, res, _next, options) => {
    logger.warn(`[AUTH RATE LIMIT EXCEEDED] IP: ${req.ip} tried to access ${req.path}`)
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: "Trop de tentatives. Veuillez réessayer plus tard.",
    })
  },
})

/**
 * Rate limiter for expensive operations (LLM calls, ingestion).
 * 20 requests per 15 minutes.
 */
export const expensiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
  handler: (req, res, _next, options) => {
    logger.warn(`[EXPENSIVE RATE LIMIT EXCEEDED] IP: ${req.ip} tried to access ${req.path}`)
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: "Limite de requêtes atteinte pour cette opération coûteuse. Veuillez patienter.",
    })
  },
})
