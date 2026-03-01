"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ingredients" | "directions">("ingredients");
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/recipes/${recipeId}`);

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

  const handleLike = async () => {
    if (!recipe) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/recipes/${recipeId}/like`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
      }
    } catch (err: any) {
      console.error("", err);
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
      {/* Red Header Bar */}
      <header className={styles.topHeader}>
        <Link href="/" className={styles.backBtn}>
          <span>arrow_back</span>
        </Link>
        <h1 className={styles.headerTitle}>{recipe.title}</h1>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} title="Share">
            <span className={styles.icon}>share</span>
          </button>
          <button className={styles.actionBtn} title="Add">
            <span className={styles.icon}>add_circle</span>
          </button>
          <button className={styles.actionBtn} onClick={handleLike} title="Like">
            <span className={styles.icon}>favorite</span>
          </button>
          <button className={styles.actionBtn} title="More">
            <span className={styles.icon}>more_vert</span>
          </button>
        </div>
      </header>

      {/* Recipe Image */}
      {recipe.image && (
        <div style={{ width: "100%", height: "400px", overflow: "hidden" }}>
          <img
            src={recipe.image}
            alt={recipe.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Recipe Info */}
      <div className={styles.recipeInfo}>
        <h2 className={styles.recipeTitle}>{recipe.title}</h2>
        
        {/* Rating */}
        {recipe.ratingCount > 0 && (
          <div className={styles.ratingRow}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.ratingText}>
              {recipe.ratingAverage.toFixed(1)} ({recipe.ratingCount})
            </span>
          </div>
        )}

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.categoryTag}>{tag}</span>
            ))}
          </div>
        )}

        {/* Recipe Meta */}
        <div className={styles.metaRow}>
          <span>❤️ {recipe.likes}</span>
          <span>•</span>
          <span>👁️ {recipe.views}</span>
          {recipe.ratingCount > 0 && (
            <>
              <span>•</span>
              <span>⭐ {recipe.ratingAverage.toFixed(1)} ({recipe.ratingCount})</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "ingredients" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("ingredients")}
        >
          配料
        </button>
        <button
          className={`${styles.tab} ${activeTab === "directions" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("directions")}
        >
          步骤
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === "ingredients" && (
          <div className={styles.ingredientsSection}>
            <h3 className={styles.sectionTitle}>配料</h3>
            <ul className={styles.ingredientsList}>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className={styles.ingredientItem}>
                  <input type="checkbox" id={`ing-${idx}`} />
                  <label htmlFor={`ing-${idx}`}>
                    <strong>{ing.quantity} {ing.unit}</strong> {ing.name}
                    {ing.note && <span className={styles.note}> • {ing.note}</span>}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "directions" && (
          <div className={styles.directionsSection}>
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
                        style={{ maxWidth: "300px", marginTop: "12px", borderRadius: "8px" }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
