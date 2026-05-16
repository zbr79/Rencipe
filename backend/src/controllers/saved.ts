import { Request, Response } from "express";
import mongoose from "mongoose";
import Saved from "../models/Saved";
import Recipe from "../models/Recipe";
import Meal from "../models/Meal";

function activeRecipeQuery() {
  return {
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}

function removeTrashedSavedRecipes(savedItems: any) {
  savedItems.recipes = (savedItems.recipes || []).filter((recipe: any) => recipe && !recipe.deletedAt);
}

function activeMealQuery() {
  return {
    kind: "meal",
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}

function removeTrashedSavedMeals(savedItems: any) {
  savedItems.meals = (savedItems.meals || []).filter((meal: any) => meal && meal.kind === "meal" && !meal.deletedAt);
}

// Gets a user's saved recipes and meals, creating an empty saved collection if needed.
export const getSavedItems = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    let savedItems = await Saved.findOne({
      userId: new mongoose.Types.ObjectId(userId as string),
    }).populate([
      {
        path: "recipes",
        populate: { path: "authorId", select: "username displayName role avatarUrl" },
      },
      {
        path: "meals",
        populate: [
          { path: "userId", select: "username displayName role avatarUrl" },
          { path: "recipes", model: "Recipe" },
        ],
      },
    ]);

    if (!savedItems) {
      savedItems = new Saved({
        userId: new mongoose.Types.ObjectId(userId as string),
        recipes: [],
        meals: [],
      });
      await savedItems.save();
    }

    removeTrashedSavedRecipes(savedItems);
    removeTrashedSavedMeals(savedItems);

    res.json({
      saved: {
        userId: savedItems.userId,
        recipes: savedItems.recipes,
        meals: savedItems.meals || [],
        createdAt: savedItems.createdAt,
        updatedAt: savedItems.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error getting saved items:", err);
    res.status(500).json({ error: err.message });
  }
};

// Saves a recipe for a user after confirming the recipe exists and is not trashed.
export const saveRecipe = async (req: Request, res: Response) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      return res.status(400).json({ error: "userId and recipeId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "userId and recipeId must be valid MongoDB ObjectIds" });
    }

    const recipe = await Recipe.findOne({ _id: recipeId, ...activeRecipeQuery() });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    let savedItems = await Saved.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!savedItems) {
      savedItems = new Saved({
        userId: new mongoose.Types.ObjectId(userId),
        recipes: [new mongoose.Types.ObjectId(recipeId)],
        meals: [],
      });
    } else {
      const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
      if (!savedItems.recipes.some((id) => id.equals(recipeObjectId))) {
        savedItems.recipes.push(recipeObjectId);
      }
    }

    await savedItems.save();
    await savedItems.populate([
      {
        path: "recipes",
        populate: { path: "authorId", select: "username displayName role avatarUrl" },
      },
      {
        path: "meals",
        populate: [
          { path: "userId", select: "username displayName role avatarUrl" },
          { path: "recipes", model: "Recipe" },
        ],
      },
    ]);
    removeTrashedSavedRecipes(savedItems);
    removeTrashedSavedMeals(savedItems);

    res.json({
      message: "Recipe saved",
      saved: {
        userId: savedItems.userId,
        recipes: savedItems.recipes,
        meals: savedItems.meals || [],
        createdAt: savedItems.createdAt,
        updatedAt: savedItems.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error saving recipe:", err);
    res.status(500).json({ error: err.message });
  }
};

// Removes one recipe from a user's saved collection.
export const unsaveRecipe = async (req: Request, res: Response) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      return res.status(400).json({ error: "userId and recipeId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "userId and recipeId must be valid MongoDB ObjectIds" });
    }

    const savedItems = await Saved.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!savedItems) {
      return res.status(404).json({ error: "Saved items not found" });
    }

    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
    savedItems.recipes = savedItems.recipes.filter((id) => !id.equals(recipeObjectId));

    await savedItems.save();
    await savedItems.populate([
      {
        path: "recipes",
        populate: { path: "authorId", select: "username displayName role avatarUrl" },
      },
      {
        path: "meals",
        populate: [
          { path: "userId", select: "username displayName role avatarUrl" },
          { path: "recipes", model: "Recipe" },
        ],
      },
    ]);
    removeTrashedSavedRecipes(savedItems);
    removeTrashedSavedMeals(savedItems);

    res.json({
      message: "Recipe removed from saved items",
      saved: {
        userId: savedItems.userId,
        recipes: savedItems.recipes,
        meals: savedItems.meals || [],
        createdAt: savedItems.createdAt,
        updatedAt: savedItems.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error unsaving recipe:", err);
    res.status(500).json({ error: err.message });
  }
};

// Saves a meal for a user after confirming the meal exists and is active.
export const saveMeal = async (req: Request, res: Response) => {
  try {
    const { userId, mealId } = req.body;

    if (!userId || !mealId) {
      return res.status(400).json({ error: "userId and mealId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({ error: "userId and mealId must be valid MongoDB ObjectIds" });
    }

    const meal = await Meal.findOne({ _id: mealId, ...activeMealQuery() });
    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    let savedItems = await Saved.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const mealObjectId = new mongoose.Types.ObjectId(mealId);

    if (!savedItems) {
      savedItems = new Saved({
        userId: new mongoose.Types.ObjectId(userId),
        recipes: [],
        meals: [mealObjectId],
      });
    } else if (!(savedItems.meals || []).some((id) => id.equals(mealObjectId))) {
      savedItems.meals = [...(savedItems.meals || []), mealObjectId];
    }

    await savedItems.save();
    await savedItems.populate([
      {
        path: "recipes",
        populate: { path: "authorId", select: "username displayName role avatarUrl" },
      },
      {
        path: "meals",
        populate: [
          { path: "userId", select: "username displayName role avatarUrl" },
          { path: "recipes", model: "Recipe" },
        ],
      },
    ]);
    removeTrashedSavedRecipes(savedItems);
    removeTrashedSavedMeals(savedItems);

    res.json({
      message: "Meal saved",
      saved: {
        userId: savedItems.userId,
        recipes: savedItems.recipes,
        meals: savedItems.meals || [],
        createdAt: savedItems.createdAt,
        updatedAt: savedItems.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error saving meal:", err);
    res.status(500).json({ error: err.message });
  }
};

// Removes one meal from a user's saved collection.
export const unsaveMeal = async (req: Request, res: Response) => {
  try {
    const { userId, mealId } = req.body;

    if (!userId || !mealId) {
      return res.status(400).json({ error: "userId and mealId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({ error: "userId and mealId must be valid MongoDB ObjectIds" });
    }

    const savedItems = await Saved.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!savedItems) {
      return res.status(404).json({ error: "Saved items not found" });
    }

    const mealObjectId = new mongoose.Types.ObjectId(mealId);
    savedItems.meals = (savedItems.meals || []).filter((id) => !id.equals(mealObjectId));

    await savedItems.save();
    await savedItems.populate([
      {
        path: "recipes",
        populate: { path: "authorId", select: "username displayName role avatarUrl" },
      },
      {
        path: "meals",
        populate: [
          { path: "userId", select: "username displayName role avatarUrl" },
          { path: "recipes", model: "Recipe" },
        ],
      },
    ]);
    removeTrashedSavedRecipes(savedItems);
    removeTrashedSavedMeals(savedItems);

    res.json({
      message: "Meal removed from saved items",
      saved: {
        userId: savedItems.userId,
        recipes: savedItems.recipes,
        meals: savedItems.meals || [],
        createdAt: savedItems.createdAt,
        updatedAt: savedItems.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error unsaving meal:", err);
    res.status(500).json({ error: err.message });
  }
};
