"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSaved } from "../../../app/contexts/SavedContext";
import styles from "./page.module.css";

interface MealPlan {
  _id: string;
  userId: string;
  name: string;
  recipes: any[];
  createdAt: string;
  updatedAt: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  authorId: string;
  image?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    image?: string;
  }>;
  servings: number;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const { isSaved, addFavorite, removeFavorite, mealPlans, fetchMealPlans, addRecipeToMealPlan } = useSaved();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [addingToPlan, setAddingToPlan] = useState<string | null>(null);
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);

      if (!response.ok) {
        throw new Error("加载食谱失败");
      }

      const data = await response.json();
      setRecipe(data.recipe);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个食谱吗？此操作无法撤销。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除食谱失败");
      }

      // Redirect to home page after successful deletion
      router.push("/");
    } catch (err: any) {
      alert("删除失败: " + (err.message || "未知错误"));
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit/${recipeId}`);
  };

  const handleOpenPlanSelector = async () => {
    setShowPlanSelector(true);
    setLoadingPlans(true);
    try {
      await fetchMealPlans(userId);
    } catch (err) {
      console.error("Failed to fetch meal plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleAddToPlan = async (planId: string) => {
    setAddingToPlan(planId);
    try {
      await addRecipeToMealPlan(planId, recipeId);
      alert("已添加到计划！");
      setShowPlanSelector(false);
    } catch (err: any) {
      alert("添加失败: " + err.message);
    } finally {
      setAddingToPlan(null);
    }
  };

  const handleSaveRecipe = async () => {
    setIsSavingRecipe(true);
    try {
      if (isSaved(recipeId)) {
        await removeFavorite(userId, recipeId);
        alert("已取消保存");
      } else {
        await addFavorite(userId, recipeId);
        alert("已保存此食谱！");
      }
    } catch (err: any) {
      alert("保存失败: " + err.message);
    } finally {
      setIsSavingRecipe(false);
    }
  };
  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (error || !recipe) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>错误: {error || ""}</p>
          <Link href="/" className={styles.backLink}>
            ← 返回
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back Button - Top */}
      <div className={styles.backButtonContainer}>
        <Link href="/" className={styles.backButtonNormal}>
          ← 返回
        </Link>
        <div className={styles.actionButtons}>
          <button 
            onClick={handleSaveRecipe}
            disabled={isSavingRecipe}
            className={styles.saveBtn}
            title={isSaved(recipeId) ? "已保存" : "保存此食谱"}
          >
            {isSavingRecipe ? "保存中..." : (isSaved(recipeId) ? "❤️ 已保存" : "🤍 保存")}
          </button>
          <button 
            onClick={handleOpenPlanSelector}
            className={styles.addToPlanBtn}
            title="添加到计划"
          >
            📋 添加到计划
          </button>
          <button 
            onClick={handleEdit}
            className={styles.editBtn}
          >
            编辑
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteBtn}
          >
            {isDeleting ? "删除中..." : "删除"}
          </button>
        </div>
      </div>

      {/* Recipe Image */}
      {recipe.image && (
        <div className={styles.imageContainer}>
          <img
            src={recipe.image}
            alt={recipe.title}
            className={styles.recipeImage}
          />
        </div>
      )}

      {/* Recipe Title */}
      <h1 className={styles.recipeTitle}>{recipe.title}</h1>

      {/* Recipe Info */}
      <div className={styles.recipeInfo}>
        {/* Rating and View Count Row */}
        <div className={styles.infoHeader}>
          {/* Rating */}
          {recipe.ratingCount > 0 && (
            <div className={styles.ratingRow}>
              <span className={styles.stars}>★★★★★</span>
              <span className={styles.ratingText}>
                {recipe.ratingAverage.toFixed(1)} ({recipe.ratingCount})
              </span>
            </div>
          )}
          {/* View Count - Right aligned */}
          <div className={styles.viewCount}>
            {recipe.views} 次浏览
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Ingredients Section */}
        <div className={styles.ingredientsSection}>
          <h3 className={styles.sectionTitle}>用料</h3>
          <ul className={styles.ingredientsList}>
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className={styles.ingredientItem}>
                <input type="checkbox" id={`ing-${idx}`} />
                <label htmlFor={`ing-${idx}`}>
                  <strong>{ing.quantity}</strong> {ing.name}
                  {ing.note && <span className={styles.note}> • {ing.note}</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps Section */}
        <div className={styles.directionsSection}>
          <h3 className={styles.sectionTitle}>步骤</h3>
          <ol className={styles.stepsList}>
            {recipe.steps.map((step, idx) => (
              <li key={idx} className={styles.step}>
                <div className={styles.stepNumber}>{step.stepNumber}</div>
                <div>
                  <p>{step.instruction}</p>
                  {step.image && (
                    <img
                      src={step.image}
                      alt={`Step ${step.stepNumber}`}
                      className={styles.stepImage}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Meal Plan Selector Modal */}
      {showPlanSelector && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPlanSelector(false)}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "400px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>选择计划</h2>

            {loadingPlans ? (
              <p>加载中...</p>
            ) : mealPlans && mealPlans.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {mealPlans.map((plan) => (
                  <button
                    key={plan._id}
                    onClick={() => handleAddToPlan(plan._id)}
                    disabled={addingToPlan === plan._id}
                    style={{
                      padding: "12px",
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      opacity: addingToPlan === plan._id ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (addingToPlan !== plan._id) {
                        e.currentTarget.style.background = "var(--border)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--card-bg)";
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {plan.recipes?.length || 0} 道食谱
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                您还没有创建任何计划。
                <br />
                <Link href="/saved" style={{ color: "#3b82f6", textDecoration: "none" }}>
                  去创建计划 →
                </Link>
              </p>
            )}

            <button
              onClick={() => setShowPlanSelector(false)}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
