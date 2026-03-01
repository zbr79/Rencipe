import express from "express";
import { createRecipe, getRecipeById, listRecipes, updateRecipe, deleteRecipe } from "../controllers/recipe.controller";

const router = express.Router();

router.get("/recipes", listRecipes);
router.post("/recipes", createRecipe);
router.get("/recipes/:id", getRecipeById);
router.put("/recipes/:id", updateRecipe);
router.delete("/recipes/:id", deleteRecipe);

export default router;