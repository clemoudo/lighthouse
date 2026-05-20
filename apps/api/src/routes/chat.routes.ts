import { Router } from "express"
import { handleChat } from "../controllers/chat.controller"
import { requireAuth } from "../middlewares/auth"
import { expensiveRateLimiter } from "../middlewares/rate-limiter"

const router: Router = Router()

router.post("/", expensiveRateLimiter, requireAuth, handleChat)

export default router
