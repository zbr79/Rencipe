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

  // Aggregate ingredients from all recipes
  const aggregateIngredients = () => {
    if (!plan || !plan.recipes) return [];

    const ingredientMap: { [key: string]: AggregatedIngredient } = {};

    plan.recipes.forEach((recipe) => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((ingredient: any) => {
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
          marginBottom: "24px",
        }}
      >
        <div style={{ flex: 1 }}>
          {isRenaming ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
              />
              <button
                onClick={handleRenamePlan}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                保存
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                style={{
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ margin: 0 }}>{plan.name}</h1>
              <button
                onClick={() => setIsRenaming(true)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                }}
              >
                编辑名称
              </button>
            </div>
          )}
        </div>
        <Link href="/saved" style={{ color: "var(--text-secondary)" }}>
          ← 返回
        </Link>
      </div>

      {/* Recipes in Plan */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ marginBottom: "16px" }}>
          食谱 ({plan.recipes?.length || 0})
        </h2>

        {plan.recipes && plan.recipes.length > 0 ? (
          <div className={styles.grid}>
            {plan.recipes.map((recipe) => (
              <div
                key={recipe._id}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {recipe.image && (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
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
                <div style={{ padding: "12px" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                    {recipe.title}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {recipe.description}
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/recipes/${recipe._id}`}
                      style={{
                        flex: 1,
                        padding: "6px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "center",
                        textDecoration: "none",
                        fontSize: "12px",
                      }}
                    >
                      查看
                    </Link>
                    <button
                      onClick={() => handleRemoveRecipe(recipe._id)}
                      style={{
                        flex: 1,
                        padding: "6px",
                        background: "transparent",
                        color: "#ef4444",
                        border: "1px solid #ef4444",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      移除
                    </button>
                  </div>
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
        <div>
          <h2 style={{ marginBottom: "16px" }}>购物清单</h2>
          <div
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
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
                {aggregatedIngredients.map((ingredient, index) => (
                  <li
                    key={index}
                    style={{
                      padding: "12px 0",
                      borderBottom:
                        index < aggregatedIngredients.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "500" }}>
                      {ingredient.name}
                    </span>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "14px",
                      }}
                    >
                      {ingredient.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                没有食材
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
