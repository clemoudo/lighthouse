import { Router } from "express"
import { handleChat } from "../controllers/chat.controller"
import { requireAuth } from "../middlewares/auth"

const router: Router = Router()

router.post("/", requireAuth, handleChat)

export default router
