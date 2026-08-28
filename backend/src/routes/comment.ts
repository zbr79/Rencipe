import express from "express";
import {
  createComment,
  deleteComment,
  listComments,
  upvoteComment,
} from "../controllers/comment";
import { authenticateOptional, requireAccount, requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/comments/:commentId/upvote", requireAccount, upvoteComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);
router.get("/comments/:entryType/:entryId", authenticateOptional, listComments);
router.post("/comments/:entryType/:entryId", requireAccount, createComment);

export default router;
