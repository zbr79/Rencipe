"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSaved } from "../contexts/SavedContext";
import styles from "../recipes/page.module.css";

export default function MealPlansPage() {
  const router = useRouter();
  const { mealPlans, loadingPlans, fetchMealPlans, createMealPlan, deleteMealPlan } = useSaved();
  
  const [isCreating, setIsCreating] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [mealTypes, setMealTypes] = useState<('lunch' | 'dinner')[]>(['lunch']);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchMealPlans(userId);
  }, []);

  const handleMealTypeToggle = (type: 'lunch' | 'dinner') => {
    setMealTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCreateMealPlan = async () => {
    if (mealTypes.length === 0) {
      setError("请至少选择一个餐次");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPlan = await createMealPlan(
        userId,
        numberOfPeople,
        numberOfDays,
        mealTypes,
        name || `${numberOfPeople}人${numberOfDays}天计划`
      );

      setIsCreating(false);
      setNumberOfPeople(2);
      setNumberOfDays(3);
      setMealTypes(['lunch']);
      setName("");
      
      // Redirect to the detail page
      router.push(`/meal-plans/${newPlan._id}`);
    } catch (err: any) {
      console.error("Error creating meal plan:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm("确定要删除此计划吗?")) {
      try {
        await deleteMealPlan(planId);
      } catch (error) {
        console.error("Failed to delete plan:", error);
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
          我的膳食计划
        </h1>
      </div>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          + 创建新计划
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
            创建新膳食计划
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: "#ffebee",
                color: "#c62828",
                padding: "12px",
                borderRadius: "4px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {/* Number of People */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              人数
            </label>
            <input
              type="number"
              min="1"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Number of Days */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              天数
            </label>
            <input
              type="number"
              min="1"
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Meal Types */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: "500" }}>
              包括哪些餐次
            </label>
            <div style={{ display: "flex", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={mealTypes.includes("lunch")}
                  onChange={() => handleMealTypeToggle("lunch")}
                  style={{ marginRight: "8px", cursor: "pointer" }}
                />
                午餐
              </label>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={mealTypes.includes("dinner")}
                  onChange={() => handleMealTypeToggle("dinner")}
                  style={{ marginRight: "8px", cursor: "pointer" }}
                />
                晚餐
              </label>
            </div>
          </div>

          {/* Plan Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              计划名称 (可选)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${numberOfPeople}人${numberOfDays}天计划`}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Summary */}
          <div
            style={{
              backgroundColor: "#e3f2fd",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            总共需要 <strong>{numberOfPeople * numberOfDays * mealTypes.length}</strong> 份餐
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleCreateMealPlan}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontSize: "16px",
              }}
            >
              {loading ? "创建中..." : "创建计划"}
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setError(null);
              }}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Meal Plans List */}
      {loadingPlans ? (
        <p style={{ textAlign: "center", color: "#999" }}>加载中...</p>
      ) : mealPlans.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: "#999", marginBottom: "16px" }}>还没有创建任何计划</p>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
            计划列表
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {mealPlans.map((plan) => (
              <Link key={plan._id} href={`/meal-plans/${plan._id}`}>
                <div
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                    👥 {plan.numberOfPeople} 人 | 📅 {plan.numberOfDays} 天
                  </p>
                  <p style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                    🍽️ {plan.mealTypes.includes("lunch") ? "午" : ""}{plan.mealTypes.includes("dinner") ? "晚" : ""}
                  </p>
                  <p style={{ color: "#999", fontSize: "12px", marginBottom: "12px" }}>
                    需要 {plan.totalMealsNeeded} 份餐 | 已配置 {plan.combinations.length} 个组合
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePlan(plan._id);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: "#ffebee",
                      color: "#c62828",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    删除
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
