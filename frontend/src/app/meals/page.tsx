"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConfirmDialog } from "../components/ConfirmDialogProvider";
import { useSaved } from "../contexts/SavedContext";
import { useQuickCreateMeal } from "../hooks/useQuickCreateMeal";
import { getMealDisplayName } from "../utils/mealDisplay";
import styles from "./page.module.css";

export default function MealsPage() {
  const {
    meals,
    loadingMeals,
    fetchMeals,
    deleteMeal,
  } = useSaved();
  const { creatingMeal, createAndOpenMeal } = useQuickCreateMeal();
  const { confirm, notify } = useConfirmDialog();

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleDeleteMeal = async (mealId: string) => {
    if (!(await confirm({
      title: "Delete meal",
      message: "Move this meal to Trash for 7 days?",
      intent: "danger",
      confirmText: "Delete",
    }))) return;

    try {
      await deleteMeal(mealId);
    } catch (error) {
      console.error("Failed to move meal to trash:", error);
      await notify({
        title: "Delete failed",
        message: "Failed to move this meal to Trash.",
        intent: "danger",
      });
    }
  };

  const loading = loadingMeals;
  const visibleMeals = meals.filter((meal) => meal.kind === "meal");
  const hasMeals = visibleMeals.length > 0;
  const getMealRecipeCount = (meal: any) => {
    const scheduledCount = (meal.days || []).reduce((total: number, day: any) => {
      return total + (day.meals || []).reduce((mealTotal: number, meal: any) => mealTotal + (meal.recipes?.length || 0), 0);
    }, 0);
    return scheduledCount || meal.recipes?.length || 0;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Meals</p>
          <h1>Meals</h1>
          <p className={styles.headerMeta}>Create and collect recipe sets as reusable meals.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.createButton} onClick={() => createAndOpenMeal()} disabled={creatingMeal}>
            <span className="material-symbols-outlined">add</span>
            {creatingMeal ? "Creating Meal..." : "New Meal"}
          </button>
        </div>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : !hasMeals ? (
        <div className={styles.empty}>
          <p>No meals yet</p>
        </div>
      ) : (
        <>
          {visibleMeals.length > 0 && (
            <section>
              <div className={styles.toolbarRow}>
                <div className={styles.count}>{`${visibleMeals.length} meals`}</div>
              </div>
              <div className={styles.mealList}>
                {visibleMeals.map((meal) => (
                  <Link key={meal._id} href={`/meals/${meal._id}`} className={styles.mealCard}>
                    <div>
                      <h3>{getMealDisplayName(meal.name)}</h3>
                      <p>{meal.people.length} people | Meal</p>
                      <p>{getMealRecipeCount(meal)} recipes selected</p>
                    </div>
                    <div className={styles.mealActions}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteMeal(meal._id);
                        }}
                        className={styles.dangerButton}
                      >
                        Delete
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </>
      )}
    </div>
  );
}
