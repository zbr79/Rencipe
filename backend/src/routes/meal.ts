import express from "express";
import {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  restoreMeal,
  addRecipeToMeal,
} from "../controllers/meal";
import { authenticateOptional, requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/meals", authenticateOptional, getMeals);
router.post("/meals", requireAuth, createMeal);
router.get("/meals/:id", authenticateOptional, getMealById);
router.put("/meals/:id", requireAuth, updateMeal);
router.delete("/meals/:id", requireAuth, deleteMeal);
router.patch("/meals/:id/restore", requireAuth, restoreMeal);
router.post("/meals/:id/recipes", requireAuth, addRecipeToMeal);

export default router;
