"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSaved } from "../../contexts/SavedContext";
import styles from "./create.module.css";

export default function CreateWeeklyPlanPage() {
  const { createWeeklyPlan } = useSaved();
  const router = useRouter();
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now
  const modalShownRef = useRef(false);

  const [name, setName] = useState("未命名排表");
  const [mealTypes, setMealTypes] = useState({
    breakfast: false,
    lunch: false,
    dinner: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (modalShownRef.current) return;
    modalShownRef.current = true;
  }, []);

  const handleMealTypeChange = (type: "breakfast" | "lunch" | "dinner") => {
    setMealTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const selectedMeals = (["breakfast", "lunch", "dinner"] as const).filter(
        (type) => mealTypes[type]
      );
      const plan = await createWeeklyPlan(userId, name, selectedMeals);
      router.push(`/weekly-plans/${plan._id}`);
    } catch (err: any) {
      console.error("Failed to create weekly plan:", err);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 style={{ marginBottom: "20px" }}>创建周计划</h2>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            计划名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入计划名称"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "12px", fontWeight: "500" }}>
            选择餐次（可多选）
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={mealTypes.breakfast}
                onChange={() => handleMealTypeChange("breakfast")}
                style={{ marginRight: "8px", cursor: "pointer" }}
              />
              <span>早餐</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={mealTypes.lunch}
                onChange={() => handleMealTypeChange("lunch")}
                style={{ marginRight: "8px", cursor: "pointer" }}
              />
              <span>午餐</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={mealTypes.dinner}
                onChange={() => handleMealTypeChange("dinner")}
                style={{ marginRight: "8px", cursor: "pointer" }}
              />
              <span>晚餐</span>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            style={{
              padding: "8px 20px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              background: "transparent",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            style={{
              padding: "8px 20px",
              borderRadius: "6px",
              border: "none",
              background: "var(--primary-color, #4CAF50)",
              color: "white",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "创建中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
