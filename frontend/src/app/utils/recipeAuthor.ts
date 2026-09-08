import type { AccountIdentity } from "./accountAvatar";

export interface RecipeWithAuthor {
  author?: AccountIdentity | null;
  authorId?: string | AccountIdentity | null;
}

export function getRecipeAuthor(recipe: RecipeWithAuthor): AccountIdentity | null {
  if (recipe.author) return recipe.author;
  if (recipe.authorId && typeof recipe.authorId === "object") return recipe.authorId;
  return null;
}
