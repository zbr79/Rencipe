import { Request, Response } from "express";
import Draft, { IDraft } from "../models/Draft";
import mongoose from "mongoose";

/**
 * POST /drafts
 * Save or update a recipe draft
 */
export async function saveDraft(req: Request, res: Response) {
  try {
    const { authorId, title, description, image, mainIngredients, seasonings, steps, servings, tags } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    // Update or create draft (one per author)
    const draft = await Draft.findOneAndUpdate(
      { authorId: new mongoose.Types.ObjectId(authorId) },
      {
        title: title || "",
        description: description || "",
        image: image || undefined,
        mainIngredients: mainIngredients || [],
        seasonings: seasonings || [],
        steps: steps || [],
        servings: servings || 1,
        tags: tags || [],
      },
      { upsert: true, returnDocument: 'after', new: true }
    );

    res.json({ draft });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to save draft" });
  }
}

/**
 * GET /drafts
 * Get the user's draft
 */
export async function getDraft(req: Request, res: Response) {
  try {
    const { authorId } = req.query;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId as string)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    const draft = await Draft.findOne({ authorId: new mongoose.Types.ObjectId(authorId as string) });

    res.json({ draft });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to get draft" });
  }
}

/**
 * DELETE /drafts
 * Delete the user's draft
 */
export async function deleteDraft(req: Request, res: Response) {
  try {
    const { authorId } = req.query;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId as string)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    const result = await Draft.findOneAndDelete({
      authorId: new mongoose.Types.ObjectId(authorId as string),
    });

    if (!result) {
      return res.status(404).json({ error: "draft not found" });
    }

    res.json({ message: "draft deleted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to delete draft" });
  }
}
