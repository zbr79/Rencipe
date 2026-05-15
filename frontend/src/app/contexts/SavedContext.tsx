"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { toastError, toastSuccess } from "../components/toast/toast";
import { authFetch, getCurrentUser, getCurrentUserId } from "../utils/authSession";
import { filterRecipesForUserLanguage, type RecipeLanguage } from "../utils/recipeLanguage";
import type { AccountIdentity } from "../utils/accountAvatar";

export interface SavedRecipe {
  _id: string;
  id: string;
  title: string;
  description: string;
  language?: RecipeLanguage;
  author?: AccountIdentity | null;
  authorId?: string | AccountIdentity | null;
  component: boolean;
  servings: number;
  image?: string;
  mainIngredients: Array<{
    name: string;
    quantity: string;
  }>;
  seasonings: Array<{
    name: string;
    quantity: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    image?: string;
  }>;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  trashExpiresAt?: string | null;
}

export interface Person {
  name: string;
  modifier: number;
}

export interface MealCombination {
  meatRecipeId: SavedRecipe;
  vegeRecipeId: SavedRecipe;
  sideRecipeId: SavedRecipe;
  portions: number;
}

export type MealEntryKind = "mealPlan" | "meal";

export type MealPlanMealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanMeal {
  mealType: MealPlanMealType;
  recipes: SavedRecipe[];
}

export interface MealPlanDay {
  dayNumber: number;
  meals: MealPlanMeal[];
}

export interface MealPlan {
  _id: string;
  id?: string;
  kind?: MealEntryKind;
  userId: string | AccountIdentity;
  name: string;
  people: Person[];
  numberOfDays?: number;
  mealTypes?: MealPlanMealType[];
  totalMealsNeeded?: number;
  days?: MealPlanDay[];
  recipes?: SavedRecipe[];
  combinations: MealCombination[];
  checkedIngredients: string[];
  isPublic?: boolean;
  views?: number;
  deletedAt?: string | null;
  trashExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealPlanInput {
  userId?: string;
  kind?: MealEntryKind;
  numberOfPeople: number;
  numberOfDays?: number;
  mealTypes?: MealPlanMealType[];
  name?: string;
  people?: Person[];
  recipes?: string[];
  isPublic?: boolean;
}

interface SavedContextType {
  // Favorites/Saved Recipes
  savedRecipes: SavedRecipe[];
  loadingSaved: boolean;
  errorSaved: string | null;
  fetchSaved: (userId?: string) => Promise<void>;
  addFavorite: (userId: string | undefined, recipeId: string) => Promise<void>;
  removeFavorite: (userId: string | undefined, recipeId: string) => Promise<void>;
  savedCount: number;
  isSaved: (recipeId: string) => boolean;
  savedMeals: MealPlan[];
  addFavoriteMeal: (userId: string | undefined, mealId: string) => Promise<void>;
  removeFavoriteMeal: (userId: string | undefined, mealId: string) => Promise<void>;
  isMealSaved: (mealId: string) => boolean;

  // Plans
  mealPlans: MealPlan[];
  loadingPlans: boolean;
  errorPlans: string | null;
  fetchMealPlans: (userId?: string) => Promise<void>;
  createMealPlan: (input: CreateMealPlanInput) => Promise<MealPlan>;
  renameMealPlan: (planId: string, newName: string) => Promise<MealPlan>;
  deleteMealPlan: (planId: string) => Promise<void>;
  addRecipeToMealPlan: (planId: string, recipeId: string) => Promise<MealPlan>;
  addMealCombination: (planId: string, meatRecipeId: string, vegeRecipeId: string, sideRecipeId: string, portions: number) => Promise<MealPlan>;
  removeMealCombination: (planId: string, index: number) => Promise<MealPlan>;

}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export function SavedProvider({ children }: { children: ReactNode }) {
  // Saved Recipes state
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedMeals, setSavedMeals] = useState<MealPlan[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [errorSaved, setErrorSaved] = useState<string | null>(null);

  // Plans state
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [errorPlans, setErrorPlans] = useState<string | null>(null);

  const resolveUserId = (userId?: string) => getCurrentUserId() || userId || "";

  // =========================
  // Saved Recipes Functions
  // =========================
  const fetchSaved = async (userId?: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) {
      setSavedRecipes([]);
      setSavedMeals([]);
      return;
    }

    setLoadingSaved(true);
    setErrorSaved(null);
    try {
      const response = await authFetch(`/api/saved?userId=${accountId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      const data = await response.json();
      const saved = data.saved || data.favorites || {};
      const recipes = filterRecipesForUserLanguage((saved.recipes || []) as SavedRecipe[], getCurrentUser());
      setSavedRecipes(recipes);
      setSavedMeals((saved.meals || []) as MealPlan[]);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setErrorSaved(err.message);
      setSavedRecipes([]);
      setSavedMeals([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  const addFavorite = async (userId: string | undefined, recipeId: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) {
      toastError("Sign in before saving recipes");
      return;
    }

    try {
      const response = await authFetch(`/api/saved/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add favorite");
      }

      const data = await response.json();
      const saved = data.saved || data.favorites || {};
      const recipes = filterRecipesForUserLanguage((saved.recipes || []) as SavedRecipe[], getCurrentUser());
      setSavedRecipes(recipes);
      setSavedMeals((saved.meals || []) as MealPlan[]);
      toastSuccess("Saved recipe");
    } catch (err: any) {
      console.error("Error adding favorite:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not save recipe");
    }
  };

