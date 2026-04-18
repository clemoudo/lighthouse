import type { Request, Response, NextFunction } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../lib/auth"

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!session) {
    req.user = null
    req.session = null
    return next()
  }

  req.user = session.user
  req.session = session.session
  next()
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "You must be logged in to access this resource" })
  }
  next()
}
