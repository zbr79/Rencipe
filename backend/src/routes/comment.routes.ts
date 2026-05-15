import express from "express";
import {
  createComment,
  deleteComment,
  listComments,
  upvoteComment,
} from "../controllers/comment.controller";
import { authenticateOptional, requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/comments/:commentId/upvote", requireAuth, upvoteComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);
router.get("/comments/:entryType/:entryId", authenticateOptional, listComments);
router.post("/comments/:entryType/:entryId", requireAuth, createComment);

export default router;