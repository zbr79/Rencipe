"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSaved } from "../../contexts/SavedContext";
import { getRecipeImageUrl } from "../../utils/recipeImageUtils";
import { getVisibleTags } from "../../utils/recipeTags";
import { authFetch, getCurrentUser, type AuthUser } from "../../utils/authSession";
import styles from "./page.module.css";

interface Recipe {
  id: string;
  title: string;
  description: string;
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
  const [panelCollapsed, setPanelCollapsed] = useState(false);

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
      
      // Add mock image if recipe doesn't have one
      const recipeData = data.recipe;
      if (!recipeData.image) {
        recipeData.image = getRecipeImageUrl(recipeId);
      }
      
      setRecipe(recipeData);
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
      alert("Save failed: " + err.message);
    } finally {
      setIsSavingRecipe(false);
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
          <Link href="/" className={styles.backLink}>
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButtonContainer}>
        <Link href="/" className={styles.backButtonNormal}>
          ← Back
        </Link>
      </div>

      <aside className={`${styles.floatingPanel} ${panelCollapsed ? styles.floatingPanelCollapsed : ""}`} aria-label="Recipe actions">
        <button
          type="button"
          className={styles.panelToggle}
          onClick={() => setPanelCollapsed((value) => !value)}
          aria-label={panelCollapsed ? "Open recipe actions" : "Minimize recipe actions"}
          aria-expanded={!panelCollapsed}
        >
          <span className="material-symbols-outlined">{panelCollapsed ? "chevron_left" : "chevron_right"}</span>
        </button>
        <div className={styles.panelActions}>
          <button
            type="button"
            className={`${styles.panelButton} ${saved ? styles.panelButtonActive : ""}`}
            onClick={handleSaveRecipe}
            disabled={isSavingRecipe}
            aria-label={saved ? "Remove from saved" : "Save recipe"}
            title={saved ? "Saved" : "Save"}
          >
            <span className="material-symbols-outlined">{saved ? "bookmark" : "bookmark_border"}</span>
          </button>
          {canEditRecipe && (
            <button type="button" className={styles.panelButton} onClick={handleEdit} aria-label="Edit recipe" title="Edit">
              <span className="material-symbols-outlined">edit</span>
            </button>
          )}
        </div>
      </aside>

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
    </div>
  );
}
