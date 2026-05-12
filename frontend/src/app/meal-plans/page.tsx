"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSaved } from "../contexts/SavedContext";
import { useQuickCreateMealPlan } from "../hooks/useQuickCreateMealPlan";
import { getScheduledPlanDisplayName } from "../utils/planDisplay";
import styles from "../recipes/page.module.css";

export default function MealPlansPage() {
  const {
    mealPlans,
    weeklyPlans,
    loadingPlans,
    loadingWeeklyPlans,
    fetchMealPlans,
    fetchWeeklyPlans,
    deleteMealPlan,
    deleteWeeklyPlan,
  } = useSaved();
  const { creatingMealPlan, creatingMeal, createAndOpenMealPlan, createAndOpenMeal } = useQuickCreateMealPlan();
  const searchParams = useSearchParams();
  const kindFilter = searchParams.get("kind");
  const showMealsOnly = kindFilter === "meal";
  const getEntryKind = (plan: { kind?: "mealPlan" | "meal" }) => (plan.kind === "meal" ? "meal" : "mealPlan");
  
  useEffect(() => {
    fetchMealPlans();
    fetchWeeklyPlans();
  }, []);

  const handleDeletePlan = async (planId: string) => {
    if (confirm("Delete this plan?")) {
      try {
        await deleteMealPlan(planId);
      } catch (error) {
        console.error("Failed to delete plan:", error);
      }
    }
  };

  const handleDeleteScheduledPlan = async (planId: string) => {
    if (!confirm("Delete this scheduled meal plan?")) return;
    try {
      await deleteWeeklyPlan(planId);
    } catch (error) {
      console.error("Failed to delete scheduled meal plan:", error);
    }
  };

  const loading = loadingPlans || loadingWeeklyPlans;
  const visibleMealPlans = showMealsOnly ? mealPlans.filter((plan) => getEntryKind(plan) === "meal") : mealPlans;
  const hasPlans = showMealsOnly ? visibleMealPlans.length > 0 : mealPlans.length > 0 || weeklyPlans.length > 0;
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
          <p className={styles.kicker}>{showMealsOnly ? "Meals" : "Meal Planning"}</p>
          <h1>{showMealsOnly ? "Meals" : "Meal Plans"}</h1>
          <p className={styles.headerMeta}>{showMealsOnly ? "Create and collect recipe combinations as reusable meals." : "Create reusable plans or schedule meals across the week."}</p>
        </div>
        <button type="button" className={styles.createButton} onClick={() => showMealsOnly ? createAndOpenMeal() : createAndOpenMealPlan()} disabled={showMealsOnly ? creatingMeal : creatingMealPlan}>
          <span className="material-symbols-outlined">add</span>
          {showMealsOnly ? (creatingMeal ? "Creating Meal..." : "New Meal") : (creatingMealPlan ? "Creating Meal Plan..." : "New Meal Plan")}
        </button>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : !hasPlans ? (
        <div className={styles.empty}>
          <p>{showMealsOnly ? "No meals yet" : "No meal plans yet"}</p>
        </div>
      ) : (
        <>
          {visibleMealPlans.length > 0 && (
            <section>
              <div className={styles.toolbarRow}>
                <div className={styles.count}>{showMealsOnly ? `${visibleMealPlans.length} meals` : `${visibleMealPlans.length} meal entries`}</div>
              </div>
              <div className={styles.planList}>
                {visibleMealPlans.map((plan) => (
                  <Link key={plan._id} href={`/meal-plans/${plan._id}`} className={styles.planCard}>
                    <div>
                      <h3>{getScheduledPlanDisplayName(plan.name)}</h3>
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

          {!showMealsOnly && weeklyPlans.length > 0 && (
            <section className={styles.planSection}>
              <div className={styles.toolbarRow}>
                <div className={styles.count}>{weeklyPlans.length} scheduled plans</div>
              </div>
              <div className={styles.planList}>
                {weeklyPlans.map((plan) => (
                  <Link key={plan._id} href={`/weekly-plans/${plan._id}`} className={styles.planCard}>
                    <div>
                      <h3>{getScheduledPlanDisplayName(plan.name)}</h3>
                      <p>Calendar-style meal schedule</p>
                      <p>
                        {[plan.breakfastEnabled && "Breakfast", plan.lunchEnabled && "Lunch", plan.dinnerEnabled && "Dinner"].filter(Boolean).join(", ") || "No meals enabled"}
                      </p>
                    </div>
                    <div className={styles.planActions}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteScheduledPlan(plan._id);
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
