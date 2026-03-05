import { Request, Response } from "express";
import Recipe from "../models/Recipe";

/**
 * Generates a mock image URL for a recipe based on its ID
 */
function generateMockImageUrl(recipeId: string): string {
  let hash = 0;
  for (let i = 0; i < recipeId.length; i++) {
    const char = recipeId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const seed = Math.abs(hash);
  return `https://picsum.photos/400/300?random=${seed}`;
}

/**
 * Populate all recipes without images with mock images
 * POST /recipes/populate-mock-images
 */
export const populateMockImages = async (req: Request, res: Response) => {
  try {
    // Find all recipes that don't have images
    const recipesWithoutImages = await Recipe.find({ image: { $in: [null, ""] } });

    if (recipesWithoutImages.length === 0) {
      return res.json({
        success: true,
        message: "All recipes already have images",
        updated: 0,
      });
    }

    // Update each recipe with a mock image URL
    const updatedRecipes = await Promise.all(
      recipesWithoutImages.map(async (recipe) => {
        recipe.image = generateMockImageUrl(recipe._id.toString());
        return await recipe.save();
      })
    );

    res.json({
      success: true,
      message: "Mock images populated successfully",
      updated: updatedRecipes.length,
      recipes: updatedRecipes.map((r) => ({
        id: r._id,
        title: r.title,
        image: r.image,
      })),
    });
  } catch (error: any) {
    console.error("Error populating mock images:", error);
    res.status(500).json({
      error: error.message || "Failed to populate mock images",
    });
  }
};

/**
 * Populate a single recipe with a mock image if it doesn't have one
 * POST /recipes/:id/populate-image
 */
export const populateSingleImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // If recipe already has an image, return it
    if (recipe.image) {
      return res.json({
        success: true,
        message: "Recipe already has an image",
        recipe: {
          id: recipe._id,
          title: recipe.title,
          image: recipe.image,
        },
      });
    }

    // Generate and assign mock image
    recipe.image = generateMockImageUrl(recipe._id.toString());
    await recipe.save();

    res.json({
      success: true,
      message: "Mock image assigned successfully",
      recipe: {
        id: recipe._id,
        title: recipe.title,
        image: recipe.image,
      },
    });
  } catch (error: any) {
    console.error("Error populating single image:", error);
    res.status(500).json({
      error: error.message || "Failed to populate image",
    });
  }
};
