import { rateLimit } from "express-rate-limit"
import type { Request } from "express"
import { logger } from "@repo/logger"

/**
 * Normalizes the client IP by removing IPv6 prefixes and potential port numbers.
 */
const getClientIp = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || "0.0.0.0"
  // Remove IPv6 prefix and strip port if present (some proxies append it)
  return ip.replace(/^::ffff:/, "").replace(/:\d+$/, "")
}

/**
 * Whitelist for localhost and private networks (Docker gateway)
 * to allow healthchecks and local development.
 */
const isLocalhost = (req: Request) => {
  const cleanIp = getClientIp(req)

  return (
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    // Private ranges common in Docker / Local networks
    cleanIp.startsWith("172.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("10.")
  )
}

/**
 * Default rate limiter for the API.
 * 100 requests per 15 minutes.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
  keyGenerator: getClientIp,
  handler: (req, res, _next, options) => {
    logger.warn(`[RATE LIMIT EXCEEDED] IP: ${getClientIp(req)} tried to access ${req.path}`)
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
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
  keyGenerator: getClientIp,
  handler: (req, res, _next, options) => {
    logger.warn(`[AUTH RATE LIMIT EXCEEDED] IP: ${getClientIp(req)} tried to access ${req.path}`)
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
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhost,
  keyGenerator: getClientIp,
  handler: (req, res, _next, options) => {
    logger.warn(
      `[EXPENSIVE RATE LIMIT EXCEEDED] IP: ${getClientIp(req)} tried to access ${req.path}`,
    )
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message: "Limite de requêtes atteinte pour cette opération coûteuse. Veuillez patienter.",
    })
  },
})
