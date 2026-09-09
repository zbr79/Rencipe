import { Router } from "express";
import { saveDraft, getDraft, updateDraft, deleteDraft } from "../controllers/draft";
import { requireAccount } from "../middleware/auth";

const router = Router();

router.use(requireAccount);
router.post("/", saveDraft);
router.get("/", getDraft);
router.put("/", updateDraft);
router.put("/:id", updateDraft);
router.delete("/", deleteDraft);

export default router;
