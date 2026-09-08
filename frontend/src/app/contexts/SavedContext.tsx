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

export type MealEntryKind = "meal";

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface ScheduledMeal {
  mealType: MealType;
  recipes: SavedRecipe[];
}

export interface MealDay {
  dayNumber: number;
  meals: ScheduledMeal[];
}

export interface Meal {
  _id: string;
  id?: string;
  kind?: MealEntryKind;
  userId: string | AccountIdentity;
  name: string;
  people: Person[];
  numberOfDays?: number;
  mealTypes?: MealType[];
  totalMealsNeeded?: number;
  days?: MealDay[];
  recipes?: SavedRecipe[];
  isPublic?: boolean;
  views?: number;
  deletedAt?: string | null;
  trashExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealInput {
  userId?: string;
  kind?: MealEntryKind;
  numberOfPeople: number;
  numberOfDays?: number;
  mealTypes?: MealType[];
  name?: string;
  people?: Person[];
  recipes?: string[];
  isPublic?: boolean;
}

interface SavedContextType {
  savedRecipes: SavedRecipe[];
  loadingSaved: boolean;
  errorSaved: string | null;
  fetchSaved: (userId?: string) => Promise<void>;
  saveRecipe: (userId: string | undefined, recipeId: string) => Promise<void>;
  unsaveRecipe: (userId: string | undefined, recipeId: string) => Promise<void>;
  savedCount: number;
  isSaved: (recipeId: string) => boolean;
  savedMeals: Meal[];
  saveMeal: (userId: string | undefined, mealId: string) => Promise<void>;
  unsaveMeal: (userId: string | undefined, mealId: string) => Promise<void>;
  isMealSaved: (mealId: string) => boolean;

