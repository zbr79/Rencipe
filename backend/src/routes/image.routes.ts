import { Router } from "express";
import { populateMockImages, populateSingleImage } from "../controllers/image.controller";

const router = Router();

/**
 * Populate all recipes without images with mock images
 * POST /recipes/populate-mock-images
 */
router.post("/recipes/populate-mock-images", populateMockImages);

/**
 * Populate a single recipe with a mock image
 * POST /recipes/:id/populate-image
 */
router.post("/recipes/:id/populate-image", populateSingleImage);

export default router;
