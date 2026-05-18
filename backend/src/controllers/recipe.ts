import { Request, Response } from "express";
import mongoose from "mongoose";
import Recipe, { RecipeLanguage } from "../models/Recipe";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { getAuthUser } from "../middleware/auth";

dotenv.config();

const TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const CHINESE_TEXT_PATTERN = /[\u3400-\u9fff]/;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function pickAuthor(author: any) {
  if (!author || !author.displayName) return null;

  return {
    id: String(author._id),
    username: author.username,
    displayName: author.displayName,
    role: author.role,
  };
}

function getAuthorId(doc: any) {
  if (!doc.authorId) return null;
  if (doc.authorId._id) return String(doc.authorId._id);
  return String(doc.authorId);
}

function pickRecipe(doc: any) {
  return {
    id: String(doc._id),
    _id: String(doc._id),
    title: doc.title,
    description: doc.description,
    tips: doc.tips ?? "",
    recipeOrigin: doc.recipeOrigin === "shared" ? "shared" : "original",
    sharedSource: doc.sharedSource ?? "",
    sharedSourceLink: doc.sharedSourceLink ?? "",
    image: doc.image ?? null,
    language: getRecipeLanguage(doc),
    authorId: getAuthorId(doc),
    author: pickAuthor(doc.authorId),
    component: doc.component ?? false,
    isPublic: doc.isPublic ?? false,
    mainIngredients: doc.mainIngredients ?? [],
    seasonings: doc.seasonings ?? [],
    steps: doc.steps ?? [],
    servings: doc.servings ?? 1,
    tags: doc.tags ?? [],
    likes: doc.likes ?? 0,
    views: doc.views ?? 0,
    ratingAverage: doc.ratingAverage ?? 0,
    ratingCount: doc.ratingCount ?? 0,
    deletedAt: doc.deletedAt ?? null,
    trashExpiresAt: doc.trashExpiresAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizeRecipeLanguage(value: unknown): RecipeLanguage {
  return value === "zh" ? "zh" : "en";
}

function joinRecipeParts(source: any) {
  const mainIngredients = (source.mainIngredients || []).map((ingredient: any) => `${ingredient?.name || ""} ${ingredient?.quantity || ""}`);
  const seasonings = (source.seasonings || []).map((ingredient: any) => `${ingredient?.name || ""} ${ingredient?.quantity || ""}`);
  const steps = (source.steps || []).map((step: any) => step?.instruction || "");
  const tags = Array.isArray(source.tags) ? source.tags : [];

  return [
    source.title,
    source.description,
    source.tips,
    source.sharedSource,
    ...mainIngredients,
    ...seasonings,
    ...steps,
    ...tags,
  ].filter(Boolean).join(" ");
}

function detectRecipeLanguage(source: any): RecipeLanguage {
  return CHINESE_TEXT_PATTERN.test(joinRecipeParts(source)) ? "zh" : "en";
}

function getRecipeLanguage(doc: any): RecipeLanguage {
  const detectedLanguage = detectRecipeLanguage(doc);
  if (detectedLanguage === "zh") return "zh";
  if (doc.language === "en" || doc.language === "zh") return doc.language;
  return "en";
}

function activeRecipeQuery() {
  return {
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}

function trashedRecipeQuery() {
  return {
    deletedAt: { $exists: true, $ne: null },
    trashExpiresAt: { $exists: true, $ne: null },
  };
}

function combineRecipeQueries(...queries: Record<string, unknown>[]) {
  const meaningfulQueries = queries.filter((query) => Object.keys(query).length > 0);
  return meaningfulQueries.length > 0 ? { $and: meaningfulQueries } : {};
}

function isRecipeTrashed(doc: any) {
  return Boolean(doc?.deletedAt);
}

function visibleRecipeQuery(req: Request) {
  const user = getAuthUser(req);
  if (user?.role === "admin") return {};

  const publicQuery = { isPublic: true };
  if (!user) return publicQuery;

  return {
    $or: [
      publicQuery,
      { authorId: new mongoose.Types.ObjectId(user.id) },
    ],
  };
}

function canAccessRecipe(req: Request, doc: any) {
  const user = getAuthUser(req);
  if (doc.isPublic) return true;
  if (user?.role === "admin") return true;
  return Boolean(user && getAuthorId(doc) === user.id);
}

function matchesProjectLanguage(req: Request, doc: any) {
  const user = getAuthUser(req);
  if (!user || user.projectMode === false) return true;
  return getRecipeLanguage(doc) === normalizeRecipeLanguage(user.language);
}

function canMutateRecipe(req: Request, doc: any) {
  const user = getAuthUser(req);
  if (!user) return false;
  if (user.role === "admin") return true;
  return getAuthorId(doc) === user.id;
}

function normalizeRecipeOrigin(value: unknown): "original" | "shared" {
  return value === "shared" ? "shared" : "original";
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function listRecipes(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "200"), 10) || 200, 1000);
    const trashOnly = String(req.query.trash || "") === "1";
    const authUser = getAuthUser(req);

    if (trashOnly && !authUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const query = trashOnly
      ? combineRecipeQueries(
          { authorId: new mongoose.Types.ObjectId(authUser!.id) },
          trashedRecipeQuery()
        )
      : combineRecipeQueries(visibleRecipeQuery(req), activeRecipeQuery());

    const docs = await Recipe.find(query)
      .populate("authorId", "username displayName role")
      .sort(trashOnly ? { deletedAt: -1, updatedAt: -1 } : { updatedAt: -1, createdAt: -1 })
      .limit(1000);

    const filteredDocs = docs.filter((doc) => matchesProjectLanguage(req, doc)).slice(0, limit);

    res.json({
      recipes: filteredDocs.map(pickRecipe),
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to list recipes" });
  }
}

export async function createRecipe(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      tips: rawTips,
      recipeOrigin: rawRecipeOrigin,
      sharedSource: rawSharedSource,
      sharedSourceLink: rawSharedSourceLink,
      mainIngredients,
      seasonings,
      steps,
      servings,
      tags,
      image,
      component,
      isPublic,
    } = req.body;
    const authUser = getAuthUser(req);

    if (!authUser) return res.status(401).json({ error: "Authentication required" });
    if (!title) return res.status(400).json({ error: "title is required" });
    if (!description) return res.status(400).json({ error: "description is required" });

    const recipeOrigin = normalizeRecipeOrigin(rawRecipeOrigin);
    const tips = normalizeOptionalText(rawTips);
    const sharedSource = normalizeOptionalText(rawSharedSource);
    const sharedSourceLink = normalizeOptionalText(rawSharedSourceLink);

    if (recipeOrigin === "shared" && !sharedSource) {
      return res.status(400).json({ error: "sharedSource is required when recipeOrigin is shared" });
    }

    const doc = await Recipe.create({
      title,
      description,
      tips: tips || undefined,
      recipeOrigin,
      sharedSource: recipeOrigin === "shared" ? sharedSource : undefined,
      sharedSourceLink: recipeOrigin === "shared" && sharedSourceLink ? sharedSourceLink : undefined,
      authorId: new mongoose.Types.ObjectId(authUser.id),
      mainIngredients: mainIngredients || [],
      seasonings: seasonings || [],
      steps: steps || [],
      servings: servings || 1,
      tags: tags || [],
      image: image || undefined,
      language: detectRecipeLanguage({ title, description, tips, sharedSource, mainIngredients, seasonings, steps, tags }),
      component: component ?? false,
      isPublic: Boolean(isPublic),
    });

    await doc.populate("authorId", "username displayName role");

    res.status(201).json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to create recipe" });
  }
}

export async function getRecipeById(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const doc = await Recipe.findById(id);
    if (!doc) return res.status(404).json({ error: "recipe not found" });
    if (isRecipeTrashed(doc)) return res.status(404).json({ error: "recipe not found" });
    if (!canAccessRecipe(req, doc)) return res.status(404).json({ error: "recipe not found" });
    if (!matchesProjectLanguage(req, doc)) return res.status(404).json({ error: "recipe not found" });

    await Recipe.updateOne({ _id: doc._id }, { $inc: { views: 1 } }, { timestamps: false });
    doc.views = (doc.views ?? 0) + 1;

    await doc.populate("authorId", "username displayName role");

    res.json({ recipe: pickRecipe(doc) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to get recipe" });
  }
}

export async function updateRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const {
      title,
      description,
      tips: rawTips,
      recipeOrigin: rawRecipeOrigin,
      sharedSource: rawSharedSource,
      sharedSourceLink: rawSharedSourceLink,
      mainIngredients,
      seasonings,
      steps,
      servings,
      tags,
      image,
      component,
      isPublic,
    } = req.body;

    const existing = await Recipe.findById(id);
    if (!existing) return res.status(404).json({ error: "recipe not found" });
    if (isRecipeTrashed(existing)) return res.status(404).json({ error: "recipe not found" });
    if (!canMutateRecipe(req, existing)) return res.status(403).json({ error: "Not allowed to update this recipe" });

    const recipeOrigin = normalizeRecipeOrigin(rawRecipeOrigin);
    const tips = normalizeOptionalText(rawTips);
    const sharedSource = normalizeOptionalText(rawSharedSource);
    const sharedSourceLink = normalizeOptionalText(rawSharedSourceLink);

    if (recipeOrigin === "shared" && !sharedSource) {
      return res.status(400).json({ error: "sharedSource is required when recipeOrigin is shared" });
    }

    existing.title = title;
    existing.description = description;
    existing.tips = tips || undefined;
    existing.recipeOrigin = recipeOrigin;
    existing.sharedSource = recipeOrigin === "shared" ? sharedSource : undefined;
    existing.sharedSourceLink = recipeOrigin === "shared" && sharedSourceLink ? sharedSourceLink : undefined;
    existing.mainIngredients = mainIngredients || [];
    existing.seasonings = seasonings || [];
    existing.steps = steps || [];
    existing.servings = servings || 1;
    existing.tags = tags || [];
    if (typeof image === "string") {
      existing.image = image || undefined;
    }
    if (typeof component === "boolean") {
      existing.component = component;
    }
    if (typeof isPublic === "boolean") {
      existing.isPublic = isPublic;
    }
    existing.language = detectRecipeLanguage(existing);

    await existing.save();
    await existing.populate("authorId", "username displayName role");

    res.json({ recipe: pickRecipe(existing) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to update recipe" });
  }
}

export async function rateRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const rating = Number(req.body.rating);

    if (!id) return res.status(400).json({ error: "id is required" });
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const existing = await Recipe.findById(id);
    if (!existing) return res.status(404).json({ error: "recipe not found" });
    if (isRecipeTrashed(existing)) return res.status(404).json({ error: "recipe not found" });
    if (!canAccessRecipe(req, existing)) return res.status(404).json({ error: "recipe not found" });
    if (!matchesProjectLanguage(req, existing)) return res.status(404).json({ error: "recipe not found" });

    const nextCount = (existing.ratingCount ?? 0) + 1;
    const nextAverage = (((existing.ratingAverage ?? 0) * (existing.ratingCount ?? 0)) + rating) / nextCount;

    existing.ratingCount = nextCount;
    existing.ratingAverage = Math.round(nextAverage * 10) / 10;
    await existing.save();
    await existing.populate("authorId", "username displayName role");

    res.json({ recipe: pickRecipe(existing) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to rate recipe" });
  }
}

export async function deleteRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const existing = await Recipe.findById(id);
    if (!existing) return res.status(404).json({ error: "recipe not found" });
    if (isRecipeTrashed(existing)) return res.status(404).json({ error: "recipe not found" });
    if (!canMutateRecipe(req, existing)) return res.status(403).json({ error: "Not allowed to delete this recipe" });

    const deletedAt = existing.deletedAt || new Date();
    existing.deletedAt = deletedAt;
    existing.trashExpiresAt = new Date(deletedAt.getTime() + TRASH_RETENTION_MS);
    await existing.save();

    res.json({ success: true, message: "recipe moved to trash", trashExpiresAt: existing.trashExpiresAt });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to delete recipe" });
  }
}