  meals: Meal[];
  loadingMeals: boolean;
  errorMeals: string | null;
  fetchMeals: (userId?: string) => Promise<void>;
  createMeal: (input: CreateMealInput) => Promise<Meal>;
  renameMeal: (mealId: string, newName: string) => Promise<Meal>;
  deleteMeal: (mealId: string) => Promise<void>;
  addRecipeToMeal: (mealId: string, recipeId: string) => Promise<Meal>;

}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedMeals, setSavedMeals] = useState<Meal[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [errorSaved, setErrorSaved] = useState<string | null>(null);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);

  const resolveUserId = (userId?: string) => getCurrentUserId() || userId || "";

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
        throw new Error("Failed to fetch saved items");
      }
      const data = await response.json();
      const saved = data.saved || {};
      const recipes = filterRecipesForUserLanguage((saved.recipes || []) as SavedRecipe[], getCurrentUser());
      setSavedRecipes(recipes);
      setSavedMeals((saved.meals || []) as Meal[]);
    } catch (err: any) {
      console.error("Error fetching saved items:", err);
      setErrorSaved(err.message);
      setSavedRecipes([]);
      setSavedMeals([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  const saveRecipe = async (userId: string | undefined, recipeId: string) => {
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
        throw new Error("Failed to save recipe");
      }

      const data = await response.json();
      const saved = data.saved || {};
      const recipes = filterRecipesForUserLanguage((saved.recipes || []) as SavedRecipe[], getCurrentUser());
      setSavedRecipes(recipes);
      setSavedMeals((saved.meals || []) as Meal[]);
      toastSuccess("Saved recipe");
    } catch (err: any) {
      console.error("Error saving recipe:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not save recipe");
    }
  };

  const unsaveRecipe = async (userId: string | undefined, recipeId: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) return;

    try {
      const response = await authFetch(`/api/saved/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsave recipe");
      }

      const data = await response.json();
      const saved = data.saved || {};
      const recipes = filterRecipesForUserLanguage((saved.recipes || []) as SavedRecipe[], getCurrentUser());
      setSavedRecipes(recipes);
      setSavedMeals((saved.meals || []) as Meal[]);
      toastSuccess("Unsaved recipe");
    } catch (err: any) {
      console.error("Error unsaving recipe:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not unsave recipe");
    }
  };

  const isSaved = (recipeId: string) => {
    return savedRecipes.some((r) => (r._id || r.id) === recipeId);
  };

  const saveMeal = async (userId: string | undefined, mealId: string) => {
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
      const saved = data.saved || {};
      setSavedMeals((saved.meals || []) as Meal[]);
      toastSuccess("Saved meal");
    } catch (err: any) {
      console.error("Error saving meal:", err);
      setErrorSaved(err.message);
      toastError(err.message || "Could not save meal");
    }
  };

  const unsaveMeal = async (userId: string | undefined, mealId: string) => {
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
      const saved = data.saved || {};
      setSavedMeals((saved.meals || []) as Meal[]);
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

  const fetchMeals = async (userId?: string) => {
    const accountId = resolveUserId(userId);
    if (!accountId) {
      setMeals([]);
      return;
    }

    setLoadingMeals(true);
    setErrorMeals(null);
    try {
      const response = await authFetch(`/api/meals?userId=${accountId}&kind=meal`);
      if (!response.ok) {
        throw new Error("Failed to fetch meals");
      }
      const data = await response.json();
      setMeals(data.meals || []);
    } catch (err: any) {
      console.error("Error fetching meals:", err);
      setErrorMeals(err.message);
      setMeals([]);
    } finally {
      setLoadingMeals(false);
    }
  };

  const createMeal = async ({ userId, kind = "meal", numberOfPeople, numberOfDays, mealTypes, name, people, recipes, isPublic }: CreateMealInput): Promise<Meal> => {
    if (kind !== "meal") {
      throw new Error("Only meals are currently supported");
    }

    const accountId = resolveUserId(userId);
    if (!accountId) throw new Error("Sign in before creating a meal");

    try {
      const response = await authFetch(`/api/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: accountId, kind, numberOfPeople, numberOfDays, mealTypes, name, people, recipes, isPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create meal");
      }

      const data = await response.json();
      setMeals([data.meal, ...meals]);
      return data.meal;
    } catch (err: any) {
      console.error("Error creating meal:", err);
      setErrorMeals(err.message);
      throw err;
    }
  };

  const renameMeal = async (mealId: string, newName: string): Promise<Meal> => {
    try {
      const response = await authFetch(`/api/meals/${mealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename meal");
      }

      const data = await response.json();
      setMeals(
        meals.map((meal) => (meal._id === mealId ? data.meal : meal))
      );
      return data.meal;
    } catch (err: any) {
      console.error("Error renaming meal:", err);
      setErrorMeals(err.message);
      throw err;
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      const response = await authFetch(`/api/meals/${mealId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to move meal to trash");
      }

      setMeals(meals.filter((meal) => meal._id !== mealId));
      toastSuccess("Moved to Trash");
    } catch (err: any) {
      console.error("Error deleting meal:", err);
      setErrorMeals(err.message);
      throw err;
    }
  };

  const addRecipeToMeal = async (mealId: string, recipeId: string): Promise<Meal> => {
    try {
      const response = await authFetch(`/api/meals/${mealId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add recipe to meal");
      }

      const data = await response.json();
      setMeals(
        meals.map((meal) => (meal._id === mealId ? data.meal : meal))
      );
      return data.meal;
    } catch (err: any) {
      console.error("Error adding recipe to meal:", err);
      setErrorMeals(err.message);
      throw err;
    }
  };

  return (
    <SavedContext.Provider
      value={{
        savedRecipes,
        loadingSaved,
        errorSaved,
        fetchSaved,
        saveRecipe,
        unsaveRecipe,
        savedCount: savedRecipes.length,
        isSaved,
        savedMeals,
        saveMeal,
        unsaveMeal,
        isMealSaved,
        meals,
        loadingMeals,
        errorMeals,
        fetchMeals,
        createMeal,
        renameMeal,
        deleteMeal,
        addRecipeToMeal,
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
