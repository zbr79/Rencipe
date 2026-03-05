/**
 * Generates a consistent placeholder image URL for a recipe
 * Uses picsum.photos for realistic food-like images
 * The image is deterministic based on the recipe ID
 */
export function getRecipeImageUrl(recipeId: string, width: number = 400, height: number = 300): string {
  // Create a numeric hash from the recipe ID to ensure consistent images
  let hash = 0;
  for (let i = 0; i < recipeId.length; i++) {
    const char = recipeId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to create a seed for picsum.photos
  const seed = Math.abs(hash);
  
  // Return a picsum.photos URL with the seed to get deterministic images
  return `https://picsum.photos/${width}/${height}?random=${seed}`;
}

/**
 * Adds mock images to recipes that don't have images
 */
export function enrichRecipesWithMockImages<T extends { id?: string; _id?: string; image?: string }>(
  recipes: T[]
): T[] {
  return recipes.map((recipe) => {
    // Use _id if available (from MongoDB), otherwise use id
    const recipeId = recipe._id || recipe.id;
    
    // Only add image if it doesn't already have one
    if (!recipe.image && recipeId) {
      return {
        ...recipe,
        image: getRecipeImageUrl(recipeId),
      };
    }
    
    return recipe;
  });
}
