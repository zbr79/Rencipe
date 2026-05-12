"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toastError } from "../components/toast/toast";
import { useSaved, type MealPlanMealType } from "../contexts/SavedContext";

type QuickCreateKind = "mealPlan" | "meal";

interface QuickCreateTemplate {
  name: string;
  numberOfPeople: number;
  numberOfDays?: number;
  mealTypes?: MealPlanMealType[];
}

const DEFAULT_MEAL_PLAN_TEMPLATE: QuickCreateTemplate = {
  name: "New Plan",
  numberOfPeople: 2,
  numberOfDays: 3,
  mealTypes: ["dinner"],
};

const DEFAULT_MEAL_TEMPLATE: QuickCreateTemplate = {
  name: "New Meal",
  numberOfPeople: 2,
};

const CREATE_FAILURE_MESSAGE: Record<QuickCreateKind, string> = {
  mealPlan: "Could not create meal plan",
  meal: "Could not create meal",
};

interface QuickCreateMealPlanOptions {
  afterSuccess?: () => void;
}

export function useQuickCreateMealPlan() {
  const router = useRouter();
  const { createMealPlan } = useSaved();
  const [creatingKind, setCreatingKind] = useState<QuickCreateKind | null>(null);

  const createFromTemplate = async (template: QuickCreateTemplate, kind: QuickCreateKind, options?: QuickCreateMealPlanOptions) => {
    if (creatingKind) return null;

    setCreatingKind(kind);
    try {
      const plan = await createMealPlan({
        kind,
        numberOfPeople: template.numberOfPeople,
        numberOfDays: template.numberOfDays,
        mealTypes: template.mealTypes ? [...template.mealTypes] : undefined,
        name: template.name,
      });
      options?.afterSuccess?.();
      router.push(`/meal-plans/${plan._id}`);
      return plan;
    } catch (error: any) {
      toastError(error?.message || CREATE_FAILURE_MESSAGE[kind]);
      return null;
    } finally {
      setCreatingKind(null);
    }
  };

  const createAndOpenMealPlan = async (options?: QuickCreateMealPlanOptions) => {
    return createFromTemplate(DEFAULT_MEAL_PLAN_TEMPLATE, "mealPlan", options);
  };

  const createAndOpenMeal = async (options?: QuickCreateMealPlanOptions) => {
    return createFromTemplate(DEFAULT_MEAL_TEMPLATE, "meal", options);
  };

  return {
    creatingMealPlan: creatingKind === "mealPlan",
    creatingMeal: creatingKind === "meal",
    isCreatingAny: creatingKind !== null,
    createAndOpenMealPlan,
    createAndOpenMeal,
  };
}