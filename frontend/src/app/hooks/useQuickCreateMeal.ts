"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface QuickCreateMealOptions {
  afterSuccess?: () => void;
}

export function useQuickCreateMeal() {
  const router = useRouter();
  const [creatingMeal, setCreatingMeal] = useState(false);

  const createAndOpenMeal = async (options?: QuickCreateMealOptions) => {
    if (creatingMeal) return null;

    setCreatingMeal(true);
    try {
      options?.afterSuccess?.();
      router.push("/meal-plans/new#edit");
      return null;
    } finally {
      setCreatingMeal(false);
    }
  };

  return {
    creatingMeal,
    isCreatingAny: creatingMeal,
    createAndOpenMeal,
  };
}