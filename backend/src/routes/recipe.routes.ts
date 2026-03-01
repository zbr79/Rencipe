import express from "express";
import multer from "multer";
import {
  createRecipe,
  getRecipeById,
  listRecipes,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  rateRecipe,
  uploadRecipeImage,
  uploadStepImage,
} from "../controllers/recipe.controller";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/recipes", listRecipes);
router.post("/recipes", createRecipe);
router.get("/recipes/:id", getRecipeById);
router.put("/recipes/:id", updateRecipe);
router.delete("/recipes/:id", deleteRecipe);
router.patch("/recipes/:id/like", likeRecipe);
router.patch("/recipes/:id/rate", rateRecipe);
router.post("/recipes/:id/upload-image", upload.single("image"), uploadRecipeImage);
router.post("/recipes/:id/steps/:stepNumber/upload-image", upload.single("image"), uploadStepImage);

export default router;