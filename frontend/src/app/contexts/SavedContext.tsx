"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SavedRecipe {
  _id: string;
  id?: string;
  title: string;
  description: string;
  servings: number;
  image?: string;
  ingredients: Array<{
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
}

interface MealPlan {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  recipes: SavedRecipe[];
  createdAt: string;
  updatedAt: string;
}

interface SavedContextType {
  // Favorites/Saved Recipes
  savedRecipes: SavedRecipe[];
  loadingSaved: boolean;
  errorSaved: string | null;
  fetchSaved: (userId: string) => Promise<void>;
  addFavorite: (userId: string, recipeId: string) => Promise<void>;
  removeFavorite: (userId: string, recipeId: string) => Promise<void>;
  savedCount: number;
  isSaved: (recipeId: string) => boolean;

  // Meal Plans
  mealPlans: MealPlan[];
  loadingPlans: boolean;
  errorPlans: string | null;
  fetchMealPlans: (userId: string) => Promise<void>;
  createMealPlan: (userId: string, name?: string) => Promise<MealPlan>;
  renameMealPlan: (planId: string, newName: string) => Promise<MealPlan>;
  deleteMealPlan: (planId: string) => Promise<void>;
  addRecipeToMealPlan: (planId: string, recipeId: string) => Promise<MealPlan>;
  removeRecipeFromMealPlan: (planId: string, recipeId: string) => Promise<MealPlan>;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export function SavedProvider({ children }: { children: ReactNode }) {
  // Saved Recipes state
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [errorSaved, setErrorSaved] = useState<string | null>(null);

  // Meal Plans state
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [errorPlans, setErrorPlans] = useState<string | null>(null);

  // =========================
  // Saved Recipes Functions
  // =========================
  const fetchSaved = async (userId: string) => {
    if (!userId) {
      setSavedRecipes([]);
      return;
    }

    setLoadingSaved(true);
    setErrorSaved(null);
    try {
      const response = await fetch(`/api/favorites?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      const data = await response.json();
      setSavedRecipes(data.favorites.recipes || []);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setErrorSaved(err.message);
      setSavedRecipes([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  const addFavorite = async (userId: string, recipeId: string) => {
    try {
      const response = await fetch(`/api/favorites/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add favorite");
      }

      const data = await response.json();
      setSavedRecipes(data.favorites.recipes || []);
    } catch (err: any) {
      console.error("Error adding favorite:", err);
      setErrorSaved(err.message);
    }
  };

  const removeFavorite = async (userId: string, recipeId: string) => {
    try {
      const response = await fetch(`/api/favorites/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }

      const data = await response.json();
      setSavedRecipes(data.favorites.recipes || []);
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      setErrorSaved(err.message);
    }
  };

  const isSaved = (recipeId: string) => {
    return savedRecipes.some((r) => (r._id || r.id) === recipeId);
  };

  // =========================
  // Meal Plans Functions
  // =========================
  const fetchMealPlans = async (userId: string) => {
    if (!userId) {
      setMealPlans([]);
      return;
    }

    setLoadingPlans(true);
    setErrorPlans(null);
    try {
      const response = await fetch(`/api/meal-plans?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meal plans");
      }
      const data = await response.json();
      setMealPlans(data.plans || []);
    } catch (err: any) {
      console.error("Error fetching meal plans:", err);
      setErrorPlans(err.message);
      setMealPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const createMealPlan = async (userId: string, name?: string): Promise<MealPlan> => {
    try {
      const response = await fetch(`/api/meal-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meal plan");
      }

      const data = await response.json();
      setMealPlans([data.plan, ...mealPlans]);
      return data.plan;
    } catch (err: any) {
      console.error("Error creating meal plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const renameMealPlan = async (planId: string, newName: string): Promise<MealPlan> => {
    try {
      const response = await fetch(`/api/meal-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename meal plan");
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error renaming meal plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const deleteMealPlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/meal-plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete meal plan");
      }

      setMealPlans(mealPlans.filter((plan) => plan._id !== planId));
    } catch (err: any) {
      console.error("Error deleting meal plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const addRecipeToMealPlan = async (planId: string, recipeId: string): Promise<MealPlan> => {
    try {
      const response = await fetch(`/api/meal-plans/${planId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add recipe to meal plan");
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error adding recipe to meal plan:", err);
      setErrorPlans(err.message);
      throw err;
    }
  };

  const removeRecipeFromMealPlan = async (
    planId: string,
    recipeId: string
  ): Promise<MealPlan> => {
    try {
      const response = await fetch(`/api/meal-plans/${planId}/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove recipe from meal plan");
      }

      const data = await response.json();
      setMealPlans(
        mealPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error removing recipe from meal plan:", err);
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
        // Meal Plans
        mealPlans,
        loadingPlans,
        errorPlans,
        fetchMealPlans,
        createMealPlan,
        renameMealPlan,
        deleteMealPlan,
        addRecipeToMealPlan,
        removeRecipeFromMealPlan,
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
