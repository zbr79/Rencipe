import { Request, Response } from "express";
import mongoose from "mongoose";
import Favorite from "../models/Favorite";
import Recipe from "../models/Recipe";

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
    }).populate({
      path: "recipes",
      populate: { path: "authorId", select: "username displayName role" },
    });

    if (!favorites) {
      favorites = new Favorite({
        userId: new mongoose.Types.ObjectId(userId as string),
        recipes: [],
      });
      await favorites.save();
    }

    res.json({
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
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
    const recipe = await Recipe.findById(recipeId);
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
      });
    } else {
      const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
      if (!favorites.recipes.some((id) => id.equals(recipeObjectId))) {
        favorites.recipes.push(recipeObjectId);
      }
    }

    await favorites.save();
    await favorites.populate({
      path: "recipes",
      populate: { path: "authorId", select: "username displayName role" },
    });

    res.json({
      message: "Recipe added to favorites",
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
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
    await favorites.populate({
      path: "recipes",
      populate: { path: "authorId", select: "username displayName role" },
    });

    res.json({
      message: "Recipe removed from favorites",
      favorites: {
        userId: favorites.userId,
        recipes: favorites.recipes,
        createdAt: favorites.createdAt,
        updatedAt: favorites.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: err.message });
  }
};
