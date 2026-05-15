"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";
import CommentSection from "../../components/CommentSection";
import FloatingActionPanel from "../../components/FloatingActionPanel";
import { toastError } from "../../components/toast/toast";
import { useSaved } from "../../contexts/SavedContext";
import { getVisibleTags } from "../../utils/recipeTags";
import { authFetch, getCurrentUser, type AuthUser } from "../../utils/authSession";
import type { RecipeLanguage } from "../../utils/recipeLanguage";
import styles from "./page.module.css";
import { recordRecentlyViewedRecipe } from "../../utils/recentlyViewedRecipes";

interface Recipe {
  id: string;
  title: string;
  description: string;
  language?: RecipeLanguage;
  tips?: string;
  authorId: string;
  image?: string;
  mainIngredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
  seasonings: Array<{
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

function formatIngredientAmount(ingredient: Recipe["mainIngredients"][number]) {
  return [ingredient.quantity, ingredient.unit].filter(Boolean).join(" ");
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const { isSaved, addFavorite, removeFavorite, fetchSaved } = useSaved();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    fetchRecipe();
    setCurrentUser(getCurrentUser());
    fetchSaved();
  }, [recipeId]);

  const fetchRecipe = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/recipes/${recipeId}`);

      if (!response.ok) {
        throw new Error("Failed to load recipe");
      }

      const data = await response.json();
      const recipeData = data.recipe;

      setRecipe(recipeData);
      recordRecentlyViewedRecipe({
        id: recipeId,
        title: recipeData.title,
        description: recipeData.description || "",
        language: recipeData.language,
        image: recipeData.image,
      });
      setSelectedRating(0);
      setRatingMessage("");
      setRatingSubmitted(false);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit/${recipeId}`);
  };

  const handleSaveRecipe = async () => {
    setIsSavingRecipe(true);
    try {
      if (isSaved(recipeId)) {
        await removeFavorite(undefined, recipeId);
      } else {
        await addFavorite(undefined, recipeId);
      }
    } catch (err: any) {
      toastError(err.message || "Could not update saved recipe");
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    if (ratingSubmitting || ratingSubmitted) return;

    setSelectedRating(rating);
    setRatingSubmitting(true);
    setRatingMessage("");

    try {
      const response = await authFetch(`/api/recipes/${recipeId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Rating failed");
      setRecipe(data.recipe);
      setRatingMessage("Rating submitted");
      setRatingSubmitted(true);
    } catch (err: any) {
      setRatingMessage(err.message || "Rating failed");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const saved = isSaved(recipeId);
  const canEditRecipe = Boolean(recipe && currentUser && (recipe.authorId === currentUser.id || currentUser.role === "admin"));

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error || !recipe) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error || ""}</p>
          <BackButton fallbackHref="/" className={styles.backLink} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButtonContainer}>
        <BackButton fallbackHref="/" className={styles.backButtonNormal} />
      </div>

      <FloatingActionPanel
        ariaLabel="Recipe actions"
        actions={[
          {
            id: "save",
            icon: saved ? "favorite" : "favorite_border",
            label: saved ? "Remove from saved" : "Save recipe",
            onClick: handleSaveRecipe,
            disabled: isSavingRecipe,
            tone: "primary",
          },
          ...(canEditRecipe
            ? [
                {
                  id: "edit",
                  icon: "edit",
                  label: "Edit recipe",
                  onClick: handleEdit,
                },
              ]
            : []),
        ]}
      />

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
              <span className={styles.stars} aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} className={`material-symbols-outlined ${index < Math.round(recipe.ratingAverage) ? styles.starFilled : ""}`}>star</span>
                ))}
              </span>
              <span className={styles.ratingText}>
                {recipe.ratingAverage.toFixed(1)} ({recipe.ratingCount})
              </span>
            </div>
          )}
          {/* View Count - Right aligned */}
          <div className={styles.viewCount}>
            {recipe.views} views
          </div>
        </div>

        {/* Tags */}
        {getVisibleTags(recipe.tags).length > 0 && (
          <div className={styles.tagsRow}>
            {getVisibleTags(recipe.tags).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Ingredients Section */}
        <div className={styles.ingredientsSection}>
          <h3 className={styles.sectionTitle}>Ingredients</h3>
          
          {/* Main Ingredients */}
          {recipe.mainIngredients && recipe.mainIngredients.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "8px" }}>
                Main Ingredients
              </h4>
              <ul className={styles.ingredientsList}>
                {recipe.mainIngredients.map((ing, idx) => (
                  <li key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientName}>{ing.name}</span>
                    <span className={styles.ingredientAmount}>{formatIngredientAmount(ing)}</span>
                    {ing.note && <span className={styles.note}>{ing.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seasonings */}
          {recipe.seasonings && recipe.seasonings.length > 0 && (
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#666", marginBottom: "8px" }}>
                Seasonings
              </h4>
              <ul className={styles.ingredientsList}>
                {recipe.seasonings.map((ing, idx) => (
                  <li key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientName}>{ing.name}</span>
                    <span className={styles.ingredientAmount}>{formatIngredientAmount(ing)}</span>
                    {ing.note && <span className={styles.note}>{ing.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Steps Section */}
        <div className={styles.directionsSection}>
          <h3 className={styles.sectionTitle}>Steps</h3>
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

      {recipe.tips?.trim() && (
        <section className={styles.tipsSection}>
          <h3 className={styles.sectionTitle}>Tips</h3>
          <p className={styles.tipsText}>{recipe.tips}</p>
        </section>
      )}

      <section className={styles.submitRatingSection} aria-label="Rate this recipe">
        <div className={styles.ratingHeader}>
          <h3 className={styles.sectionTitle}>Rate this recipe</h3>
          {ratingSubmitting ? <span className={styles.ratingMessage}>Submitting...</span> : ratingSubmitted && <span className={styles.ratingMessage}>Thank you for rating</span>}
        </div>
        <div className={styles.ratingButtons}>
          {Array.from({ length: 5 }, (_, index) => {
            const rating = index + 1;
            return (
              <button
                key={rating}
                type="button"
                className={`${styles.starButton} ${selectedRating >= rating ? styles.starButtonActive : ""} ${ratingSubmitted ? styles.starButtonDone : ""}`}
                onClick={() => handleRatingSubmit(rating)}
                disabled={ratingSubmitting || ratingSubmitted}
                aria-label={`Rate ${rating} star${rating === 1 ? "" : "s"}`}
              >
                <span className="material-symbols-outlined">star</span>
              </button>
            );
          })}
        </div>
        {!ratingSubmitting && ratingMessage && !ratingSubmitted && <span className={styles.ratingMessage}>{ratingMessage}</span>}
      </section>

      <CommentSection entryType="recipe" entryId={recipeId} />
    </div>
  );
}
