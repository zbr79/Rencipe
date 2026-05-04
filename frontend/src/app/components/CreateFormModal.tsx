"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import { useSaved } from "../contexts/SavedContext";
import styles from "./create-form-modal.module.css";

type MealType = "breakfast" | "lunch" | "dinner";

const mealTypeOptions: MealType[] = ["breakfast", "lunch", "dinner"];

export default function CreateFormModal() {
  const { isOpen, closeCreateForm, showMealPlanForm, setShowMealPlanForm } = useCreateForm();
  const { createMealPlan, fetchMealPlans } = useSaved();
  const router = useRouter();
  
  const [mealPlanState, setMealPlanState] = useState({
    numberOfPeople: 2,
    numberOfDays: 3,
    mealTypes: ["dinner"] as MealType[],
    name: "",
    loading: false,
    error: null as string | null,
  });
  const suggestedMealPlanName = "New Plan";

  const handleMealTypeToggle = (type: MealType) => {
    setMealPlanState((prev) => {
      const selected = new Set(prev.mealTypes);
      if (selected.has(type)) {
        selected.delete(type);
      } else {
        selected.add(type);
      }

      return {
        ...prev,
        mealTypes: mealTypeOptions.filter((option) => selected.has(option)),
      };
    });
  };

  const handleCreateMealPlan = async () => {
    if (mealPlanState.mealTypes.length === 0) {
      setMealPlanState((prev) => ({ ...prev, error: "Select at least one meal type" }));
      return;
    }

    setMealPlanState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const newPlan = await createMealPlan(
        undefined,
        mealPlanState.numberOfPeople,
        mealPlanState.numberOfDays,
        mealPlanState.mealTypes,
        mealPlanState.name || suggestedMealPlanName
      );

  await fetchMealPlans();
      closeCreateForm();
      router.push(`/meal-plans/${newPlan._id}`);
    } catch (err: any) {
      setMealPlanState((prev) => ({ ...prev, error: err.message }));
    } finally {
      setMealPlanState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!isOpen) return null;

  if (showMealPlanForm) {
    return (
      <div className={styles.modalOverlay} onClick={closeCreateForm}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button className={styles.closeBtn} onClick={() => { setShowMealPlanForm(false); closeCreateForm(); }}>✕</button>
          <div className={`${styles.formContainer} ${styles.mealPlanForm}`}>
            <h1 className={styles.menuTitle}>New Meal Plan</h1>
            {mealPlanState.error && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {mealPlanState.error}
              </div>
            )}
            <label className={styles.mealPlanField}>
              <span>Name</span>
              <input
                type="text"
                value={mealPlanState.name}
                onChange={(event) => setMealPlanState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={suggestedMealPlanName}
              />
            </label>

            <div className={styles.mealPlanInlineRow}>
              <label className={styles.mealPlanField}>
                <span>People</span>
                <input
                  type="number"
                  min="1"
                  value={mealPlanState.numberOfPeople}
                  onChange={(event) => setMealPlanState((prev) => ({ ...prev, numberOfPeople: Math.max(1, parseInt(event.target.value) || 1) }))}
                />
              </label>
              <label className={styles.mealPlanField}>
                <span>Days</span>
                <input
                  type="number"
                  min="1"
                  value={mealPlanState.numberOfDays}
                  onChange={(event) => setMealPlanState((prev) => ({ ...prev, numberOfDays: Math.max(1, parseInt(event.target.value) || 1) }))}
                />
              </label>
            </div>

            <div className={styles.mealPlanField}>
              <span>Meal Types</span>
              <div className={styles.mealTypeGrid}>
                {(["breakfast", "lunch", "dinner"] as const).map((type) => (
                  <label key={type} className={styles.mealTypeOption}>
                    <input
                      type="checkbox"
                      checked={mealPlanState.mealTypes.includes(type)}
                      onChange={() => handleMealTypeToggle(type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.mealPlanSummary}>
              <span>{mealPlanState.numberOfDays} days</span>
              <strong>{mealPlanState.numberOfDays * mealPlanState.mealTypes.length}</strong>
              <span>meal slots</span>
            </div>

            <button onClick={handleCreateMealPlan} disabled={mealPlanState.loading} className={styles.createPlanButton}>
              {mealPlanState.loading ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={closeCreateForm}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={closeCreateForm}>✕</button>
        <div className={styles.menuContainer}>
          <h1 className={styles.menuTitle}>Choose an Action</h1>
          <button className={styles.menuOption} onClick={() => { closeCreateForm(); router.push("/create"); }}>
            <span className={styles.menuIcon}>📝</span>
            <span className={styles.menuLabel}>Create Recipe</span>
          </button>
          <button className={styles.menuOption} onClick={() => setShowMealPlanForm(true)}>
            <span className={styles.menuIcon}>📋</span>
            <span className={styles.menuLabel}>Create Meal Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
