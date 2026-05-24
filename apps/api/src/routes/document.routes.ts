import { Router } from "express"
import {
  listDocuments,
  uploadDocument,
  runIngestion,
  deleteDocument,
  getDocumentFile,
} from "../controllers/document.controller"
import { requireAuth, requireAdmin } from "../middlewares/auth"
import { upload } from "../lib/multer"
import { expensiveRateLimiter } from "../middlewares/rate-limiter"

const router: Router = Router()

router.get("/", requireAuth, listDocuments)

router.get("/:id/file", requireAuth, getDocumentFile)

// --- Admin routes ---
router.post("/upload", expensiveRateLimiter, requireAdmin, upload.single("file"), uploadDocument)

router.post("/:id/ingest", expensiveRateLimiter, requireAdmin, runIngestion)

router.delete("/:id", requireAdmin, deleteDocument)

export default router
