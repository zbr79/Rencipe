/**
 * Populates all recipes without images with mock images
 * Calls the backend API to store mock image URLs in the database
 */
export async function populateRecipeImages(): Promise<{
  success: boolean;
  updated: number;
  message: string;
}> {
  try {
    const response = await fetch("/api/recipes/populate-images", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to populate recipe images");
    }

    const data = await response.json();
    console.log("Recipe images populated:", data);
    return data;
  } catch (error: any) {
    console.error("Error populating recipe images:", error);
    throw error;
  }
}
