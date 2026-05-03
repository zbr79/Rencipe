import { Router } from "express";
import { saveDraft, getDraft, updateDraft, deleteDraft } from "../controllers/draft.controller";

const router = Router();

router.post("/", saveDraft);
router.get("/", getDraft);
router.put("/", updateDraft);
router.put("/:id", updateDraft);
router.delete("/", deleteDraft);

export default router;
