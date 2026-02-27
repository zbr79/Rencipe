import express from "express";
import { createRecipe, getRecipeById, listRecipes } from "../controllers/recipe.controller";

const router = express.Router();

router.get("/recipes", listRecipes);
router.post("/recipes", createRecipe);
router.get("/recipes/:id", getRecipeById);

export default router;