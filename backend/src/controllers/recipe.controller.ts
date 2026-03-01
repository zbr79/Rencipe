import { Request, Response } from "express";
import Recipe, { IRecipe } from "../models/Recipe";
import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "../utils/cloudinary";
import fs from "fs";
import path from "path";

function pickRecipe(doc: IRecipe) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    authorId: doc.authorId,
    image: doc.image,
    ingredients: doc.ingredients,
    steps: doc.steps,
    servings: doc.servings,
    tags: doc.tags,
    likes: doc.likes,
    views: doc.views,
    ratingAverage: doc.ratingAverage,
    ratingCount: doc.ratingCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /recipes
 * List all recipes with optional filters
 */
export async function listRecipes(req: Request, res: Response) {
  try {
    const { skip = 0, limit = 20, tags } = req.query;
    const filter: any = {};

    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    const docs = await Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Recipe.countDocuments(filter);

    res.json({
      recipes: docs.map(pickRecipe),
      total,
      page: Math.floor(Number(skip) / Number(limit)) + 1,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to list recipes" });
  }
}

/**
 * POST /recipes
 * Create a new recipe
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
    } = req.body;

    // Validation
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required and must be a string" });
    }
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "description is required and must be a string" });
    }
    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ error: "authorId must be a valid MongoDB ObjectId" });
    }


    const doc = await Recipe.create({
      title: String(title).trim(),
      description: String(description).trim(),
      authorId: new mongoose.Types.ObjectId(authorId),
      ingredients: ingredients || [],
      steps: steps || [],
      servings: servings || 1,
      tags: tags || [],
      likes: 0,
      views: 0,
      ratingAverage: 0,
      ratingCount: 0,
    });

    res.status(201).json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to create recipe" });
  }
}

/**
 * GET /recipes/:id
 * Get a single recipe by ID
 */
export async function getRecipeById(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const doc = await Recipe.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

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

    const updateData = {
      ...(req.body.title && { title: String(req.body.title).trim() }),
      ...(req.body.description && { description: String(req.body.description).trim() }),
      ...(req.body.ingredients !== undefined && { ingredients: req.body.ingredients }),
      ...(req.body.steps !== undefined && { steps: req.body.steps }),
      ...(req.body.servings !== undefined && { servings: req.body.servings }),
      ...(req.body.tags !== undefined && { tags: req.body.tags }),
    };

    const doc = await Recipe.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });

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

    // Delete images from Cloudinary
    const imagesToDelete: string[] = [];

    // Add main recipe image
    if (doc.image) {
      const publicId = extractPublicIdFromUrl(doc.image);
      if (publicId) imagesToDelete.push(publicId);
    }

    // Add step images
    if (doc.steps && doc.steps.length > 0) {
      for (const step of doc.steps) {
        if (step.image) {
          const publicId = extractPublicIdFromUrl(step.image);
          if (publicId) imagesToDelete.push(publicId);
        }
      }
    }

    // Delete all images from Cloudinary in parallel
    await Promise.all(imagesToDelete.map(publicId => deleteFromCloudinary(publicId)));

    res.json({ message: "recipe deleted successfully" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to delete recipe" });
  }
}

/**
 * PATCH /recipes/:id/like
 * Like a recipe
 */
export async function likeRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const doc = await Recipe.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );

    if (!doc) return res.status(404).json({ error: "recipe not found" });

    res.json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to like recipe" });
  }
}

/**
 * PATCH /recipes/:id/rate
 * Rate a recipe
 */
export async function rateRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const { rating } = req.body;

    if (!id) return res.status(400).json({ error: "id is required" });
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "recipe not found" });

    const newAverage =
      (doc.ratingAverage * doc.ratingCount + rating) / (doc.ratingCount + 1);
    const newCount = doc.ratingCount + 1;

    const updated = await Recipe.findByIdAndUpdate(
      id,
      {
        ratingAverage: newAverage,
        ratingCount: newCount,
      },
      { returnDocument: 'after' }
    );

    res.json({ recipe: pickRecipe(updated!) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to rate recipe" });
  }
}

/**
 * POST /recipes/:id/upload-image
 * Upload recipe main image
 */
export async function uploadRecipeImage(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    // Create temp file from buffer
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, `upload-${Date.now()}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(tempFilePath, "recipes");
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    // Update recipe with image URL
    const doc = await Recipe.findByIdAndUpdate(
      id,
      { image: imageUrl },
      { returnDocument: 'after' }
    );

    if (!doc) return res.status(404).json({ error: "recipe not found" });

    res.json({ recipe: pickRecipe(doc), imageUrl });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to upload image" });
  }
}

/**
 * POST /recipes/:id/steps/:stepNumber/upload-image
 * Upload step image
 */
export async function uploadStepImage(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const stepNumber = Number(req.params.stepNumber || 0);

    if (!id) return res.status(400).json({ error: "id is required" });
    if (!stepNumber) return res.status(400).json({ error: "stepNumber is required" });
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    // Create temp file from buffer
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, `upload-${Date.now()}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(tempFilePath, `recipes/steps`);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    // Update step with image URL
    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "recipe not found" });

    const step = doc.steps.find(s => s.stepNumber === stepNumber);
    if (!step) return res.status(404).json({ error: "step not found" });

    step.image = imageUrl;
    await doc.save();

    res.json({ recipe: pickRecipe(doc), imageUrl });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to upload step image" });
  }
}