"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../app/contexts/CartContext";
import styles from "./page.module.css";

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
  const { addToCart } = useCart();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

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

  const handleAddToCart = async () => {
    const testUserId = "507f1f77bcf86cd799439011"; // Mock user ID for testing
    setIsAddingToCart(true);
    try {
      await addToCart(testUserId, recipeId);
      alert("已添加到购物车！");
    } catch (err: any) {
      alert("添加到购物车失败: " + err.message);
    } finally {
      setIsAddingToCart(false);
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
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={styles.addToCartBtn}
          >
            {isAddingToCart ? "添加中..." : "🛒 添加到购物车"}
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
    </div>
  );
}
