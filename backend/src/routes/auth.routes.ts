import express from "express";
import { login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/auth/login", login);
router.get("/auth/me", requireAuth, me);

export default router;
