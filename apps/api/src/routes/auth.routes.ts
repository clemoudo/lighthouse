import { Router } from "express"
import { getAuthStatus, getProfile } from "../controllers/auth.controller"
import { requireAuth } from "../middlewares/auth"

const router: Router = Router()

router.get("/check", getAuthStatus)
router.get("/profile", requireAuth, getProfile)

export default router
