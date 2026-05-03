"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSaved } from "../../../app/contexts/SavedContext";
import { getRecipeImageUrl } from "../../utils/recipeImageUtils";
import { getVisibleTags } from "../../utils/recipeTags";
import { authFetch } from "../../utils/authSession";
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

  const handleDelete = async () => {
    if (!confirm("Delete this recipe? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      // Redirect to home page after successful deletion
      router.push("/");
    } catch (err: any) {
      alert("Delete failed: " + (err.message || "Unknown error"));
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
      alert("Added to plan!");
      setShowPlanSelector(false);
    } catch (err: any) {
      alert("Add failed: " + err.message);
    } finally {
      setAddingToPlan(null);
    }
  };

  const handleSaveRecipe = async () => {
    setIsSavingRecipe(true);
    try {
      if (isSaved(recipeId)) {
        await removeFavorite(userId, recipeId);
        alert("Removed from saved");
      } else {
        await addFavorite(userId, recipeId);
        alert("Recipe saved!");
      }
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setIsSavingRecipe(false);
    }
  };
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
      {/* Back Button - Top */}
      <div className={styles.backButtonContainer}>
        <Link href="/" className={styles.backButtonNormal}>
          ← Back
        </Link>
        <div className={styles.actionButtons}>
          <button 
            onClick={handleSaveRecipe}
            disabled={isSavingRecipe}
            className={styles.saveBtn}
            title={isSaved(recipeId) ? "Saved" : "Save recipe"}
          >
            {isSavingRecipe ? "Saving..." : (isSaved(recipeId) ? "❤️ Saved" : "🤍 Save")}
          </button>
          <button 
            onClick={handleOpenPlanSelector}
            className={styles.addToPlanBtn}
            title="Add to Plan"
          >
            📋 Add to Plan
          </button>
          <button 
            onClick={handleEdit}
            className={styles.editBtn}
          >
            Edit
          </button>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className={styles.deleteBtn}
          >
            {isDeleting ? "Deleting..." : "Delete"}
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
                    <input type="checkbox" id={`main-ing-${idx}`} />
                    <label htmlFor={`main-ing-${idx}`}>
                      <strong>{ing.quantity}</strong> {ing.name}
                      {ing.note && <span className={styles.note}> • {ing.note}</span>}
                    </label>
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
                    <input type="checkbox" id={`seasoning-${idx}`} />
                    <label htmlFor={`seasoning-${idx}`}>
                      <strong>{ing.quantity}</strong> {ing.name}
                      {ing.note && <span className={styles.note}> • {ing.note}</span>}
                    </label>
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
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Select a Plan</h2>

            {loadingPlans ? (
              <p>Loading...</p>
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
                      {plan.recipes?.length || 0} recipes
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                You have not created any meal plans yet.
                <br />
                <Link href="/saved" style={{ color: "#3b82f6", textDecoration: "none" }}>
                  Create a plan
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