export async function restoreRecipe(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const existing = await Recipe.findById(id);
    if (!existing) return res.status(404).json({ error: "recipe not found" });
    if (!canMutateRecipe(req, existing)) return res.status(403).json({ error: "Not allowed to restore this recipe" });

    existing.deletedAt = undefined;
    existing.trashExpiresAt = undefined;
    await existing.save();
    await existing.populate("authorId", "username displayName role");

    res.json({ recipe: pickRecipe(existing), message: "recipe restored" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to restore recipe" });
  }
}

export async function uploadRecipeImage(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const existing = await Recipe.findById(id);
    if (!existing) return res.status(404).json({ error: "recipe not found" });
    if (isRecipeTrashed(existing)) return res.status(404).json({ error: "recipe not found" });
    if (!canMutateRecipe(req, existing)) return res.status(403).json({ error: "Not allowed to update this recipe" });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "image file is required" });

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

        await doc.populate("authorId", "username displayName role");

        res.json({ recipe: pickRecipe(doc) });
      }
    );

    uploadStream.end(file.buffer);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to upload recipe image" });
  }
}

export async function uploadStepImage(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    const rawStepNumber = req.params.stepNumber;
    const stepNumberParam = Array.isArray(rawStepNumber) ? rawStepNumber[0] : rawStepNumber;
    const stepNumber = parseInt(stepNumberParam || "0", 10);

    if (!id) return res.status(400).json({ error: "id is required" });
    if (!stepNumber) return res.status(400).json({ error: "stepNumber is required" });

    const existing = await Recipe.findById(id);
    if (!existing) return res.status(404).json({ error: "recipe not found" });
    if (isRecipeTrashed(existing)) return res.status(404).json({ error: "recipe not found" });
    if (!canMutateRecipe(req, existing)) return res.status(403).json({ error: "Not allowed to update this recipe" });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "image file is required" });

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

        await doc.populate("authorId", "username displayName role");

        res.json({ recipe: pickRecipe(doc) });
      }
    );

    uploadStream.end(file.buffer);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to upload step image" });
  }
}
