import { Request, Response } from "express";
import mongoose from "mongoose";
import MealPlan, { IMealCombination, MealEntryKind, MealType } from "../models/MealPlan";
import Recipe from "../models/Recipe";
import { getAuthUser } from "../middleware/auth";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function activePlanQuery() {
  return {
    $or: [
      { deletedAt: { $exists: false } },
      { deletedAt: null },
    ],
  };
}

function trashedPlanQuery() {
  return {
    deletedAt: { $exists: true, $ne: null },
    trashExpiresAt: { $exists: true, $ne: null },
  };
}

function isPlanTrashed(plan: any) {
  return Boolean(plan?.deletedAt);
}

function getPlanOwnerId(plan: any) {
  return String(plan?.userId?._id || plan?.userId || "");
}

function canAccessPlan(req: Request, plan: any) {
  const user = getAuthUser(req);
  if (normalizeKind(plan.kind) === "meal" && plan.isPublic) return true;
  if (!user) return false;
  return user.role === "admin" || getPlanOwnerId(plan) === user.id;
}

function canMutatePlan(req: Request, plan: any) {
  const user = getAuthUser(req);
  if (!user) return false;
  return user.role === "admin" || getPlanOwnerId(plan) === user.id;
}

function normalizeKind(kind: any): MealEntryKind {
  return kind === "meal" ? "meal" : "mealPlan";
}

function normalizeMealTypes(mealTypes: any): MealType[] {
  if (!Array.isArray(mealTypes)) return ["dinner"];
  const requestedTypes = new Set(mealTypes);
  const normalizedTypes = VALID_MEAL_TYPES.filter((type) => requestedTypes.has(type));
  return normalizedTypes.length > 0 ? normalizedTypes : ["dinner"];
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

function buildPlanDays(numberOfDays: number, mealTypes: MealType[], existingDays: any[] = []) {
  return Array.from({ length: numberOfDays }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const existingDay = existingDays.find((day) => Number(day.dayNumber) === dayNumber);

    return {
      dayNumber,
      meals: mealTypes.map((mealType) => {
        const existingMeal = existingDay?.meals?.find((meal: any) => meal.mealType === mealType);
        return {
          mealType,
          recipes: Array.isArray(existingMeal?.recipes) ? existingMeal.recipes : [],
        };
      }),
    };
  });
}

function normalizeSubmittedDays(days: any, numberOfDays: number, mealTypes: MealType[]) {
  if (!Array.isArray(days)) return buildPlanDays(numberOfDays, mealTypes);

  return buildPlanDays(numberOfDays, mealTypes, days).map((day) => ({
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      recipes: meal.recipes
        .map((recipe: any) => {
          const recipeId = typeof recipe === "string" ? recipe : recipe?._id || recipe?.id;
          return mongoose.Types.ObjectId.isValid(recipeId) ? new mongoose.Types.ObjectId(recipeId) : null;
        })
        .filter(Boolean),
    })),
  }));
}

async function populateMealPlan(plan: any) {
  return plan.populate([
    { path: "userId", select: "username displayName role avatarUrl" },
    { path: "recipes", model: "Recipe" },
    { path: "days.meals.recipes", model: "Recipe" },
    { path: "combinations.meatRecipeId", model: "Recipe" },
    { path: "combinations.vegeRecipeId", model: "Recipe" },
    { path: "combinations.sideRecipeId", model: "Recipe" },
  ]);
}

/**
 * Get all plans for a user
 * query: { userId }
 */
