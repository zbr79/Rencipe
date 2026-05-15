"use client";

import { useRouter } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import { useQuickCreateMealPlan } from "../hooks/useQuickCreateMealPlan";
import styles from "./create-form-modal.module.css";

export default function CreateFormModal() {
  const { isOpen, closeCreateForm } = useCreateForm();
  const { creatingMeal, isCreatingAny, createAndOpenMeal } = useQuickCreateMealPlan();
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeCreateForm}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={closeCreateForm} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className={styles.menuContainer}>
          <h1 className={styles.menuTitle}>Create</h1>
          <button className={styles.menuOption} onClick={() => { closeCreateForm(); router.push("/create"); }}>
            <span className={`material-symbols-outlined ${styles.menuIcon}`}>edit_note</span>
            <span className={styles.menuLabel}>New Recipe</span>
          </button>
          <button
            className={styles.menuOption}
            onClick={() => createAndOpenMeal({ afterSuccess: closeCreateForm })}
            disabled={isCreatingAny}
          >
            <span className={`material-symbols-outlined ${styles.menuIcon}`}>restaurant</span>
            <span className={styles.menuLabel}>{creatingMeal ? "Creating Meal..." : "New Meal"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
