import { Request, Response } from "express";
import mongoose from "mongoose";
import Favorite from "../models/Favorite";
import Recipe from "../models/Recipe";
import MealPlan from "../models/MealPlan";

function activeRecipeQuery() {
  return {
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}

function removeTrashedFavoriteRecipes(favorites: any) {
  favorites.recipes = (favorites.recipes || []).filter((recipe: any) => recipe && !recipe.deletedAt);
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

function removeTrashedFavoriteMeals(favorites: any) {
  favorites.meals = (favorites.meals || []).filter((meal: any) => meal && meal.kind === "meal" && !meal.deletedAt);
}

/**
 * Get user's favorites with full recipe details
 * query: { userId }
 */
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    let favorites = await Favorite.findOne({
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

    if (!favorites) {
      favorites = new Favorite({
        userId: new mongoose.Types.ObjectId(userId as string),
        recipes: [],
        meals: [],
      });
      await favorites.save();
    }

    removeTrashedFavoriteRecipes(favorites);
    removeTrashedFavoriteMeals(favorites);

    res.json({
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
        meals: favorites.meals || [],
        createdAt: favorites.createdAt,
        updatedAt: favorites.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error getting favorites:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add recipe to favorites
 * body: { userId, recipeId }
 */
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      return res.status(400).json({ error: "userId and recipeId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "userId and recipeId must be valid MongoDB ObjectIds" });
    }

    // Check if recipe exists
    const recipe = await Recipe.findOne({ _id: recipeId, ...activeRecipeQuery() });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    let favorites = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!favorites) {
      favorites = new Favorite({
        userId: new mongoose.Types.ObjectId(userId),
        recipes: [new mongoose.Types.ObjectId(recipeId)],
        meals: [],
      });
    } else {
      const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
      if (!favorites.recipes.some((id) => id.equals(recipeObjectId))) {
        favorites.recipes.push(recipeObjectId);
      }
    }

    await favorites.save();
    await favorites.populate([
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
    removeTrashedFavoriteRecipes(favorites);
    removeTrashedFavoriteMeals(favorites);

    res.json({
      message: "Recipe added to favorites",
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
        meals: favorites.meals || [],
        createdAt: favorites.createdAt,
        updatedAt: favorites.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove recipe from favorites
 * body: { userId, recipeId }
 */
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      return res.status(400).json({ error: "userId and recipeId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "userId and recipeId must be valid MongoDB ObjectIds" });
    }

    const favorites = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!favorites) {
      return res.status(404).json({ error: "Favorites not found" });
    }

    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
    favorites.recipes = favorites.recipes.filter((id) => !id.equals(recipeObjectId));

    await favorites.save();
    await favorites.populate([
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
    removeTrashedFavoriteRecipes(favorites);
    removeTrashedFavoriteMeals(favorites);

    res.json({
      message: "Recipe removed from favorites",
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
        meals: favorites.meals || [],
        createdAt: favorites.createdAt,
        updatedAt: favorites.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add meal to favorites
 * body: { userId, mealId }
 */
export const addFavoriteMeal = async (req: Request, res: Response) => {
  try {
    const { userId, mealId } = req.body;

    if (!userId || !mealId) {
      return res.status(400).json({ error: "userId and mealId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({ error: "userId and mealId must be valid MongoDB ObjectIds" });
    }

    const meal = await MealPlan.findOne({ _id: mealId, ...activeMealQuery() });
    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    let favorites = await Favorite.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const mealObjectId = new mongoose.Types.ObjectId(mealId);

    if (!favorites) {
      favorites = new Favorite({
        userId: new mongoose.Types.ObjectId(userId),
        recipes: [],
        meals: [mealObjectId],
      });
    } else if (!(favorites.meals || []).some((id) => id.equals(mealObjectId))) {
      favorites.meals = [...(favorites.meals || []), mealObjectId];
    }

    await favorites.save();
    await favorites.populate([
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
    removeTrashedFavoriteRecipes(favorites);
    removeTrashedFavoriteMeals(favorites);

    res.json({
      message: "Meal added to favorites",
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
        meals: favorites.meals || [],
        createdAt: favorites.createdAt,
        updatedAt: favorites.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error adding favorite meal:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove meal from favorites
 * body: { userId, mealId }
 */
export const removeFavoriteMeal = async (req: Request, res: Response) => {
  try {
    const { userId, mealId } = req.body;

    if (!userId || !mealId) {
      return res.status(400).json({ error: "userId and mealId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({ error: "userId and mealId must be valid MongoDB ObjectIds" });
    }

    const favorites = await Favorite.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!favorites) {
      return res.status(404).json({ error: "Favorites not found" });
    }

    const mealObjectId = new mongoose.Types.ObjectId(mealId);
    favorites.meals = (favorites.meals || []).filter((id) => !id.equals(mealObjectId));

    await favorites.save();
    await favorites.populate([
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
    removeTrashedFavoriteRecipes(favorites);
    removeTrashedFavoriteMeals(favorites);

    res.json({
      message: "Meal removed from favorites",
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
        meals: favorites.meals || [],
        createdAt: favorites.createdAt,
        updatedAt: favorites.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error removing favorite meal:", err);
    res.status(500).json({ error: err.message });
  }
};
