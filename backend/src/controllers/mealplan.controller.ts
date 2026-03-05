import { Request, Response } from "express";
import mongoose from "mongoose";
import MealPlan, { IMealCombination } from "../models/MealPlan";
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
      .populate({
        path: "combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
        model: "Recipe",
      })
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
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const plan = await MealPlan.findById(idStr).populate({
      path: "combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });

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
 * body: { userId, numberOfPeople, numberOfDays, mealTypes: ['lunch', 'dinner'], name?, people?: [{name, modifier}, ...] }
 */
export const createMealPlan = async (req: Request, res: Response) => {
  try {
    const { userId, numberOfPeople, numberOfDays, mealTypes, name, people } = req.body;

    if (!userId || numberOfPeople === undefined || numberOfDays === undefined || !mealTypes) {
      return res.status(400).json({
        error: "userId, numberOfPeople, numberOfDays, and mealTypes are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "userId must be a valid MongoDB ObjectId" });
    }

    if (!Array.isArray(mealTypes) || mealTypes.length === 0) {
      return res.status(400).json({ error: "mealTypes must be a non-empty array of 'lunch' or 'dinner'" });
    }

    // Validate mealTypes
    const validMealTypes = ["lunch", "dinner"];
    for (const type of mealTypes) {
      if (!validMealTypes.includes(type)) {
        return res.status(400).json({ error: "mealTypes must contain only 'lunch' or 'dinner'" });
      }
    }

    if (numberOfPeople < 1 || numberOfDays < 1) {
      return res.status(400).json({ error: "numberOfPeople and numberOfDays must be at least 1" });
    }

    // Create people array - either from provided data or default
    let peopleArray = [];
    if (people && Array.isArray(people) && people.length > 0) {
      // Validate and use provided people data
      peopleArray = people.map((p: any) => ({
        name: p.name || `Person ${peopleArray.length + 1}`,
        modifier: Math.max(0.1, Math.min(5.0, p.modifier || 1.0)),
      }));
    } else {
      // Create default people with 1.0 modifier
      for (let i = 0; i < numberOfPeople; i++) {
        peopleArray.push({
          name: `Person ${i + 1}`,
          modifier: 1.0,
        });
      }
    }

    // Calculate total meals needed: numberOfDays * number of meal types
    // Modifiers only affect ingredient quantities, not the number of meal occasions
    const totalMealsNeeded = numberOfDays * mealTypes.length;

    const plan = new MealPlan({
      userId: new mongoose.Types.ObjectId(userId),
      name: name || `${numberOfPeople}人${numberOfDays}天计划`,
      people: peopleArray,
      numberOfDays,
      mealTypes,
      totalMealsNeeded,
      combinations: [],
    });

    await plan.save();


    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Error creating meal plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a meal plan (name, people, numberOfDays, mealTypes)
 * params: { id }
 * body: { name?, people?: [{name, modifier}, ...], numberOfDays?, mealTypes? }
 */
export const renameMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, people, numberOfDays, mealTypes } = req.body;

    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (people !== undefined && Array.isArray(people)) {
      if (people.length === 0) {
        return res.status(400).json({ error: "Plan must have at least one person" });
      }
      updateData.people = people.map((p: any) => ({
        name: p.name || `Person ${people.indexOf(p) + 1}`,
        modifier: Math.max(0.1, Math.min(5.0, p.modifier || 1.0)),
      }));
    }
    
    if (numberOfDays !== undefined) {
      if (numberOfDays < 1) {
        return res.status(400).json({ error: "numberOfDays must be at least 1" });
      }
      updateData.numberOfDays = numberOfDays;
    }
    
    if (mealTypes !== undefined) {
      if (!Array.isArray(mealTypes) || mealTypes.length === 0) {
        return res.status(400).json({ error: "mealTypes must be a non-empty array" });
      }
      const validMealTypes = ["lunch", "dinner"];
      for (const type of mealTypes) {
        if (!validMealTypes.includes(type)) {
          return res.status(400).json({ error: "mealTypes must contain only 'lunch' or 'dinner'" });
        }
      }
      updateData.mealTypes = mealTypes;
    }

    // If any of the meal calculation fields changed, recalculate totalMealsNeeded
    if (updateData.people !== undefined || updateData.numberOfDays !== undefined || updateData.mealTypes !== undefined) {
      const plan = await MealPlan.findById(idStr);
      if (!plan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }

      const planPeople = updateData.people !== undefined ? updateData.people : plan.people;
      const days = updateData.numberOfDays !== undefined ? updateData.numberOfDays : plan.numberOfDays;
      const types = updateData.mealTypes !== undefined ? updateData.mealTypes : plan.mealTypes;

      // Calculate total: days * number of meal types
      // Modifiers only affect ingredient quantities, not the number of meal occasions
      updateData.totalMealsNeeded = days * types.length;
    }

    const plan = await MealPlan.findByIdAndUpdate(
      idStr,
      updateData,
      { new: true }
    ).populate({
      path: "combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });

    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error updating meal plan:", err);
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
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const plan = await MealPlan.findByIdAndDelete(idStr);

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
 * Add meal combination to meal plan
 * params: { id }
 * body: { meatRecipeId, vegeRecipeId, sideRecipeId, portions }
 */
export const addMealCombination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    const { meatRecipeId, vegeRecipeId, sideRecipeId, portions } = req.body;

    if (!meatRecipeId || !vegeRecipeId || !sideRecipeId || portions === undefined) {
      return res.status(400).json({
        error: "meatRecipeId, vegeRecipeId, sideRecipeId, and portions are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(meatRecipeId) ||
      !mongoose.Types.ObjectId.isValid(vegeRecipeId) ||
      !mongoose.Types.ObjectId.isValid(sideRecipeId)
    ) {
      return res.status(400).json({ error: "Invalid recipe IDs" });
    }

    if (portions < 1) {
      return res.status(400).json({ error: "portions must be at least 1" });
    }

    // Verify all recipes exist
    const [meatRecipe, vegeRecipe, sideRecipe] = await Promise.all([
      Recipe.findById(meatRecipeId),
      Recipe.findById(vegeRecipeId),
      Recipe.findById(sideRecipeId),
    ]);

    if (!meatRecipe || !vegeRecipe || !sideRecipe) {
      return res.status(404).json({ error: "One or more recipes not found" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    const newCombination: IMealCombination = {
      meatRecipeId: new mongoose.Types.ObjectId(meatRecipeId),
      vegeRecipeId: new mongoose.Types.ObjectId(vegeRecipeId),
      sideRecipeId: new mongoose.Types.ObjectId(sideRecipeId),
      portions,
    };

    plan.combinations.push(newCombination);
    await plan.save();
    await plan.populate({
      path: "combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });

    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Error adding meal combination:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove meal combination from meal plan
 * params: { id, combinationIndex }
 */
export const removeMealCombination = async (req: Request, res: Response) => {
  try {
    const { id, combinationIndex } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    const combinationIndexStr = (Array.isArray(combinationIndex) ? combinationIndex[0] : combinationIndex) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const index = parseInt(combinationIndexStr, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: "Invalid combination index" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    if (index >= plan.combinations.length) {
      return res.status(400).json({ error: "Combination index out of range" });
    }

    plan.combinations.splice(index, 1);
    await plan.save();
    await plan.populate({
      path: "combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });

    res.json({ plan });
  } catch (err: any) {
    console.error("Error removing meal combination:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Toggle ingredient check status
 * params: { id }
 * body: { ingredientName, checked }
 */
export const toggleIngredientCheckStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ingredientName, checked } = req.body;

    if (!ingredientName) {
      return res.status(400).json({ error: "ingredientName is required" });
    }

    if (typeof checked !== "boolean") {
      return res.status(400).json({ error: "checked must be a boolean" });
    }

    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid meal plan ID" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    // Update checked ingredients array
    if (checked) {
      // Add to checked list if not already there
      if (!plan.checkedIngredients.includes(ingredientName)) {
        plan.checkedIngredients.push(ingredientName);
      }
    } else {
      // Remove from checked list
      plan.checkedIngredients = plan.checkedIngredients.filter(
        (ing) => ing !== ingredientName
      );
    }

    await plan.save();
    await plan.populate({
      path: "combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });
  } catch (err: any) {
    console.error("Error toggling ingredient check status:", err);
    res.status(500).json({ error: err.message });
  }
};
