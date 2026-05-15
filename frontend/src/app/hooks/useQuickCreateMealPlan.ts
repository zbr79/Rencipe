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

const DEFAULT_MEAL_TEMPLATE: QuickCreateTemplate = {
  name: "New Meal",
  numberOfPeople: 2,
};

const CREATE_FAILURE_MESSAGE: Record<QuickCreateKind, string> = {
  mealPlan: "Could not create plan",
  meal: "Could not create meal",
};
const PLANS_DISABLED_MESSAGE = "Plans are currently disabled";

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
      router.push(kind === "meal" ? `/meal-plans/${plan._id}#edit` : `/meal-plans/${plan._id}`);
      return plan;
    } catch (error: any) {
      toastError(error?.message || CREATE_FAILURE_MESSAGE[kind]);
      return null;
    } finally {
      setCreatingKind(null);
    }
  };

  const createAndOpenMealPlan = async (options?: QuickCreateMealPlanOptions) => {
    options?.afterSuccess?.();
    toastError(PLANS_DISABLED_MESSAGE);
    return null;
  };

  const createAndOpenMeal = async (options?: QuickCreateMealPlanOptions) => {
    if (creatingKind) return null;

    setCreatingKind("meal");
    try {
      options?.afterSuccess?.();
      router.push("/meal-plans/new#edit");
      return null;
    } finally {
      setCreatingKind(null);
    }
  };

  return {
    creatingMealPlan: false,
    creatingMeal: creatingKind === "meal",
    isCreatingAny: creatingKind !== null,
    createAndOpenMealPlan,
    createAndOpenMeal,
  };
}