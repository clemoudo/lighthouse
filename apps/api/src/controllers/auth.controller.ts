import type { Request, Response } from "express"

export const getAuthStatus = async (req: Request, res: Response) => {
  res.json({
    authenticated: !!req.user,
    user: req.user,
  })
}

export const getProfile = async (req: Request, res: Response) => {
  res.json({
    user: req.user,
  })
}
