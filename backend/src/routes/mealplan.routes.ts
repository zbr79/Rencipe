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
} from "../controllers/mealplan.controller";
import { authenticateOptional, requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/meal-plans", authenticateOptional, getMealPlans);
router.post("/meal-plans", requireAuth, createMealPlan);
router.get("/meal-plans/:id", authenticateOptional, getMealPlanById);
router.put("/meal-plans/:id", requireAuth, renameMealPlan);
router.delete("/meal-plans/:id", requireAuth, deleteMealPlan);
router.patch("/meal-plans/:id/restore", requireAuth, restoreMealPlan);
router.post("/meal-plans/:id/recipes", requireAuth, addRecipeToMealPlan);
router.post("/meal-plans/:id/combinations", requireAuth, addMealCombination);
router.delete("/meal-plans/:id/combinations/:combinationIndex", requireAuth, removeMealCombination);
router.patch("/meal-plans/:id/ingredients", requireAuth, toggleIngredientCheckStatus);

export default router;

