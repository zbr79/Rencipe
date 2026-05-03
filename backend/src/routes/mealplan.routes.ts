import express from "express";
import {
  getMealPlans,
  getMealPlanById,
  createMealPlan,
  renameMealPlan,
  deleteMealPlan,
  addRecipeToMealPlan,
  addMealCombination,
  removeMealCombination,
  toggleIngredientCheckStatus,
} from "../controllers/mealplan.controller";

const router = express.Router();

router.get("/meal-plans", getMealPlans);
router.post("/meal-plans", createMealPlan);
router.get("/meal-plans/:id", getMealPlanById);
router.put("/meal-plans/:id", renameMealPlan);
router.delete("/meal-plans/:id", deleteMealPlan);
router.post("/meal-plans/:id/recipes", addRecipeToMealPlan);
router.post("/meal-plans/:id/combinations", addMealCombination);
router.delete("/meal-plans/:id/combinations/:combinationIndex", removeMealCombination);
router.patch("/meal-plans/:id/ingredients", toggleIngredientCheckStatus);

export default router;

