import { rateLimit, ipKeyGenerator } from "express-rate-limit"
import type { NextFunction, Request, Response } from "express"
import type { Options } from "express-rate-limit"
import { logger } from "@repo/logger"

const getRealIp = (req: Request): string => {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.ip ??
    "0.0.0.0"
  return ipKeyGenerator(ip)
}

/**
 * Internal IP whitelist (Docker healthchecks, local dev).
 * Docker healthchecks connect directly (no Traefik), seeing the container's gateway IP (172.*).
 */
const isLocalOrPrivate = (ip: string): boolean =>
  ip === "127.0.0.1" ||
  ip === "::ffff:127.0.0.1" ||
  ip === "::1" ||
  ip.startsWith("10.") ||
  ip.startsWith("::ffff:10.") ||
  ip.startsWith("172.") ||
  ip.startsWith("::ffff:172.") ||
  ip.startsWith("192.168.") ||
  ip.startsWith("::ffff:192.168.")

// ---------------------------------------------------------------------------
// Shared handler factory
// ---------------------------------------------------------------------------

const makeHandler =
  (label: string, message: string) =>
  (req: Request, res: Response, _next: NextFunction, options: Options) => {
    const ip = getRealIp(req)
    logger.warn(`[${label}] IP: ${ip} | path: ${req.path} | UA: ${req.headers["user-agent"]}`)
    res.status(options.statusCode).json({
      error: "Too Many Requests",
      message,
    })
  }

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------

/**
 * Default API limiter: 200 req / 15 min.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRealIp,
  skip: (req) => isLocalOrPrivate(getRealIp(req)),
  handler: makeHandler("RATE LIMIT EXCEEDED", "Too many requests. Please try again in 15 minutes."),
})

/**
 * Auth limiter: 50 req / 15 min.
 * Protects against brute-force while allowing session checks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRealIp,
  skip: (req) => isLocalOrPrivate(getRealIp(req)),
  handler: makeHandler("AUTH RATE LIMIT EXCEEDED", "Too many attempts. Please try again later."),
})

/**
 * Expensive operations limiter (LLM, ingestion): 20 req / 15 min.
 */
export const expensiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRealIp,
  skip: (req) => isLocalOrPrivate(getRealIp(req)),
  handler: makeHandler(
    "EXPENSIVE RATE LIMIT EXCEEDED",
    "Limit reached for this operation. Please wait 15 minutes.",
  ),
})
