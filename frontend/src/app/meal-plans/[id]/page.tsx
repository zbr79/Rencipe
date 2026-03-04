"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../../contexts/SavedContext";
import styles from "../../recipes/page.module.css";

interface MealPlan {
  _id: string;
  userId: string;
  name: string;
  recipes: any[];
  createdAt: string;
  updatedAt: string;
}

interface AggregatedIngredient {
  name: string;
  quantity: string;
  totalQuantity?: number;
  unit?: string;
}

export default function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { removeRecipeFromMealPlan, renameMealPlan } = useSaved();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/meal-plans/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch meal plan");
        }
        const data = await response.json();
        setPlan(data.plan);
        setNewName(data.plan.name);
      } catch (err: any) {
        console.error("Error fetching meal plan:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const handleRenamePlan = async () => {
    if (!newName.trim() || !plan) return;

    try {
      await renameMealPlan(plan._id, newName);
      setPlan({ ...plan, name: newName });
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename plan:", error);
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    if (!plan) return;

    try {
      await removeRecipeFromMealPlan(plan._id, recipeId);
      // Refresh the plan
      const response = await fetch(`/api/meal-plans/${plan._id}`);
      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to remove recipe:", error);
    }
  };

  const handleCheckIngredient = async (ingredientName: string, checked: boolean) => {
    if (!plan) return;

    try {
      const response = await fetch(`/api/meal-plans/${plan._id}/ingredients`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientName, checked }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to toggle ingredient check:", error);
    }
  };

  // Aggregate ingredients from all recipes
  const aggregateIngredients = () => {
    if (!plan || !plan.recipes) return [];

    const ingredientMap: { [key: string]: AggregatedIngredient } = {};

    plan.recipes.forEach((recipe) => {
      // Aggregate main ingredients
      if (recipe.mainIngredients && Array.isArray(recipe.mainIngredients)) {
        recipe.mainIngredients.forEach((ingredient: any) => {
          const key = ingredient.name.toLowerCase();
          if (!ingredientMap[key]) {
            ingredientMap[key] = {
              name: ingredient.name,
              quantity: ingredient.quantity,
            };
          } else {
            // Try to aggregate quantities if they have the same unit
            ingredientMap[key].quantity += `; ${ingredient.quantity}`;
          }
        });
      }

      // Aggregate seasonings
      if (recipe.seasonings && Array.isArray(recipe.seasonings)) {
        recipe.seasonings.forEach((ingredient: any) => {
          const key = ingredient.name.toLowerCase();
          if (!ingredientMap[key]) {
            ingredientMap[key] = {
              name: ingredient.name,
              quantity: ingredient.quantity,
            };
          } else {
            // Try to aggregate quantities if they have the same unit
            ingredientMap[key].quantity += `; ${ingredient.quantity}`;
          }
        });
      }
    });

    return Object.values(ingredientMap);
  };

  const aggregatedIngredients = aggregateIngredients();

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>错误: {error}</p>
          <Link href="/saved" className={styles.createLink}>
            返回已保存
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>找不到这个计划</p>
          <Link href="/saved" className={styles.createLink}>
            返回已保存
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with Plan Name */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          paddingBottom: "20px",
          borderBottom: "2px solid var(--border)",
        }}
      >
        <div style={{ flex: 1 }}>
          {isRenaming ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1.5px solid #3b82f6",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  background: "var(--card-bg)",
                  color: "var(--foreground)",
                }}
              />
              <button
                onClick={handleRenamePlan}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)";
                }}
              >
                ✓ 保存
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                style={{
                  background: "#f3f4f6",
                  color: "var(--foreground)",
                  border: "1px solid #e5e7eb",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
              >
                ✕ 取消
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>📋 {plan.name}</h1>
              <button
                onClick={() => setIsRenaming(true)}
                style={{
                  background: "#f3f4f6",
                  color: "#667eea",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#667eea";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#667eea";
                }}
              >
                ✏️ 编辑名称
              </button>
            </div>
          )}
        </div>
        <Link
          href="/saved"
          style={{
            color: "#3b82f6",
            textDecoration: "none",
            fontWeight: "600",
            padding: "8px 12px",
            borderRadius: "6px",
            transition: "all 0.2s ease",
            display: "inline-block",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          ← 返回已保存
        </Link>
      </div>

      {/* Recipes in Plan */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "20px", fontSize: "22px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          🍽️ 食谱 ({plan.recipes?.length || 0})
        </h2>

        {plan.recipes && plan.recipes.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "16px",
            }}
          >
            {plan.recipes.map((recipe) => (
              <div
                key={recipe._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Link
                  href={`/recipes/${recipe._id}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--card-bg)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#8b5cf6";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {recipe.image && (
                    <div
                      style={{
                        width: "100%",
                        height: "160px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
                      {recipe.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: "1.4",
                        flex: 1,
                      }}
                    >
                      {recipe.description}
                    </p>
                  </div>
                </Link>
                <div style={{ padding: "8px 14px 14px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleRemoveRecipe(recipe._id)}
                    style={{
                      padding: "6px 12px",
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ef4444";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                      e.currentTarget.style.color = "#ef4444";
                    }}
                  >
                    🗑️ 移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>这个计划中还没有食谱</p>
            <Link href="/recipes" className={styles.createLink}>
              浏览食谱
            </Link>
          </div>
        )}
      </div>

      {/* Ingredient Aggregation */}
      {plan.recipes && plan.recipes.length > 0 && (
        <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
          <h2 style={{ 
            marginBottom: "20px",
            fontSize: "24px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingBottom: "12px",
            borderBottom: "2px solid #8b5cf6",
          }}>
            🛒 购物清单
          </h2>
          <div
            style={{
              background: "var(--card-bg)",
              border: "1.5px solid #e5e7eb",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            {aggregatedIngredients.length > 0 ? (
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {aggregatedIngredients.map((ingredient, index) => {
                  const isChecked = plan?.checkedIngredients?.includes(ingredient.name) ?? false;
                  return (
                    <li
                      key={index}
                      style={{
                        padding: "14px 0",
                        borderBottom:
                          index < aggregatedIngredients.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckIngredient(ingredient.name, e.target.checked)}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                            accentColor: "#8b5cf6",
                          }}
                        />
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "15px",
                            color: isChecked ? "#c4b5fd" : "var(--text-primary)",
                            textDecoration: isChecked ? "line-through" : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {ingredient.name}
                        </span>
                      </div>
                      <span
                        style={{
                          background: "#f3f4f6",
                          color: "#6b7280",
                          fontSize: "13px",
                          fontWeight: "600",
                          padding: "6px 12px",
                          borderRadius: "20px",
                        }}
                      >
                        {ingredient.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ 
                margin: 0, 
                color: "var(--text-secondary)",
                textAlign: "center",
                padding: "20px",
              }}>
                没有食材
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
