import { Request, Response } from "express";
import mongoose from "mongoose";
import WeeklyPlan from "../models/WeeklyPlan";
import Recipe from "../models/Recipe";

/**
 * Get all weekly plans for a user
 * query: { userId }
 */
export const getWeeklyPlans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    const plans = await WeeklyPlan.find({
      userId: new mongoose.Types.ObjectId(userId as string),
    })
      .populate({
        path: "days.breakfast days.lunch days.dinner",
        model: "Recipe",
      })
      .sort({ createdAt: -1 });

    res.json({ plans });
  } catch (err: any) {
    console.error("Error getting weekly plans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single weekly plan with full recipe details
 * params: { id }
 */
export const getWeeklyPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid scheduled plan ID" });
    }

    const plan = await WeeklyPlan.findById(idStr).populate({
      path: "days.breakfast days.lunch days.dinner",
      model: "Recipe",
    });

    if (!plan) {
      return res.status(404).json({ error: "Scheduled plan not found" });
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error getting weekly plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new weekly plan
 * body: { userId, name? }
 */
export const createWeeklyPlan = async (req: Request, res: Response) => {
  try {
    const { userId, name, mealTypes = ['breakfast', 'lunch', 'dinner'] } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    // Initialize days array with empty meal slots
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const days = daysOfWeek.map((day) => ({
      dayOfWeek: day,
      breakfast: [],
      lunch: [],
      dinner: [],
    }));

    const plan = new WeeklyPlan({
      userId: new mongoose.Types.ObjectId(userId),
      name: name || "My Scheduled Plan",
      breakfastEnabled: mealTypes.includes('breakfast'),
      lunchEnabled: mealTypes.includes('lunch'),
      dinnerEnabled: mealTypes.includes('dinner'),
      days,
    });

    await plan.save();

    res.json({ plan });
  } catch (err: any) {
    console.error("Error creating weekly plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a meal slot in a weekly plan (add or remove recipe)
 * params: { id }
 * body: { dayOfWeek, mealType, recipeId, index? }
 * If index is provided and recipeId is null, remove recipe at index
 * If index is not provided and recipeId is provided, add recipe to meal
 */
export const updateMealSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, mealType, recipeId, index } = req.body;

    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid scheduled plan ID" });
    }

    if (!["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].includes(dayOfWeek)) {
      return res.status(400).json({ error: "Invalid day of week" });
    }

    if (!["breakfast", "lunch", "dinner"].includes(mealType)) {
      return res.status(400).json({ error: "mealType must be 'breakfast', 'lunch' or 'dinner'" });
    }

    if (recipeId && !mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }

    const plan = await WeeklyPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Scheduled plan not found" });
    }

    const dayPlan = plan.days.find((d: any) => d.dayOfWeek === dayOfWeek);
    if (!dayPlan) {
      return res.status(404).json({ error: "Day not found in plan" });
    }

    const meals = dayPlan[mealType as "breakfast" | "lunch" | "dinner"] as mongoose.Types.ObjectId[];

    // Remove recipe at index
    if (typeof index === "number" && index >= 0 && !recipeId) {
      meals.splice(index, 1);
    }
    // Add new recipe
    else if (recipeId) {
      const objectId = new mongoose.Types.ObjectId(recipeId);
      if (typeof index === "number" && index >= 0) {
        // Replace at index
        meals[index] = objectId;
      } else {
        // Add to end of array
        meals.push(objectId);
      }
    }

    await plan.save();

    // Populate and return
    const populated = await WeeklyPlan.findById(idStr).populate({
      path: "days.breakfast days.lunch days.dinner",
      model: "Recipe",
    });

    res.json({ plan: populated });
  } catch (err: any) {
    console.error("Error updating meal slot:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a weekly plan
 * params: { id }
 */
export const deleteWeeklyPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid scheduled plan ID" });
    }

    const result = await WeeklyPlan.findByIdAndDelete(idStr);

    if (!result) {
      return res.status(404).json({ error: "Scheduled plan not found" });
    }

    res.json({ message: "Scheduled plan deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting weekly plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rename a weekly plan
 * params: { id }
 * body: { name }
 */
export const renameWeeklyPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid scheduled plan ID" });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "name is required and must be a non-empty string" });
    }

    const plan = await WeeklyPlan.findByIdAndUpdate(
      idStr,
      { name: name.trim() },
      { new: true }
    ).populate({
      path: "days.lunch.recipeId days.dinner.recipeId",
      model: "Recipe",
    });

    if (!plan) {
      return res.status(404).json({ error: "Scheduled plan not found" });
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error renaming weekly plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update meal settings (which meals are enabled)
 * params: { id }
 * body: { mealTypes: ['breakfast', 'lunch', 'dinner'] }
 */
export const updateWeeklyPlanSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mealTypes } = req.body;

    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid scheduled plan ID" });
    }

    if (!Array.isArray(mealTypes)) {
      return res.status(400).json({ error: "mealTypes must be an array" });
    }

    const plan = await WeeklyPlan.findByIdAndUpdate(
      idStr,
      {
        breakfastEnabled: mealTypes.includes('breakfast'),
        lunchEnabled: mealTypes.includes('lunch'),
        dinnerEnabled: mealTypes.includes('dinner'),
      },
      { new: true }
    ).populate({
      path: "days.breakfast days.lunch days.dinner",
      model: "Recipe",
    });

    if (!plan) {
      return res.status(404).json({ error: "Scheduled plan not found" });
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error updating weekly plan settings:", err);
    res.status(500).json({ error: err.message });
  }
};
