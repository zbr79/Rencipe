"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./page.module.css";

interface Recipe {
  id: string;
  title: string;
  description: string;
  authorId: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  difficulty: "Easy" | "Medium" | "Hard";
  servings: number;
  cuisine: string;
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
  const locale = params.locale as string;
  const recipeId = params.id as string;
  const t = useTranslations("recipeDetail");
  const tCommon = useTranslations("common");
  const tDifficulty = useTranslations("difficulty");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        throw new Error(t("error.notFound"));
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
      console.error(t("error.failedLike"), err);
    }
  };

  const handleRate = async (rating: number) => {
    if (!recipe) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/recipes/${recipeId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data.recipe);
        setUserRating(rating);
      }
    } catch (err: any) {
      console.error(t("error.failedRate"), err);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return tDifficulty("easy");
      case "Medium":
        return tDifficulty("medium");
      case "Hard":
        return tDifficulty("hard");
      default:
        return difficulty;
    }
  };

  if (loading) {
    return <div className={styles.loading}>{tCommon("loading")}</div>;
  }

  if (error || !recipe) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{tCommon("error")}: {error || t("error.notFound")}</p>
          <Link href={`/${locale}/recipes`} className={styles.backLink}>
            ← {t("buttons.backToRecipes")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/${locale}/recipes`} className={styles.backLink}>
        ← {t("buttons.backToRecipes")}
      </Link>

      <header className={styles.header}>
        <div>
          <h1>{recipe.title}</h1>
          <p className={styles.description}>
            {recipe.description || t("empty.noDescription")}
          </p>
          {recipe.cuisine && <p className={styles.cuisine}>🍳 {recipe.cuisine}</p>}
        </div>
        {recipe.difficulty && (
          <span
            className={`${styles.difficulty} ${styles[`difficulty-${(recipe.difficulty || "easy").toLowerCase()}`]}`}
          >
            {getDifficultyLabel(recipe.difficulty || "Easy")}
          </span>
        )}
      </header>

      <div className={styles.stats}>
        {recipe.servings !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t("labels.servings")}</span>
            <span className={styles.statValue}>{recipe.servings}</span>
          </div>
        )}
      </div>

      <div className={styles.engagement}>
        <button
          className={styles.likeBtn}
          onClick={handleLike}
          title={t("buttons.likeTitle")}
        >
          ❤️ {recipe.likes}
        </button>
        <span className={styles.views}>
          👁️ {recipe.views} {t("meta.views")}
        </span>
        {recipe.ratingCount > 0 && (
          <span className={styles.rating}>
            ⭐ {recipe.ratingAverage.toFixed(1)} ({recipe.ratingCount}{" "}
            {t("meta.ratings")})
          </span>
        )}
      </div>

      {recipe.ratingCount === 0 && (
        <div className={styles.ratingSection}>
          <p>{t("rating.beFirst")}</p>
          <div className={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                className={styles.ratingBtn}
              >
                ⭐ {star}
              </button>
            ))}
          </div>
        </div>
      )}

      {recipe.tags.length > 0 && (
        <div className={styles.tagsSection}>
          <h2>{t("sections.tags")}</h2>
          <div className={styles.tags}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <section className={styles.section}>
        <h2>{t("sections.ingredients")}</h2>
        <ul className={styles.ingredientsList}>
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx}>
              <input type="checkbox" id={`ing-${idx}`} />
              <label htmlFor={`ing-${idx}`}>
                <strong>
                  {ing.quantity} {ing.unit}
                </strong>{" "}
                {ing.name}
                {ing.note && (
                  <span className={styles.note}> ({ing.note})</span>
                )}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>{t("sections.instructions")}</h2>
        <ol className={styles.stepsList}>
          {recipe.steps.map((step, idx) => (
            <li key={idx} className={styles.step}>
              <div className={styles.stepNumber}>
                {t("labels.step")} {step.stepNumber}
              </div>
              <p>{step.instruction}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <p>
          {t("footer.created")}:{" "}
          {new Date(recipe.createdAt).toLocaleDateString()}
        </p>
        <Link href={`/${locale}/recipes`} className={styles.backLink}>
          ← {t("buttons.backToRecipes")}
        </Link>
      </footer>
    </div>
  );
}
