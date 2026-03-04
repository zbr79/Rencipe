import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Recipe from "../models/Recipe";

/**
 * Get user's cart with full recipe details
 * query: { userId }
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    let cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId as string),
    }).populate("recipes");

    if (!cart) {
      cart = new Cart({
        userId: new mongoose.Types.ObjectId(userId as string),
        recipes: [],
      });
      await cart.save();
    }

    res.json({
      cart: {
        userId: cart.userId,
        recipes: cart.recipes,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error getting cart:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add recipe to cart
 * body: { userId, recipeId }
 */
export const addToCart = async (req: Request, res: Response) => {
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

    let cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      cart = new Cart({
        userId: new mongoose.Types.ObjectId(userId),
        recipes: [new mongoose.Types.ObjectId(recipeId)],
      });
    } else {
      // Add recipe if not already in cart
      const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
      if (!cart.recipes.includes(recipeObjectId)) {
        cart.recipes.push(recipeObjectId);
      }
    }

    await cart.save();
    await cart.populate("recipes");

    res.json({
      message: "Recipe added to cart",
      cart: {
        userId: cart.userId,
        recipes: cart.recipes,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove recipe from cart
 * body: { userId, recipeId }
 */
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      return res.status(400).json({ error: "userId and recipeId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "userId and recipeId must be valid MongoDB ObjectIds" });
    }

    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
    cart.recipes = cart.recipes.filter((id) => !id.equals(recipeObjectId));

    await cart.save();
    await cart.populate("recipes");

    res.json({
      message: "Recipe removed from cart",
      cart: {
        userId: cart.userId,
        recipes: cart.recipes,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Clear entire cart
 * body: { userId }
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.recipes = [];
    await cart.save();

    res.json({
      message: "Cart cleared",
      cart: {
        userId: cart.userId,
        recipes: cart.recipes,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ error: err.message });
  }
};
