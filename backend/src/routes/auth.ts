import express from "express";
import multer from "multer";
import { login, me, updateProfile, uploadAvatar, guestLogin, claimAccount } from "../controllers/auth";
import { requireAuth } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/auth/login", login);
router.post("/auth/guest", guestLogin);
router.get("/auth/me", requireAuth, me);
router.patch("/auth/profile", requireAuth, updateProfile);
router.post("/auth/profile/avatar", requireAuth, upload.single("image"), uploadAvatar);
router.post("/auth/claim", requireAuth, claimAccount);

export default router;