  const removeFavorite = async (userId: string | undefined, recipeId: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) return;

    try {
      const response = await authFetch(`/api/saved/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }

      const data = await response.json();
      const saved = data.saved || data.favorites || {};
      const recipes = filterRecipesForUserLanguage((saved.recipes || []) as SavedRecipe[], getCurrentUser());
      setSavedRecipes(recipes);
      setSavedMeals((saved.meals || []) as MealPlan[]);
      toastSuccess("Unsaved recipe");
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not unsave recipe");
    }
  };

  const isSaved = (recipeId: string) => {
    return savedRecipes.some((r) => (r._id || r.id) === recipeId);
  };

  const addFavoriteMeal = async (userId: string | undefined, mealId: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) {
      toastError("Sign in before saving meals");
      return;
    }

    try {
      const response = await authFetch(`/api/saved/meals/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, mealId }),
      });

      if (!response.ok) {
        throw new Error("Failed to save meal");
      }

      const data = await response.json();
      const saved = data.saved || data.favorites || {};
      setSavedMeals((saved.meals || []) as MealPlan[]);
      toastSuccess("Saved meal");
    } catch (err: any) {
      console.error("Error saving meal:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not save meal");
    }
  };

  const removeFavoriteMeal = async (userId: string | undefined, mealId: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) return;

    try {
      const response = await authFetch(`/api/saved/meals/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, mealId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsave meal");
      }

      const data = await response.json();
      const saved = data.saved || data.favorites || {};
      setSavedMeals((saved.meals || []) as MealPlan[]);
      toastSuccess("Unsaved meal");
    } catch (err: any) {
      console.error("Error unsaving meal:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not unsave meal");
    }
  };

  const isMealSaved = (mealId: string) => {
    return savedMeals.some((meal) => (meal._id || meal.id) === mealId);
  };

  // =========================
  // Plans Functions
  // =========================
  const fetchMealPlans = async (userId?: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) {
      setMealPlans([]);
      return;
    }

    setLoadingPlans(true);
    setErrorPlans(null);
    try {
      const response = await authFetch(`/api/meals?userId=${accountId}&kind=meal`);
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      const data = await response.json();
      setMealPlans(data.plans || []);
    } catch (err: any) {
      console.error("Error fetching plans:", err);
      setErrorPlans(err.message);
      setMealPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const createMealPlan = async ({ userId, kind = "meal", numberOfPeople, numberOfDays, mealTypes, name, people, recipes, isPublic }: CreateMealPlanInput): Promise<MealPlan> => {
    if (kind !== "meal") {
      throw new Error("Plans are currently disabled");
    }

    const accountId = resolveUserId(userId);
    if (!accountId) throw new Error(kind === "meal" ? "Sign in before creating a meal" : "Sign in before creating a plan");

    try {
      const response = await authFetch(`/api/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, kind, numberOfPeople, numberOfDays, mealTypes, name, people, recipes, isPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || (kind === "meal" ? "Failed to create meal" : "Failed to create plan"));
      }

      const data = await response.json();
      setMealPlans([data.plan, ...mealPlans]);
      return data.plan;
    } catch (err: any) {
      console.error("Error creating plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const renameMealPlan = async (planId: string, newName: string): Promise<MealPlan> => {
    try {
      const response = await authFetch(`/api/meals/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename plan");
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error renaming plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const deleteMealPlan = async (planId: string) => {
    try {
      const response = await authFetch(`/api/meals/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to move plan to trash");
      }

      setMealPlans(mealPlans.filter((plan) => plan._id !== planId));
      toastSuccess("Moved to Trash");
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const addRecipeToMealPlan = async (planId: string, recipeId: string): Promise<MealPlan> => {
    try {
      const response = await authFetch(`/api/meals/${planId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add recipe to plan");
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error adding recipe to plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const addMealCombination = async (planId: string, meatRecipeId: string, vegeRecipeId: string, sideRecipeId: string, portions: number): Promise<MealPlan> => {
    try {
      console.log("Adding combination with:", { meatRecipeId, vegeRecipeId, sideRecipeId, portions });
      const response = await authFetch(`/api/meals/${planId}/combinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meatRecipeId, vegeRecipeId, sideRecipeId, portions }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `API returned ${response.status}: ${response.statusText}`;
        console.error("Backend error:", errorMsg, errorData);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error adding meal combination:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const removeMealCombination = async (planId: string, index: number): Promise<MealPlan> => {
    try {
      const response = await authFetch(`/api/meals/${planId}/combinations/${index}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove meal combination");
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error removing meal combination:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  return (
    <SavedContext.Provider
      value={{
        // Saved Recipes
        savedRecipes,
        loadingSaved,
        errorSaved,
        fetchSaved,
        addFavorite,
        removeFavorite,
        savedCount: savedRecipes.length,
        isSaved,
        savedMeals,
        addFavoriteMeal,
        removeFavoriteMeal,
        isMealSaved,
        // Plans
        mealPlans,
        loadingPlans,
        errorPlans,
        fetchMealPlans,
        createMealPlan,
        renameMealPlan,
        deleteMealPlan,
        addRecipeToMealPlan,
        addMealCombination,
        removeMealCombination,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used within SavedProvider");
  }
  return context;
}
