"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
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
  
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchMealPlans(userId);
    fetchWeeklyPlans(userId);
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
  const hasPlans = mealPlans.length > 0 || weeklyPlans.length > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Meal Planning</p>
          <h1>Meal Plans</h1>
          <p className={styles.headerMeta}>Create reusable plans or schedule meals across the week.</p>
        </div>
        <Link href="/weekly-plans/create" className={styles.createButton}>
          <span className="material-symbols-outlined">calendar_month</span>
          New Scheduled Plan
        </Link>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : !hasPlans ? (
        <div className={styles.empty}>
          <p>No meal plans yet</p>
        </div>
      ) : (
        <>
          {mealPlans.length > 0 && (
            <section>
              <div className={styles.toolbarRow}>
                <div className={styles.count}>{mealPlans.length} meal plans</div>
              </div>
              <div className={styles.planList}>
                {mealPlans.map((plan) => (
                  <Link key={plan._id} href={`/meal-plans/${plan._id}`} className={styles.planCard}>
                    <div>
                      <h3>{getScheduledPlanDisplayName(plan.name)}</h3>
                      <p>
                        {plan.people.length} people | {plan.numberOfDays} days | {plan.mealTypes.join(", ")}
                      </p>
                      <p>
                        Needs {plan.totalMealsNeeded} meals | {plan.combinations.length} combinations set{Array.isArray(plan.recipes) && plan.recipes.length > 0 ? ` | ${plan.recipes.length} recipes` : ""}
                      </p>
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

          {weeklyPlans.length > 0 && (
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
                        {[plan.breakfastEnabled && "Breakfast", plan.lunchEnabled && "Lunch", plan.dinnerEnabled && "Dinner"].filter(Boolean).join(", ") || "No meal slots enabled"}
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
