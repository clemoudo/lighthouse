import { Router } from "express"
import { getUsageStats, getUsersUsageSummary } from "../controllers/admin.controller"
import { requireAdmin } from "../middlewares/auth"

const router: Router = Router()

/**
 * @route GET /admin/stats/usage
 * @desc Get token usage statistics
 * @access Private (Admin)
 */
router.get("/stats/usage", requireAdmin, getUsageStats)

/**
 * @route GET /admin/stats/users
 * @desc Get usage summary for all users
 * @access Private (Admin)
 */
router.get("/stats/users", requireAdmin, getUsersUsageSummary)

export default router
