import { Router } from "express"
import {
  handleChat,
  getConversations,
  getConversationById,
  deleteConversation,
  getChatUsage,
} from "../controllers/chat.controller"
import { requireAuth } from "../middlewares/auth"
import { expensiveRateLimiter } from "../middlewares/rate-limiter"

const router: Router = Router()

router.get("/conversations", requireAuth, getConversations)
router.get("/conversations/:id", requireAuth, getConversationById)
router.delete("/conversations/:id", requireAuth, deleteConversation)
router.get("/usage", requireAuth, getChatUsage)
router.post("/", expensiveRateLimiter, requireAuth, handleChat)

export default router
