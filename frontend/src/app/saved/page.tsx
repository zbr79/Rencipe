"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import styles from "../recipes/page.module.css";

export default function SavedPage() {
  const {
    savedRecipes,
    loadingSaved,
    fetchSaved,
    mealPlans,
    loadingPlans,
    fetchMealPlans,
    createMealPlan,
    renameMealPlan,
    deleteMealPlan,
  } = useSaved();

  const [activeTab, setActiveTab] = useState<"recipes" | "plans">("recipes");
  const [filters, setFilters] = useState({
    searchTerm: "",
  });
  const [renamingPlanId, setRenamingPlanId] = useState<string | null>(null);
  const [renamingPlanName, setRenamingPlanName] = useState("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchSaved(userId);
    fetchMealPlans(userId);
  }, []);

  const filteredRecipes = savedRecipes.filter((recipe) => {
    const matchesSearch =
      !filters.searchTerm ||
      recipe.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      recipe.description
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase());

    return matchesSearch;
  });

  const filteredPlans = mealPlans.filter((plan) => {
    const matchesSearch =
      !filters.searchTerm ||
      plan.name.toLowerCase().includes(filters.searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleCreateMealPlan = async () => {
    setIsCreatingPlan(true);
    try {
      await createMealPlan(userId, "新建计划");
      await fetchMealPlans(userId);
    } catch (error) {
      console.error("Failed to create meal plan:", error);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleRenamePlan = async (planId: string) => {
    if (!renamingPlanName.trim()) return;

    try {
      await renameMealPlan(planId, renamingPlanName);
      setRenamingPlanId(null);
      setRenamingPlanName("");
      await fetchMealPlans(userId);
    } catch (error) {
      console.error("Failed to rename plan:", error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("确定要删除这个计划吗？")) return;

    try {
      await deleteMealPlan(planId);
      await fetchMealPlans(userId);
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>已保存</h1>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid var(--border)",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => setActiveTab("recipes")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "recipes" ? "var(--card-bg)" : "transparent",
            border: "none",
            borderBottom:
              activeTab === "recipes" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            color:
              activeTab === "recipes"
                ? "#3b82f6"
                : "var(--text-secondary)",
          }}
        >
          菜谱 ({savedRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "plans" ? "var(--card-bg)" : "transparent",
            border: "none",
            borderBottom:
              activeTab === "plans" ? "2px solid #3b82f6" : "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            color:
              activeTab === "plans" ? "#3b82f6" : "var(--text-secondary)",
          }}
        >
          计划 ({mealPlans.length})
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder={
              activeTab === "recipes" ? "搜索已保存食谱..." : "搜索计划..."
            }
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters({ ...filters, searchTerm: e.target.value })
            }
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ===== 菜谱 Tab ===== */}
      {activeTab === "recipes" && (
        <>
          <div className={styles.count}>
            已保存 {filteredRecipes.length} 个食谱
          </div>

          {loadingSaved && <p className={styles.loading}>加载中...</p>}

          {!loadingSaved && filteredRecipes.length === 0 && (
            <div className={styles.empty}>
              <p>
                {savedRecipes.length === 0
                  ? "您还没有保存任何食谱"
                  : "没有找到匹配的食谱"}
              </p>
              <Link href="/recipes" className={styles.createLink}>
                浏览食谱
              </Link>
            </div>
          )}

          {/* Saved Recipes Grid */}
          <div className={styles.grid}>
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipes/${recipe._id}`}
                className={styles.card}
              >
                {recipe.image && (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      overflow: "hidden",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
                <div className={styles.cardHeader}>
                  <h3>{recipe.title}</h3>
                </div>

                <p className={styles.description}>
                  {recipe.description || ""}
                </p>

                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    🍽️ {recipe.servings || 1} 人份
                  </span>
                </div>

                {recipe.tags.length > 0 && (
                  <div className={styles.tags}>
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span className={styles.tag}>
                        +{recipe.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className={styles.stats}>
                  <span>❤️ {recipe.likes}</span>
                  <span>👁️ {recipe.views}</span>
                  {recipe.ratingCount > 0 && (
                    <span>⭐ {recipe.ratingAverage.toFixed(1)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ===== 计划 Tab ===== */}
      {activeTab === "plans" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div className={styles.count}>共有 {filteredPlans.length} 个计划</div>
            <button
              onClick={handleCreateMealPlan}
              disabled={isCreatingPlan}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {isCreatingPlan ? "创建中..." : "+ 新建计划"}
            </button>
          </div>

          {loadingPlans && <p className={styles.loading}>加载中...</p>}

          {!loadingPlans && filteredPlans.length === 0 && (
            <div className={styles.empty}>
              <p>
                {mealPlans.length === 0
                  ? "您还没有创建任何计划"
                  : "没有找到匹配的计划"}
              </p>
              <button
                onClick={handleCreateMealPlan}
                disabled={isCreatingPlan}
                className={styles.createLink}
                style={{ background: "none", border: "1px solid #667eea" }}
              >
                {isCreatingPlan ? "创建中..." : "新建第一个计划"}
              </button>
            </div>
          )}

          {/* Meal Plans List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredPlans.map((plan) => (
              <Link
                key={plan._id}
                href={`/meal-plans/${plan._id}`}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ flex: 1 }}>
                  {renamingPlanId === plan._id ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={renamingPlanName}
                        onChange={(e) => setRenamingPlanName(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: "8px",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRenamePlan(plan._id);
                        }}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRenamingPlanId(null);
                        }}
                        style={{
                          background: "var(--border)",
                          color: "var(--foreground)",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", color: "var(--foreground)" }}>{plan.name}</h3>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {plan.recipes.length} 道食谱
                      </p>
                    </div>
                  )}
                </div>

                {renamingPlanId !== plan._id && (
                  <div
                    style={{ display: "flex", gap: "8px", marginLeft: "16px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRenamingPlanId(plan._id);
                        setRenamingPlanName(plan.name);
                      }}
                      style={{
                        background: "#667eea",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeletePlan(plan._id);
                      }}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      删除
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
