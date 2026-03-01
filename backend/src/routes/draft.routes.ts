import { Router } from "express";
import { saveDraft, getDraft, deleteDraft } from "../controllers/draft.controller";

const router = Router();

router.post("/", saveDraft);
router.get("/", getDraft);
router.delete("/", deleteDraft);

export default router;
