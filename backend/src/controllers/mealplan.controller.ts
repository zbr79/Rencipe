import { Request, Response } from "express";
import mongoose from "mongoose";
import MealPlan from "../models/MealPlan";
import Recipe from "../models/Recipe";

/**
 * Get all meal plans for a user
 * query: { userId }
 */
export const getMealPlans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    const plans = await MealPlan.find({
      userId: new mongoose.Types.ObjectId(userId as string),
    })
      .populate("recipes")
      .sort({ createdAt: -1 });

    res.json({ plans });
  } catch (err: any) {
    console.error("Error getting meal plans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single meal plan with full recipe details
 * params: { id }
 */
export const getMealPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const plan = await MealPlan.findById(id).populate("recipes");

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error getting meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new meal plan
 * body: { userId, name? }
 */
export const createMealPlan = async (req: Request, res: Response) => {
  try {
    const { userId, name } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    const plan = new MealPlan({
      userId: new mongoose.Types.ObjectId(userId),
      name: name || "新建计划",
      recipes: [],
    });

    await plan.save();
    await plan.populate("recipes");

    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Error creating meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rename a meal plan
 * params: { id }
 * body: { name }
 */
export const renameMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const plan = await MealPlan.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    ).populate("recipes");

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error renaming meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a meal plan
 * params: { id }
 */
export const deleteMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const plan = await MealPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json({ message: "Meal plan deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add recipe to meal plan
 * params: { id }
 * body: { recipeId }
 */
export const addRecipeToMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: "recipeId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "Invalid meal plan or recipe ID" });
    }

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const plan = await MealPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);
    if (!plan.recipes.includes(recipeObjectId)) {
      plan.recipes.push(recipeObjectId);
    }

    await plan.save();
    await plan.populate("recipes");

    res.json({ plan });
  } catch (err: any) {
    console.error("Error adding recipe to meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove recipe from meal plan
 * params: { id, recipeId }
 */
export const removeRecipeFromMealPlan = async (req: Request, res: Response) => {
  try {
    const { id, recipeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "Invalid meal plan or recipe ID" });
    }

    const plan = await MealPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    plan.recipes = plan.recipes.filter(
      (r) => r.toString() !== recipeId
    );

    await plan.save();
    await plan.populate("recipes");

    res.json({ plan });
  } catch (err: any) {
    console.error("Error removing recipe from meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};
