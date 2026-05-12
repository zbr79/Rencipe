import { Request, Response } from "express";
import Draft, { IDraft } from "../models/Draft";
import mongoose from "mongoose";

/**
 * POST /drafts
 * Create a new recipe draft
 */
export async function saveDraft(req: Request, res: Response) {
  try {
    const {
      authorId,
      name,
      title,
      description,
      tips,
      recipeOrigin,
      sharedSource,
      sharedSourceLink,
      image,
      component,
      isPublic,
      mainIngredients,
      seasonings,
      steps,
      servings,
      tags,
    } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    // Create a new draft
    const draft = new Draft({
      authorId: new mongoose.Types.ObjectId(authorId),
      name: name || "Untitled Draft",
      title: title || "",
      description: description || "",
      tips: tips || "",
      recipeOrigin: recipeOrigin === "shared" ? "shared" : "original",
      sharedSource: sharedSource || "",
      sharedSourceLink: sharedSourceLink || "",
      image: image || undefined,
      component: component ?? false,
      isPublic: isPublic ?? false,
      mainIngredients: mainIngredients || [],
      seasonings: seasonings || [],
      steps: steps || [],
      servings: servings || 1,
      tags: tags || [],
    });

    await draft.save();
    res.status(201).json({ draft });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to save draft" });
  }
}

/**
 * GET /drafts
 * Get all drafts for a user, or get a specific draft by ID
 */
export async function getDraft(req: Request, res: Response) {
  try {
    const { authorId, id } = req.query;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId as string)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    // If a specific draft ID is provided
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id as string)) {
        return res.status(400).json({ error: "draft id must be a valid MongoDB ObjectId" });
      }
      const draft = await Draft.findOne({
        _id: new mongoose.Types.ObjectId(id as string),
        authorId: new mongoose.Types.ObjectId(authorId as string),
      });
      return res.json({ draft });
    }

    // Otherwise, get all drafts for the author
    const drafts = await Draft.find({
      authorId: new mongoose.Types.ObjectId(authorId as string),
    }).sort({ updatedAt: -1 });

    res.json({ drafts });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to get drafts" });
  }
}

/**
 * PUT /drafts/:id
 * Update a draft
 */
export async function updateDraft(req: Request, res: Response) {
  try {
    const rawId = req.params.id || req.body.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const {
      authorId,
      name,
      title,
      description,
      tips,
      recipeOrigin,
      sharedSource,
      sharedSourceLink,
      image,
      component,
      isPublic,
      mainIngredients,
      seasonings,
      steps,
      servings,
      tags,
    } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "draft id must be a valid MongoDB ObjectId" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    const draft = await Draft.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        authorId: new mongoose.Types.ObjectId(authorId),
      },
      {
        name: name,
        title: title,
        description: description,
        tips: tips || "",
        recipeOrigin: recipeOrigin === "shared" ? "shared" : "original",
        sharedSource: sharedSource || "",
        sharedSourceLink: sharedSourceLink || "",
        image: image,
        component: component ?? false,
        isPublic: isPublic ?? false,
        mainIngredients: mainIngredients,
        seasonings: seasonings,
        steps: steps,
        servings: servings,
        tags: tags,
      },
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    res.json({ draft });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to update draft" });
  }
}

/**
 * DELETE /drafts
 * Delete a draft by ID
 */
export async function deleteDraft(req: Request, res: Response) {
  try {
    const { authorId, id } = req.query;

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId as string)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }

    if (!id) {
      return res.status(400).json({ error: "draft id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "draft id must be a valid MongoDB ObjectId" });
    }

    const result = await Draft.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id as string),
      authorId: new mongoose.Types.ObjectId(authorId as string),
    });

    if (!result) {
      return res.status(404).json({ error: "Draft not found" });
    }

    return res.json({ message: "Draft deleted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to delete draft" });
  }
}
