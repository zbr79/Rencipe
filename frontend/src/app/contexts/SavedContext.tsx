"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";

export interface SavedRecipe {
  _id: string;
  id: string;
  title: string;
  description: string;
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

export interface MealPlan {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  people: Person[];
  numberOfDays: number;
  mealTypes: ('lunch' | 'dinner')[];
  totalMealsNeeded: number;
  recipes?: unknown[];
  combinations: MealCombination[];
  checkedIngredients: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MealSlot {
  recipeIds: string[];
}

export interface DayPlan {
  dayOfWeek: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

export interface WeeklyPlan {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  days: DayPlan[];
  breakfastEnabled: boolean;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
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
  createMealPlan: (userId: string, numberOfPeople: number, numberOfDays: number, mealTypes: ('lunch' | 'dinner')[], name?: string) => Promise<MealPlan>;
  renameMealPlan: (planId: string, newName: string) => Promise<MealPlan>;
  deleteMealPlan: (planId: string) => Promise<void>;
  addRecipeToMealPlan: (planId: string, recipeId: string) => Promise<MealPlan>;
  addMealCombination: (planId: string, meatRecipeId: string, vegeRecipeId: string, sideRecipeId: string, portions: number) => Promise<MealPlan>;
  removeMealCombination: (planId: string, index: number) => Promise<MealPlan>;

  // Weekly Plans
  weeklyPlans: WeeklyPlan[];
  loadingWeeklyPlans: boolean;
  errorWeeklyPlans: string | null;
  fetchWeeklyPlans: (userId: string) => Promise<void>;
  createWeeklyPlan: (userId: string, name?: string, mealTypes?: ('breakfast' | 'lunch' | 'dinner')[]) => Promise<WeeklyPlan>;
  renameWeeklyPlan: (planId: string, newName: string) => Promise<WeeklyPlan>;
  updateWeeklyPlanSettings: (planId: string, mealTypes: ('breakfast' | 'lunch' | 'dinner')[]) => Promise<WeeklyPlan>;
  deleteWeeklyPlan: (planId: string) => Promise<void>;
  updateMealSlot: (planId: string, dayOfWeek: string, mealType: 'breakfast' | 'lunch' | 'dinner', recipeId: string | null, index?: number) => Promise<WeeklyPlan>;
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

  // Weekly Plans state
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [loadingWeeklyPlans, setLoadingWeeklyPlans] = useState(false);
  const [errorWeeklyPlans, setErrorWeeklyPlans] = useState<string | null>(null);

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
      const recipes = (data.favorites.recipes || []) as SavedRecipe[];
      // Enrich with mock images
      const enrichedRecipes = enrichRecipesWithMockImages(recipes);
      setSavedRecipes(enrichedRecipes);
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
      const recipes = (data.favorites.recipes || []) as SavedRecipe[];
      // Enrich with mock images
      const enrichedRecipes = enrichRecipesWithMockImages(recipes);
      setSavedRecipes(enrichedRecipes);
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
      const recipes = (data.favorites.recipes || []) as SavedRecipe[];
      // Enrich with mock images
      const enrichedRecipes = enrichRecipesWithMockImages(recipes);
      setSavedRecipes(enrichedRecipes);
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

  const createMealPlan = async (userId: string, numberOfPeople: number, numberOfDays: number, mealTypes: ('lunch' | 'dinner')[], name?: string): Promise<MealPlan> => {
    try {
      const response = await fetch(`/api/meal-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, numberOfPeople, numberOfDays, mealTypes, name }),
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

  const addMealCombination = async (planId: string, meatRecipeId: string, vegeRecipeId: string, sideRecipeId: string, portions: number): Promise<MealPlan> => {
    try {
      console.log("Adding combination with:", { meatRecipeId, vegeRecipeId, sideRecipeId, portions });
      const response = await fetch(`/api/meal-plans/${planId}/combinations`, {
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
      const response = await fetch(`/api/meal-plans/${planId}/combinations/${index}`, {
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

  // =========================
  // Weekly Plans Functions
  // =========================
  const fetchWeeklyPlans = async (userId: string) => {
    if (!userId) {
      setWeeklyPlans([]);
      return;
    }

    setLoadingWeeklyPlans(true);
    setErrorWeeklyPlans(null);
    try {
      const response = await fetch(`/api/weekly-plans?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch weekly plans");
      }
      const data = await response.json();
      setWeeklyPlans(data.plans || []);
    } catch (err: any) {
      console.error("Error fetching weekly plans:", err);
      setErrorWeeklyPlans(err.message);
      setWeeklyPlans([]);
    } finally {
      setLoadingWeeklyPlans(false);
    }
  };

  const createWeeklyPlan = async (userId: string, name?: string, mealTypes?: ('breakfast' | 'lunch' | 'dinner')[]): Promise<WeeklyPlan> => {
    try {
      const response = await fetch(`/api/weekly-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, mealTypes: mealTypes || ['breakfast', 'lunch', 'dinner'] }),
      });

      if (!response.ok) {
        throw new Error("Failed to create weekly plan");
      }

      const data = await response.json();
      setWeeklyPlans([data.plan, ...weeklyPlans]);
      return data.plan;
    } catch (err: any) {
      console.error("Error creating weekly plan:", err);
      setErrorWeeklyPlans(err.message);
      throw err;
    }
  };

  const renameWeeklyPlan = async (planId: string, newName: string): Promise<WeeklyPlan> => {
    try {
      const response = await fetch(`/api/weekly-plans/${planId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename weekly plan");
      }

      const data = await response.json();
      setWeeklyPlans(
        weeklyPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error renaming weekly plan:", err);
      setErrorWeeklyPlans(err.message);
      throw err;
    }
  };

  const updateWeeklyPlanSettings = async (planId: string, mealTypes: ('breakfast' | 'lunch' | 'dinner')[]): Promise<WeeklyPlan> => {
    try {
      const response = await fetch(`/api/weekly-plans/${planId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealTypes }),
      });

      if (!response.ok) {
        throw new Error("Failed to update weekly plan settings");
      }

      const data = await response.json();
      setWeeklyPlans(
        weeklyPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error updating weekly plan settings:", err);
      setErrorWeeklyPlans(err.message);
      throw err;
    }
  };

  const deleteWeeklyPlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/weekly-plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete weekly plan");
      }

      setWeeklyPlans(weeklyPlans.filter((plan) => plan._id !== planId));
    } catch (err: any) {
      console.error("Error deleting weekly plan:", err);
      setErrorWeeklyPlans(err.message);
      throw err;
    }
  };

  const updateMealSlot = async (planId: string, dayOfWeek: string, mealType: 'breakfast' | 'lunch' | 'dinner', recipeId: string | null, index?: number): Promise<WeeklyPlan> => {
    try {
      const response = await fetch(`/api/weekly-plans/${planId}/meals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, mealType, recipeId, index }),
      });

      if (!response.ok) {
        throw new Error("Failed to update meal slot");
      }

      const data = await response.json();
      setWeeklyPlans(
        weeklyPlans.map((plan) => (plan._id === planId ? data.plan : plan))
      );
      return data.plan;
    } catch (err: any) {
      console.error("Error updating meal slot:", err);
      setErrorWeeklyPlans(err.message);
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
        addMealCombination,
        removeMealCombination,
        // Weekly Plans
        weeklyPlans,
        loadingWeeklyPlans,
        errorWeeklyPlans,
        fetchWeeklyPlans,
        createWeeklyPlan,
        renameWeeklyPlan,
        updateWeeklyPlanSettings,
        deleteWeeklyPlan,
        updateMealSlot,
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
