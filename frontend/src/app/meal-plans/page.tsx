"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConfirmDialog } from "../components/ConfirmDialogProvider";
import { useSaved } from "../contexts/SavedContext";
import { useQuickCreateMeal } from "../hooks/useQuickCreateMeal";
import { getMealDisplayName } from "../utils/planDisplay";
import styles from "./page.module.css";

export default function MealPlansPage() {
  const {
    mealPlans,
    loadingPlans,
    fetchMealPlans,
    deleteMealPlan,
  } = useSaved();
  const { creatingMeal, createAndOpenMeal } = useQuickCreateMeal();
  const { confirm, notify } = useConfirmDialog();
  const getEntryKind = (plan: { kind?: "mealPlan" | "meal" }) => (plan.kind === "meal" ? "meal" : "mealPlan");
  
  useEffect(() => {
    fetchMealPlans();
  }, []);

  const handleDeletePlan = async (planId: string) => {
    if (!(await confirm({
      title: "Delete plan",
      message: "Move this plan to Trash for 7 days?",
      intent: "danger",
      confirmText: "Delete",
    }))) return;

    try {
      await deleteMealPlan(planId);
    } catch (error) {
      console.error("Failed to move plan to trash:", error);
      await notify({
        title: "Delete failed",
        message: "Failed to move this plan to Trash.",
        intent: "danger",
      });
    }
  };

  const loading = loadingPlans;
  const visibleMealPlans = mealPlans.filter((plan) => getEntryKind(plan) === "meal");
  const hasPlans = visibleMealPlans.length > 0;
  const getPlanRecipeCount = (plan: any) => {
    const scheduledCount = (plan.days || []).reduce((total: number, day: any) => {
      return total + (day.meals || []).reduce((mealTotal: number, meal: any) => mealTotal + (meal.recipes?.length || 0), 0);
    }, 0);
    return scheduledCount || plan.recipes?.length || 0;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Meals</p>
          <h1>Meals</h1>
          <p className={styles.headerMeta}>Create and collect recipe combinations as reusable meals.</p>
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
      ) : !hasPlans ? (
        <div className={styles.empty}>
          <p>No meals yet</p>
        </div>
      ) : (
        <>
          {visibleMealPlans.length > 0 && (
            <section>
              <div className={styles.toolbarRow}>
                <div className={styles.count}>{`${visibleMealPlans.length} meals`}</div>
              </div>
              <div className={styles.planList}>
                {visibleMealPlans.map((plan) => (
                  <Link key={plan._id} href={`/meal-plans/${plan._id}`} className={styles.planCard}>
                    <div>
                      <h3>{getMealDisplayName(plan.name)}</h3>
                      {getEntryKind(plan) === "meal" ? (
                        <>
                          <p>{plan.people.length} people | Meal</p>
                          <p>{getPlanRecipeCount(plan)} recipes selected</p>
                        </>
                      ) : (
                        <>
                          <p>
                            {plan.people.length} people | {plan.numberOfDays} days | {(plan.mealTypes || []).join(", ")}
                          </p>
                          <p>
                            {plan.totalMealsNeeded} planned meals | {getPlanRecipeCount(plan)} recipes planned
                          </p>
                        </>
                      )}
                    </div>
                    <div className={styles.planActions}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePlan(plan._id);
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
