import { Request, Response } from "express";
import Recipe from "../models/Recipe";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function pickRecipe(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    image: doc.image ?? null,
    authorId: doc.authorId ?? null,
    component: doc.component ?? false,
    mainIngredients: doc.mainIngredients ?? [],
    seasonings: doc.seasonings ?? [],
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
 * body: { title, description, authorId, mainIngredients, seasonings, steps, servings, tags, image, component }
 */
export async function createRecipe(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      authorId,
      mainIngredients,
      seasonings,
      steps,
      servings,
      tags,
      image,
      component,
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
      mainIngredients: mainIngredients || [],
      seasonings: seasonings || [],
      steps: steps || [],
      servings: servings || 1,
      tags: tags || [],
      image: image || undefined,
      component: component ?? false,
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
      mainIngredients,
      seasonings,
      steps,
      servings,
      tags,
      image,
      component,
    } = req.body;

    const doc = await Recipe.findByIdAndUpdate(
      id,
      {
        title,
        description,
        mainIngredients: mainIngredients || [],
        seasonings: seasonings || [],
        steps: steps || [],
        servings: servings || 1,
        tags: tags || [],
        image: image || undefined,
        component: component ?? undefined,
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

/**
 * POST /recipes/:id/upload-image
 * Upload recipe image to Cloudinary
 */
export async function uploadRecipeImage(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "image file is required" });

    // Upload buffer to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rencipe/recipes/${id}`,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
      async (error: any, result: any) => {
        if (error) {
          return res
            .status(500)
            .json({ error: "Failed to upload image to Cloudinary" });
        }

        const imageUrl = result.secure_url;

        const doc = await Recipe.findByIdAndUpdate(
          id,
          { image: imageUrl },
          { new: true }
        );

        if (!doc) return res.status(404).json({ error: "recipe not found" });

        res.json({ recipe: pickRecipe(doc) });
      }
    );

    uploadStream.end(file.buffer);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to upload recipe image" });
  }
}

/**
 * POST /recipes/:id/steps/:stepNumber/upload-image
 * Upload step image to Cloudinary
 */
export async function uploadStepImage(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const stepNumber = parseInt(req.params.stepNumber || "0");

    if (!id) return res.status(400).json({ error: "id is required" });
    if (!stepNumber) return res.status(400).json({ error: "stepNumber is required" });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "image file is required" });

    // Upload buffer to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rencipe/recipes/${id}/steps`,
        resource_type: "auto",
        quality: "auto",
        fetch_format: "auto",
      },
      async (error: any, result: any) => {
        if (error) {
          return res
            .status(500)
            .json({ error: "Failed to upload image to Cloudinary" });
        }

        const imageUrl = result.secure_url;

        const doc = await Recipe.findByIdAndUpdate(
          id,
          {
            $set: {
              "steps.$[elem].image": imageUrl,
            },
          },
          {
            arrayFilters: [{ "elem.stepNumber": stepNumber }],
            new: true,
          }
        );

        if (!doc) return res.status(404).json({ error: "recipe not found" });

        res.json({ recipe: pickRecipe(doc) });
      }
    );

    uploadStream.end(file.buffer);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to upload step image" });
  }
}