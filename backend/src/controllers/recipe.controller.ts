import { Request, Response } from "express";
import Recipe from "../models/Recipe";

function pickRecipe(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    image: doc.image ?? null,
    authorId: doc.authorId ?? null,
    ingredients: doc.ingredients ?? [],
    steps: doc.steps ?? [],
    servings: doc.servings ?? 1,
    tags: doc.tags ?? [],
    likes: doc.likes ?? 0,
    views: doc.views ?? 0,
    ratingAverage: doc.ratingAverage ?? 0,
    ratingCount: doc.ratingCount ?? 0,
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
 * body: { title, description, authorId, ingredients, steps, servings, tags, image }
 */
export async function createRecipe(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      authorId,
      ingredients,
      steps,
      servings,
      tags,
      image,
    } = req.body;

    if (!title) return res.status(400).json({ error: "title is required" });
    if (!description)
      return res.status(400).json({ error: "description is required" });
    if (!authorId)
      return res.status(400).json({ error: "authorId is required" });

    const doc = await Recipe.create({
      title,
      description,
      authorId,
      ingredients: ingredients || [],
      steps: steps || [],
      servings: servings || 1,
      tags: tags || [],
      image: image || undefined,
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

/**
 * PUT /recipes/:id
 * Update a recipe
 */
export async function updateRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const {
      title,
      description,
      ingredients,
      steps,
      servings,
      tags,
      image,
    } = req.body;

    const doc = await Recipe.findByIdAndUpdate(
      id,
      {
        title,
        description,
        ingredients: ingredients || [],
        steps: steps || [],
        servings: servings || 1,
        tags: tags || [],
        image: image || undefined,
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "recipe not found" });

    res.json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to update recipe" });
  }
}

/**
 * DELETE /recipes/:id
 * Delete a recipe
 */
export async function deleteRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const doc = await Recipe.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "recipe not found" });

    res.json({ success: true, message: "recipe deleted" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to delete recipe" });
  }
}