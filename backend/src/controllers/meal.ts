import { Request, Response } from "express";
import mongoose from "mongoose";
import Meal from "../models/Meal";
import Recipe from "../models/Recipe";
import { getAuthUser } from "../middleware/auth";

const TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function activeMealQuery() {
  return {
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}

function trashedMealQuery() {
  return {
    deletedAt: { $exists: true, $ne: null },
    trashExpiresAt: { $exists: true, $ne: null },
  };
}

function isMealTrashed(meal: any) {
  return Boolean(meal?.deletedAt);
}

function getMealOwnerId(meal: any) {
  return String(meal?.userId?._id || meal?.userId || "");
}

function canAccessMeal(req: Request, meal: any) {
  const user = getAuthUser(req);
  if (meal.isPublic) return true;
  if (!user) return false;
  return user.role === "admin" || getMealOwnerId(meal) === user.id;
}

function canMutateMeal(req: Request, meal: any) {
  const user = getAuthUser(req);
  if (!user) return false;
  return user.role === "admin" || getMealOwnerId(meal) === user.id;
}

function normalizeRecipeIds(recipes: any) {
  if (!Array.isArray(recipes)) return [];

  return recipes
    .map((recipe: any) => {
      const recipeId = typeof recipe === "string" ? recipe : recipe?._id || recipe?.id;
      return mongoose.Types.ObjectId.isValid(recipeId) ? new mongoose.Types.ObjectId(recipeId) : null;
    })
    .filter(Boolean);
}

async function populateMeal(meal: any) {
  return meal.populate([
    { path: "userId", select: "username displayName role avatarUrl" },
    { path: "recipes", model: "Recipe" },
    { path: "days.meals.recipes", model: "Recipe" },
  ]);
}

// Lists active or trashed meals for one user, or public meals when public visibility is requested.
export const getMeals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const trashOnly = String(req.query.trash || "") === "1";
    const visibility = String(req.query.visibility || "owned");

    const query: any = trashOnly ? trashedMealQuery() : activeMealQuery();
    query.kind = "meal";

    if (visibility === "public") {
      query.isPublic = true;
    } else {
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(userId as string)) {
        return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
      }

      query.userId = new mongoose.Types.ObjectId(userId as string);
    }

    const meals = await Meal.find(query)
      .populate([
        { path: "userId", select: "username displayName role avatarUrl" },
        { path: "recipes", model: "Recipe" },
        { path: "days.meals.recipes", model: "Recipe" },
      ])
      .sort(trashOnly ? { deletedAt: -1, updatedAt: -1 } : { createdAt: -1 });

    res.json({ meals });
  } catch (err: any) {
    console.error("Error getting meals:", err);
    res.status(500).json({ error: err.message });
  }
};

// Gets one meal, checks access, populates recipes, and increments view count.
export const getMealById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    const meal = await Meal.findById(idStr).populate([
      { path: "userId", select: "username displayName role avatarUrl" },
      { path: "recipes", model: "Recipe" },
      { path: "days.meals.recipes", model: "Recipe" },
    ]);

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    if (isMealTrashed(meal)) {
      return res.status(404).json({ error: "Meal not found" });
    }

    if (!canAccessMeal(req, meal)) {
      return res.status(404).json({ error: "Meal not found" });
    }

    await Meal.updateOne({ _id: meal._id }, { $inc: { views: 1 } }, { timestamps: false });
    meal.views = (meal.views ?? 0) + 1;

    res.json({ meal });
  } catch (err: any) {
    console.error("Error getting meal:", err);
    res.status(500).json({ error: err.message });
  }
};

