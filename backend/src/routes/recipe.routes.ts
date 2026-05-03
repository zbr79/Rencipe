import express from "express";
import multer from "multer";
import { createRecipe, getRecipeById, listRecipes, updateRecipe, deleteRecipe, uploadRecipeImage, uploadStepImage } from "../controllers/recipe.controller";
import { authenticateOptional, requireAuth } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/recipes", authenticateOptional, listRecipes);
router.post("/recipes", requireAuth, createRecipe);
router.get("/recipes/:id", authenticateOptional, getRecipeById);
router.put("/recipes/:id", requireAuth, updateRecipe);
router.delete("/recipes/:id", requireAuth, deleteRecipe);
router.post("/recipes/:id/upload-image", requireAuth, upload.single("image"), uploadRecipeImage);
router.post("/recipes/:id/steps/:stepNumber/upload-image", requireAuth, upload.single("image"), uploadStepImage);

export default router;