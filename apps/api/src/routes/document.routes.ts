import { Router } from "express"
import { listDocuments, uploadDocument, runIngestion } from "../controllers/document.controller"
import { requireAuth, requireAdmin } from "../middlewares/auth"
import { upload } from "../lib/multer"

const router: Router = Router()

router.get("/", requireAuth, listDocuments)

// --- Admin routes ---
router.post("/upload", requireAdmin, upload.single("file"), uploadDocument)

router.post("/:id/ingest", requireAdmin, runIngestion)

export default router
