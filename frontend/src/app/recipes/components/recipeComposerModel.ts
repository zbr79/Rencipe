import type { AuthUser } from "../../utils/authSession";

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Step {
  stepNumber: number;
  instruction: string;
  image?: string;
}

export type RecipeOrigin = "original" | "shared";
export type ComposerMode = "create" | "edit";
export type CreateValidationState = {
  title: boolean;
  description: boolean;
  image: boolean;
  mainIngredients: boolean;
  steps: boolean;
};

export interface RecipeFormData {
  title: string;
  description: string;
  tips: string;
  authorId: string;
  recipeOrigin: RecipeOrigin;
  sharedSource: string;
  sharedSourceLink: string;
  component: boolean;
  isPublic: boolean;
  mainIngredients: Ingredient[];
  seasonings: Ingredient[];
  steps: Step[];
  servings: number;
  tags: string[];
}

export interface RecipeData extends RecipeFormData {
  id: string;
  image?: string;
}

export interface RecipeComposerProps {
  mode: ComposerMode;
  draftId?: string;
  recipeId?: string;
}

export type EditSaveState = "idle" | "saving" | "saved" | "error" | "blocked";

const DEFAULT_INGREDIENT_ROWS = 3;

export const EMPTY_CREATE_VALIDATION: CreateValidationState = {
  title: false,
  description: false,
  image: false,
  mainIngredients: false,
  steps: false,
};

export function createEmptyIngredients(count = DEFAULT_INGREDIENT_ROWS): Ingredient[] {
  return Array.from({ length: count }, () => ({ name: "", quantity: "" }));
}

export function createInitialFormData(authorId = ""): RecipeFormData {
  return {
    title: "",
    description: "",
    tips: "",
    authorId,
    recipeOrigin: "original",
    sharedSource: "",
    sharedSourceLink: "",
    component: false,
    isPublic: false,
    mainIngredients: createEmptyIngredients(),
    seasonings: createEmptyIngredients(),
    steps: [{ stepNumber: 1, instruction: "" }],
    servings: 1,
    tags: [],
  };
}

export function normalizeRecipeForm(recipe: RecipeData): RecipeFormData {
  return {
    title: recipe.title,
    description: recipe.description,
    tips: recipe.tips || "",
    authorId: recipe.authorId,
    recipeOrigin: recipe.recipeOrigin === "shared" ? "shared" : "original",
    sharedSource: recipe.sharedSource || "",
    sharedSourceLink: recipe.sharedSourceLink || "",
    component: recipe.component ?? false,
    isPublic: recipe.isPublic ?? false,
    mainIngredients: recipe.mainIngredients?.length ? recipe.mainIngredients : createEmptyIngredients(),
    seasonings: recipe.seasonings?.length ? recipe.seasonings : createEmptyIngredients(),
    steps: recipe.steps || [{ stepNumber: 1, instruction: "" }],
    servings: recipe.servings || 1,
    tags: recipe.tags || [],
  };
}

export function canEditRecipe(recipe: RecipeData, user: AuthUser | null) {
  return Boolean(user && (user.role === "admin" || recipe.authorId === user.id));
}

export function getStepImageMap(steps: Step[] = []) {
  const images: { [key: number]: string } = {};
  steps.forEach((step) => {
    if (step.image) {
      images[step.stepNumber] = step.image;
    }
  });
  return images;
}

export function buildRecipeSteps(steps: Step[], stepImages: { [key: number]: string }) {
  return steps.map((step) => ({
    ...step,
    image: stepImages[step.stepNumber] || undefined,
  }));
}

export function buildRecipeUpdatePayload(
  data: RecipeFormData,
  stepImages: { [key: number]: string },
  options?: { includeImage?: boolean; recipeImage?: string | null }
) {
  return {
    title: data.title,
    description: data.description,
    tips: data.tips.trim(),
    recipeOrigin: data.recipeOrigin,
    sharedSource: data.recipeOrigin === "shared" ? data.sharedSource.trim() : "",
    sharedSourceLink: data.recipeOrigin === "shared" ? data.sharedSourceLink.trim() : "",
    component: data.component,
    isPublic: data.isPublic,
    mainIngredients: data.mainIngredients,
    seasonings: data.seasonings,
    steps: buildRecipeSteps(data.steps, stepImages),
    servings: data.servings,
    tags: data.tags,
    ...(options?.includeImage ? { image: options.recipeImage ?? "" } : {}),
  };
}

export function getRecipeUpdateSignature(data: RecipeFormData, stepImages: { [key: number]: string }) {
  return JSON.stringify(buildRecipeUpdatePayload(data, stepImages));
}

export function getEditValidationMessage(data: RecipeFormData) {
  if (!data.title.trim()) {
    return "Autosave paused until the recipe has a name.";
  }

  if (!data.description.trim()) {
    return "Autosave paused until the recipe has a description.";
  }

  if (data.recipeOrigin === "shared" && !data.sharedSource.trim()) {
    return "Autosave paused until the shared recipe source is filled in.";
  }

  return null;
}

export function getCreateValidationState(data: RecipeFormData, image: string | null): CreateValidationState {
  return {
    title: !data.title.trim(),
    description: !data.description.trim(),
    image: !image,
    mainIngredients: !data.mainIngredients.some((ingredient) => ingredient.name.trim()),
    steps: !data.steps.some((step) => step.instruction.trim()),
  };
}

export function getCreateValidationLabels(validation: CreateValidationState) {
  const missingFields: string[] = [];

  if (validation.title) {
    missingFields.push("recipe name");
  }
  if (validation.description) {
    missingFields.push("description");
  }
  if (validation.image) {
    missingFields.push("cover image");
  }
  if (validation.mainIngredients) {
    missingFields.push("at least one main ingredient");
  }
  if (validation.steps) {
    missingFields.push("at least one cooking step");
  }

  return missingFields;
}
