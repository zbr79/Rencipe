

import { Request, Response } from "express";
import mongoose from "mongoose";
import Comment, { CommentEntryType } from "../models/Comment";
import Meal from "../models/Meal";
import Recipe from "../models/Recipe";
import { getAuthUser } from "../middleware/auth";



function activeQuery() {
  return {
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}



function normalizeEntryType(value: string): CommentEntryType | null {
  return value === "recipe" || value === "meal" ? value : null;
}



function objectIdEquals(value: unknown, expected: string) {
  return String(value || "") === expected;
}



function hasUpvoted(upvotedBy: mongoose.Types.ObjectId[] = [], userId?: string) {
  if (!userId) return false;
  return upvotedBy.some((id) => objectIdEquals(id, userId));
}



function canDelete(user: ReturnType<typeof getAuthUser>, ownerId: unknown) {
  if (!user) return false;
  return user.role === "admin" || objectIdEquals(ownerId, user.id);
}



async function canAccessEntry(req: Request, entryType: CommentEntryType, entryId: string) {
  const user = getAuthUser(req);

  if (entryType === "recipe") {
    const recipe = await Recipe.findOne({ _id: entryId, ...activeQuery() });
    if (!recipe) return false;
    if (recipe.isPublic !== false) return true;
    if (!user) return false;
    return user.role === "admin" || objectIdEquals(recipe.authorId, user.id);
  }

  const meal = await Meal.findOne({ _id: entryId, kind: "meal", ...activeQuery() });
  if (!meal) return false;
  if (meal.isPublic) return true;
  if (!user) return false;
  return user.role === "admin" || objectIdEquals(meal.userId, user.id);
}



function serializeComment(comment: any, user: ReturnType<typeof getAuthUser> = null) {
  const userId = user?.id;
  return {
    _id: String(comment._id),
    displayName: comment.displayName,
    text: comment.text,
    upvotes: comment.upvotedBy?.length || 0,
    upvotedByCurrentUser: hasUpvoted(comment.upvotedBy, userId),
    isOwn: Boolean(userId && objectIdEquals(comment.userId, userId)),
    canDelete: canDelete(user, comment.userId),
    createdAt: comment.createdAt,
    replies: (comment.replies || []).map((reply: any) => ({
      _id: String(reply._id),
      displayName: reply.displayName,
      text: reply.text,
      upvotes: reply.upvotedBy?.length || 0,
      upvotedByCurrentUser: hasUpvoted(reply.upvotedBy, userId),
      canDelete: canDelete(user, reply.userId),
      createdAt: reply.createdAt,
    })),
  };
}



function serializeComments(comments: any[], req: Request) {
  const user = getAuthUser(req);
  return comments.map((comment) => serializeComment(comment, user));
}



async function userHasComment(entryType: CommentEntryType, entryId: string, userId: string) {
  const existing = await Comment.exists({
    entryType,
    entryId: new mongoose.Types.ObjectId(entryId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  return Boolean(existing);
}



export async function listComments(req: Request, res: Response) {
  try {
    const entryType = normalizeEntryType(String(req.params.entryType || ""));
    const entryId = String(req.params.entryId || "");

    if (!entryType || !mongoose.Types.ObjectId.isValid(entryId)) {
      return res.status(400).json({ error: "Invalid comment target" });
    }

    if (!(await canAccessEntry(req, entryType, entryId))) {
      return res.status(404).json({ error: "Comment target not found" });
    }

    const comments = await Comment.find({ entryType, entryId: new mongoose.Types.ObjectId(entryId) }).sort({ createdAt: -1 });
    const user = getAuthUser(req);
    const canComment = Boolean(user) && !(await userHasComment(entryType, entryId, user!.id));
    res.json({ comments: serializeComments(comments, req), canComment });
  } catch (err: any) {
    console.error("Error listing comments:", err);
    res.status(500).json({ error: err.message });
  }
}



export async function createComment(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    const entryType = normalizeEntryType(String(req.params.entryType || ""));
    const entryId = String(req.params.entryId || "");
    const text = String(req.body.text || "").trim();

    if (!user) return res.status(401).json({ error: "Authentication required" });
    if (!entryType || !mongoose.Types.ObjectId.isValid(entryId)) return res.status(400).json({ error: "Invalid comment target" });
    if (!text) return res.status(400).json({ error: "Comment is required" });

    if (!(await canAccessEntry(req, entryType, entryId))) {
      return res.status(404).json({ error: "Comment target not found" });
    }

    if (await userHasComment(entryType, entryId, user.id)) {
      return res.status(409).json({ error: "You already commented here" });
    }

    const comment = await Comment.create({
      entryType,
      entryId: new mongoose.Types.ObjectId(entryId),
      userId: new mongoose.Types.ObjectId(user.id),
      displayName: user.displayName || user.username,
      text,
      upvotedBy: [],
      replies: [],
    });

    res.status(201).json({ comment: serializeComment(comment, user) });
  } catch (err: any) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: err.message });
  }
}



export async function deleteComment(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (!canDelete(user, comment.userId)) return res.status(403).json({ error: "Not allowed to delete this comment" });

    await comment.deleteOne();
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: err.message });
  }
}



export async function upvoteComment(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const alreadyUpvoted = hasUpvoted(comment.upvotedBy, user.id);
    comment.upvotedBy = alreadyUpvoted
      ? comment.upvotedBy.filter((id) => !objectIdEquals(id, user.id))
      : [...comment.upvotedBy, new mongoose.Types.ObjectId(user.id)];
    await comment.save();

    res.json({ comment: serializeComment(comment, user) });
  } catch (err: any) {
    console.error("Error upvoting comment:", err);
    res.status(500).json({ error: err.message });
  }
}



export async function createReply(req: Request, res: Response) {
  try {
    return res.status(410).json({ error: "Replies are not supported" });
  } catch (err: any) {
    console.error("Error creating reply:", err);
    res.status(500).json({ error: err.message });
  }
}



export async function upvoteReply(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const reply = (comment.replies as any).id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    const alreadyUpvoted = hasUpvoted(reply.upvotedBy, user.id);
    reply.upvotedBy = alreadyUpvoted
      ? reply.upvotedBy.filter((id: mongoose.Types.ObjectId) => !objectIdEquals(id, user.id))
      : [...reply.upvotedBy, new mongoose.Types.ObjectId(user.id)];
    await comment.save();

    res.json({ comment: serializeComment(comment, user) });
  } catch (err: any) {
    console.error("Error upvoting reply:", err);
    res.status(500).json({ error: err.message });
  }
}



export async function deleteReply(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const reply = (comment.replies as any).id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });
    if (!canDelete(user, reply.userId)) return res.status(403).json({ error: "Not allowed to delete this reply" });

    reply.deleteOne();
    await comment.save();
    res.json({ comment: serializeComment(comment, user) });
  } catch (err: any) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ error: err.message });
  }
}