// Creates a meal with people and selected recipe ids; at least one recipe is required.
export const createMeal = async (req: Request, res: Response) => {
  try {
    const { userId, numberOfPeople, name, people, isPublic, recipes } = req.body;
    const normalizedRecipeIds = normalizeRecipeIds(recipes);

    if (!userId || numberOfPeople === undefined) {
      return res.status(400).json({
        error: "userId and numberOfPeople are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    if (numberOfPeople < 1) {
      return res.status(400).json({ error: "numberOfPeople must be at least 1" });
    }

    if (!String(name || "").trim()) {
      return res.status(400).json({ error: "Meal name is required" });
    }

    if (normalizedRecipeIds.length === 0) {
      return res.status(400).json({ error: "Add at least one recipe before creating a meal" });
    }

    let peopleArray = [];
    if (people && Array.isArray(people) && people.length > 0) {
      peopleArray = people.map((p: any, index: number) => ({
        name: p.name || `Person ${index + 1}`,
        modifier: Math.max(0.1, Math.min(5.0, p.modifier || 1.0)),
      }));
    } else {
      for (let i = 0; i < numberOfPeople; i++) {
        peopleArray.push({
          name: `Person ${i + 1}`,
          modifier: 1.0,
        });
      }
    }

    const meal = new Meal({
      kind: "meal",
      userId: new mongoose.Types.ObjectId(userId),
      name: String(name).trim(),
      people: peopleArray,
      isPublic: Boolean(isPublic),
      recipes: normalizedRecipeIds,
      days: [],
    });

    await meal.save();
    await populateMeal(meal);

    res.status(201).json({ meal });
  } catch (err: any) {
    console.error("Error creating meal:", err);
    res.status(500).json({ error: err.message });
  }
};

// Updates a meal's name, people, recipe list, and visibility after checking ownership.
export const updateMeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, people, recipes, isPublic } = req.body;

    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    const meal = await Meal.findById(idStr);
    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }
    if (isMealTrashed(meal)) {
      return res.status(404).json({ error: "Meal not found" });
    }
    if (!canMutateMeal(req, meal)) {
      return res.status(403).json({ error: "Not allowed to update this meal" });
    }

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (people !== undefined && Array.isArray(people)) {
      if (people.length === 0) {
        return res.status(400).json({ error: "Meal must have at least one person" });
      }
      updateData.people = people.map((p: any) => ({
        name: p.name || `Person ${people.indexOf(p) + 1}`,
        modifier: Math.max(0.1, Math.min(5.0, p.modifier || 1.0)),
      }));
    }

    if (recipes !== undefined) {
      updateData.recipes = normalizeRecipeIds(recipes);
    }

    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
    }

    Object.assign(meal, updateData);
    await meal.save();

    meal.days = [];
    await populateMeal(meal);

    res.json({ meal });
  } catch (err: any) {
    console.error("Error updating meal:", err);
    res.status(500).json({ error: err.message });
  }
};

// Soft-deletes a meal by moving it to trash for seven days.
export const deleteMeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    const meal = await Meal.findById(idStr);

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }
    if (!canMutateMeal(req, meal)) {
      return res.status(403).json({ error: "Not allowed to delete this meal" });
    }

    const deletedAt = meal.deletedAt || new Date();
    meal.deletedAt = deletedAt;
    meal.trashExpiresAt = new Date(deletedAt.getTime() + TRASH_RETENTION_MS);
    await meal.save();

    res.json({ message: "Meal moved to trash", trashExpiresAt: meal.trashExpiresAt });
  } catch (err: any) {
    console.error("Error deleting meal:", err);
    res.status(500).json({ error: err.message });
  }
};

// Restores a trashed meal and clears its trash expiration timestamp.
export const restoreMeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    const meal = await Meal.findById(idStr);
    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }
    if (!canMutateMeal(req, meal)) {
      return res.status(403).json({ error: "Not allowed to restore this meal" });
    }

    meal.deletedAt = undefined;
    meal.trashExpiresAt = undefined;
    await meal.save();
    await populateMeal(meal);

    res.json({ meal, message: "Meal restored" });
  } catch (err: any) {
    console.error("Error restoring meal:", err);
    res.status(500).json({ error: err.message });
  }
};

// Adds a recipe to an existing meal without duplicating recipe ids.
export const addRecipeToMeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: "recipeId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }

    const [meal, recipe] = await Promise.all([
      Meal.findById(idStr),
      Recipe.findById(recipeId),
    ]);

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }
    if (isMealTrashed(meal)) {
      return res.status(404).json({ error: "Meal not found" });
    }
    if (!canMutateMeal(req, meal)) {
      return res.status(403).json({ error: "Not allowed to update this meal" });
    }

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);

    let changed = false;
    if (!meal.recipes.some((id) => id.toString() === recipeId)) {
      meal.recipes.push(recipeObjectId);
      changed = true;
    }

    if (changed) await meal.save();

    await populateMeal(meal);

    res.status(201).json({ meal });
  } catch (err: any) {
    console.error("Error adding recipe to meal:", err);
    res.status(500).json({ error: err.message });
  }
};
