import express from "express";
import {
  getMealPlans,
  getMealPlanById,
  createMealPlan,
  renameMealPlan,
  deleteMealPlan,
  restoreMealPlan,
  addRecipeToMealPlan,
  addMealCombination,
  removeMealCombination,
  toggleIngredientCheckStatus,
} from "../controllers/meal.controller";
import { authenticateOptional, requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/meals", authenticateOptional, getMealPlans);
router.post("/meals", requireAuth, createMealPlan);
router.get("/meals/:id", authenticateOptional, getMealPlanById);
router.put("/meals/:id", requireAuth, renameMealPlan);
router.delete("/meals/:id", requireAuth, deleteMealPlan);
router.patch("/meals/:id/restore", requireAuth, restoreMealPlan);
router.post("/meals/:id/recipes", requireAuth, addRecipeToMealPlan);
router.post("/meals/:id/combinations", requireAuth, addMealCombination);
router.delete("/meals/:id/combinations/:combinationIndex", requireAuth, removeMealCombination);
router.patch("/meals/:id/ingredients", requireAuth, toggleIngredientCheckStatus);

export default router;

