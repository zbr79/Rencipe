import { Request, Response } from "express";
import Recipe from "../models/Recipe";

function pickRecipe(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    uploadedBy: doc.uploadedBy ?? null,
    source: doc.source ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /recipes
 */
export async function listRecipes(req: Request, res: Response) {
  try {
    const docs = await Recipe.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(200);

    res.json({
      recipes: docs.map(pickRecipe),
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to list recipes" });
  }
}

/**
 * POST /recipes
 * body: { title, content }
 */
export async function createRecipe(req: Request, res: Response) {
  try {
    const title = String(req.body?.title ?? "").trim();
    const content = String(req.body?.content ?? "").trim();

    if (!title) return res.status(400).json({ error: "title is required" });
    if (!content) return res.status(400).json({ error: "content is required" });

    // optional: attach user later
    // const uploadedBy = (req as any).userId ?? null;

    const doc = await Recipe.create({
      title,
      content,
      // uploadedBy,
    });

    res.status(201).json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to create recipe" });
  }
}

/**
 * GET /recipes/:id
 */
export async function getRecipeById(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "recipe not found" });

    res.json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to get recipe" });
  }
}