export const getMealPlans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const trashOnly = String(req.query.trash || "") === "1";
    const visibility = String(req.query.visibility || "owned");
    const requestedKind = req.query.kind ? normalizeKind(req.query.kind) : "meal";

    if (requestedKind === "mealPlan") {
      return res.json({ plans: [] });
    }

    const query: any = trashOnly ? trashedPlanQuery() : activePlanQuery();
    query.kind = requestedKind;

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

    const plans = await MealPlan.find(query)
      .populate([
        { path: "userId", select: "username displayName role avatarUrl" },
        { path: "recipes", model: "Recipe" },
        { path: "days.meals.recipes", model: "Recipe" },
        { path: "combinations.meatRecipeId", model: "Recipe" },
        { path: "combinations.vegeRecipeId", model: "Recipe" },
        { path: "combinations.sideRecipeId", model: "Recipe" },
      ])
      .sort(trashOnly ? { deletedAt: -1, updatedAt: -1 } : { createdAt: -1 });

    res.json({ plans });
  } catch (err: any) {
    console.error("Error getting plans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single plan with full recipe details
 * params: { id }
 */
export const getMealPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const plan = await MealPlan.findById(idStr).populate([
      { path: "userId", select: "username displayName role avatarUrl" },
      { path: "recipes", model: "Recipe" },
      { path: "days.meals.recipes", model: "Recipe" },
      { path: "combinations.meatRecipeId", model: "Recipe" },
      { path: "combinations.vegeRecipeId", model: "Recipe" },
      { path: "combinations.sideRecipeId", model: "Recipe" },
    ]);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (isPlanTrashed(plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (!canAccessPlan(req, plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (normalizeKind(plan.kind) === "meal") {
      await MealPlan.updateOne({ _id: plan._id }, { $inc: { views: 1 } }, { timestamps: false });
      plan.views = (plan.views ?? 0) + 1;
    }

    res.json({ plan });
  } catch (err: any) {
    console.error("Error getting plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new plan
 * body: { userId, numberOfPeople, numberOfDays, mealTypes: ['lunch', 'dinner'], name?, people?: [{name, modifier}, ...] }
 */
export const createMealPlan = async (req: Request, res: Response) => {
  try {
    const { userId, numberOfPeople, numberOfDays, mealTypes, name, people, kind, isPublic, recipes } = req.body;
    const normalizedKind = normalizeKind(kind);
    const normalizedRecipeIds = normalizeRecipeIds(recipes);

    if (normalizedKind === "mealPlan") {
      return res.status(410).json({ error: "Plans are currently disabled" });
    }

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

    if (normalizedKind === "meal" && !String(name || "").trim()) {
      return res.status(400).json({ error: "Meal name is required" });
    }

    if (normalizedKind === "meal" && normalizedRecipeIds.length === 0) {
      return res.status(400).json({ error: "Add at least one recipe before creating a meal" });
    }

    // Create people array - either from provided data or default
    let peopleArray = [];
    if (people && Array.isArray(people) && people.length > 0) {
      // Validate and use provided people data
      peopleArray = people.map((p: any, index: number) => ({
        name: p.name || `Person ${index + 1}`,
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

    let plan;

    if (normalizedKind === "meal") {
      plan = new MealPlan({
        kind: normalizedKind,
        userId: new mongoose.Types.ObjectId(userId),
        name: String(name).trim(),
        people: peopleArray,
        isPublic: Boolean(isPublic),
        recipes: normalizedRecipeIds,
        combinations: [],
        days: [],
      });
    } else {
      if (numberOfDays === undefined || !mealTypes) {
        return res.status(400).json({
          error: "numberOfDays and mealTypes are required for plans",
        });
      }

      const normalizedMealTypes = normalizeMealTypes(mealTypes);

      if (numberOfDays < 1) {
        return res.status(400).json({ error: "numberOfDays must be at least 1" });
      }

      const totalMealsNeeded = numberOfDays * normalizedMealTypes.length;

      plan = new MealPlan({
        kind: normalizedKind,
        userId: new mongoose.Types.ObjectId(userId),
        name: name || `${numberOfPeople}-person ${numberOfDays}-day plan`,
        people: peopleArray,
        numberOfDays,
        mealTypes: normalizedMealTypes,
        totalMealsNeeded,
        isPublic: false,
        days: buildPlanDays(numberOfDays, normalizedMealTypes),
        recipes: [],
        combinations: [],
      });
    }

    await plan.save();

    await populateMealPlan(plan);

    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Error creating plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a plan (name, people, numberOfDays, mealTypes)
 * params: { id }
 * body: { name?, people?: [{name, modifier}, ...], numberOfDays?, mealTypes? }
 */
export const renameMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, people, numberOfDays, mealTypes, days, recipes, isPublic } = req.body;

    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (isPlanTrashed(plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to update this plan" });
    }

    const entryKind = normalizeKind(plan.kind);

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

    if (recipes !== undefined) {
      updateData.recipes = normalizeRecipeIds(recipes);
    }

    if (entryKind === "meal" && isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
    }

    if (entryKind === "mealPlan") {
      if (numberOfDays !== undefined) {
        if (numberOfDays < 1) {
          return res.status(400).json({ error: "numberOfDays must be at least 1" });
        }
        updateData.numberOfDays = numberOfDays;
      }

      if (mealTypes !== undefined) {
        updateData.mealTypes = normalizeMealTypes(mealTypes);
      }

      if (updateData.people !== undefined || updateData.numberOfDays !== undefined || updateData.mealTypes !== undefined || days !== undefined) {
        const nextNumberOfDays = updateData.numberOfDays !== undefined ? updateData.numberOfDays : plan.numberOfDays || 1;
        const nextMealTypes = updateData.mealTypes !== undefined ? updateData.mealTypes : plan.mealTypes || ["dinner"];

        updateData.totalMealsNeeded = nextNumberOfDays * nextMealTypes.length;
        updateData.days = normalizeSubmittedDays(days ?? plan.days, nextNumberOfDays, nextMealTypes);
      }
    }

    Object.assign(plan, updateData);
    await plan.save();

    if (entryKind === "meal") {
      plan.days = [];
    }

    await populateMealPlan(plan);

    res.json({ plan });
  } catch (err: any) {
    console.error("Error updating plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a plan
 * params: { id }
 */
export const deleteMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const plan = await MealPlan.findById(idStr);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to delete this plan" });
    }

    const deletedAt = plan.deletedAt || new Date();
    plan.deletedAt = deletedAt;
    plan.trashExpiresAt = new Date(deletedAt.getTime() + TRASH_RETENTION_MS);
    await plan.save();

    res.json({ message: "Plan moved to trash", trashExpiresAt: plan.trashExpiresAt });
  } catch (err: any) {
    console.error("Error deleting plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Restore a plan from trash
 * params: { id }
 */
export const restoreMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to restore this plan" });
    }

    plan.deletedAt = undefined;
    plan.trashExpiresAt = undefined;
    await plan.save();
    await populateMealPlan(plan);

    res.json({ plan, message: "Plan restored" });
  } catch (err: any) {
    console.error("Error restoring plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add a recipe directly to a plan
 * params: { id }
 * body: { recipeId }
 */
export const addRecipeToMealPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: "recipeId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }

    const [plan, recipe] = await Promise.all([
      MealPlan.findById(idStr),
      Recipe.findById(recipeId),
    ]);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (isPlanTrashed(plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to update this plan" });
    }

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipeObjectId = new mongoose.Types.ObjectId(recipeId);

    let changed = false;
    if (!plan.recipes.some((id) => id.toString() === recipeId)) {
      plan.recipes.push(recipeObjectId);
      changed = true;
    }

    if (normalizeKind(plan.kind) === "meal") {
      if (changed) await plan.save();
      await populateMealPlan(plan);
      return res.status(201).json({ plan });
    }

    if (!plan.days || plan.days.length === 0) {
      plan.days = buildPlanDays(plan.numberOfDays || 1, plan.mealTypes || ["dinner"]);
      changed = true;
    }

    const openMeal = plan.days
      .flatMap((day: any) => day.meals)
      .find((meal: any) => Array.isArray(meal.recipes) && meal.recipes.length === 0);

    const targetMeal = openMeal || plan.days[0]?.meals?.[0];
    if (targetMeal && !targetMeal.recipes.some((id: any) => id.toString() === recipeId)) {
      targetMeal.recipes.push(recipeObjectId);
      changed = true;
    }

    if (changed) await plan.save();

    await populateMealPlan(plan);

    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Error adding recipe to plan:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add meal combination to plan
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
      return res.status(400).json({ error: "Invalid plan ID" });
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
      return res.status(404).json({ error: "Plan not found" });
    }
    if (isPlanTrashed(plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to update this plan" });
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
      path: "recipes combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });

    res.status(201).json({ plan });
  } catch (err: any) {
    console.error("Error adding meal combination:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove meal combination from plan
 * params: { id, combinationIndex }
 */
export const removeMealCombination = async (req: Request, res: Response) => {
  try {
    const { id, combinationIndex } = req.params;
    const idStr = (Array.isArray(id) ? id[0] : id) as string;
    const combinationIndexStr = (Array.isArray(combinationIndex) ? combinationIndex[0] : combinationIndex) as string;

    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const index = parseInt(combinationIndexStr, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: "Invalid combination index" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (isPlanTrashed(plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to update this plan" });
    }

    if (index >= plan.combinations.length) {
      return res.status(400).json({ error: "Combination index out of range" });
    }

    plan.combinations.splice(index, 1);
    await plan.save();
    await plan.populate({
      path: "recipes combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
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
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const plan = await MealPlan.findById(idStr);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (isPlanTrashed(plan)) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (!canMutatePlan(req, plan)) {
      return res.status(403).json({ error: "Not allowed to update this plan" });
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
      path: "recipes combinations.meatRecipeId combinations.vegeRecipeId combinations.sideRecipeId",
      model: "Recipe",
    });

    res.json({ plan });
  } catch (err: any) {
    console.error("Error toggling ingredient check status:", err);
    res.status(500).json({ error: err.message });
  }
};
