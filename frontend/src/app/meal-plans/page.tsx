"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import styles from "../recipes/page.module.css";

export default function MealPlansPage() {
  const { mealPlans, loadingPlans, fetchMealPlans, deleteMealPlan } = useSaved();
  
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchMealPlans(userId);
  }, []);

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
                    👥 {plan.people.length} 人 | 📅 {plan.numberOfDays} 天
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
