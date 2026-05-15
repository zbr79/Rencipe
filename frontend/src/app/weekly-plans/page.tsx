"use client";

import { useEffect, useState } from "react";
import { useSaved } from "../contexts/SavedContext";
import { useConfirmDialog } from "../components/ConfirmDialogProvider";
import type { WeeklyPlan } from "../contexts/SavedContext";
import { getScheduledPlanDisplayName } from "../utils/planDisplay";
import Link from "next/link";
import styles from "./page.module.css";

export default function WeeklyPlansPage() {
  const { weeklyPlans, fetchWeeklyPlans, deleteWeeklyPlan, renameWeeklyPlan, loadingWeeklyPlans, errorWeeklyPlans } = useSaved();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { confirm, notify } = useConfirmDialog();

  useEffect(() => {
    fetchWeeklyPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!(await confirm({
      title: "Delete scheduled plan",
      message: "Delete this scheduled plan?",
      intent: "danger",
      confirmText: "Delete",
    }))) return;
    try {
      await deleteWeeklyPlan(id);
    } catch (err) {
      console.error("Failed to delete:", err);
      await notify({
        title: "Delete failed",
        message: "Failed to delete this scheduled plan.",
        intent: "danger",
      });
    }
  };

  const handleStartEdit = (plan: WeeklyPlan) => {
    setEditingId(plan._id);
    setEditingName(getScheduledPlanDisplayName(plan.name));
  };

  const handleSaveName = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await renameWeeklyPlan(id, editingName);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Meal Schedule</p>
          <h1>Plans</h1>
          <p>Arrange breakfast, lunch, and dinner slots across the week.</p>
        </div>
      </header>

      {loadingWeeklyPlans && <p className={styles.statusText}>Loading...</p>}
      {errorWeeklyPlans && <p className={styles.errorText}>Error: {errorWeeklyPlans}</p>}

      {weeklyPlans.length === 0 && !loadingWeeklyPlans ? (
        <div className={styles.emptyState}>No scheduled plans yet</div>
      ) : (
        <div className={styles.planList}>
          {weeklyPlans.map((plan) => (
            <div key={plan._id} className={styles.planCard}>
              <div className={styles.planContent}>
                {editingId === plan._id ? (
                  <div className={styles.editRow}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                    <button
                      onClick={() => handleSaveName(plan._id)}
                      className={styles.primaryButton}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className={styles.subtleButton}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <Link href={`/weekly-plans/${plan._id}`}>
                      <h3>{getScheduledPlanDisplayName(plan.name)}</h3>
                    </Link>
                    <p>
                      Created {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className={styles.planActions}>
                <button
                  onClick={() => handleStartEdit(plan)}
                  className={styles.subtleButton}
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className={styles.dangerButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
