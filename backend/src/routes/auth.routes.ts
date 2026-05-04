import express from "express";
import { login, me, updateProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/auth/login", login);
router.get("/auth/me", requireAuth, me);
router.patch("/auth/profile", requireAuth, updateProfile);

export default router;
