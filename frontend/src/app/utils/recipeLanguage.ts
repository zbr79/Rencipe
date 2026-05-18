import type { AuthUser } from "./authSession";

export type RecipeLanguage = "en" | "zh";

const CHINESE_TEXT_PATTERN = /[\u3400-\u9fff]/;

interface RecipeLanguageSource {
  language?: RecipeLanguage;
  title?: string;
  description?: string;
  tips?: string;
  sharedSource?: string;
  mainIngredients?: Array<{ name?: string; quantity?: string | number }>;
  seasonings?: Array<{ name?: string; quantity?: string | number }>;
  steps?: Array<{ instruction?: string }>;
  tags?: string[];
}

function normalizeLanguage(value: unknown): RecipeLanguage {
  return value === "zh" ? "zh" : "en";
}

export function detectRecipeLanguage(recipe: RecipeLanguageSource): RecipeLanguage {
  const ingredientParts = [...(recipe.mainIngredients || []), ...(recipe.seasonings || [])]
    .map((ingredient) => `${ingredient.name || ""} ${ingredient.quantity || ""}`);
  const stepParts = (recipe.steps || []).map((step) => step.instruction || "");
  const text = [
    recipe.title,
    recipe.description,
    recipe.tips,
    recipe.sharedSource,
    ...ingredientParts,
    ...stepParts,
    ...(recipe.tags || []),
  ].filter(Boolean).join(" ");

  return CHINESE_TEXT_PATTERN.test(text) ? "zh" : "en";
}

export function getRecipeLanguage(recipe: RecipeLanguageSource): RecipeLanguage {
  const detectedLanguage = detectRecipeLanguage(recipe);
  if (detectedLanguage === "zh") return "zh";
  return recipe.language === "zh" || recipe.language === "en" ? recipe.language : "en";
}

export function isRecipeRelevantToUserLanguage(recipe: RecipeLanguageSource, user: Pick<AuthUser, "language" | "projectMode"> | null | undefined) {
  if (!user || user.projectMode === false) return true;
  return getRecipeLanguage(recipe) === normalizeLanguage(user.language);
}

export function filterRecipesForUserLanguage<T extends RecipeLanguageSource>(recipes: T[], user: Pick<AuthUser, "language" | "projectMode"> | null | undefined) {
  return recipes.filter((recipe) => isRecipeRelevantToUserLanguage(recipe, user));
}
