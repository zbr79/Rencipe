"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";
import Breadcrumbs from "../../components/Breadcrumbs";
import CommentSection from "../../components/CommentSection";
import FloatingActionPanel from "../../components/FloatingActionPanel";
import AccountAvatar from "../../components/AccountAvatar";
import { toastError } from "../../components/toast/toast";
import { useSaved } from "../../contexts/SavedContext";
import { getVisibleTags } from "../../utils/recipeTags";
import { getAccountDisplayName, type AccountIdentity } from "../../utils/accountAvatar";
import { getRecipeAuthor } from "../../utils/recipeAuthor";
import { authFetch, getCurrentUser, type AuthUser } from "../../utils/authSession";
import type { RecipeLanguage } from "../../utils/recipeLanguage";
import styles from "./page.module.css";
import { recordRecentlyViewedRecipe } from "../../utils/recentlyViewedRecipes";

interface Recipe {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  language?: RecipeLanguage;
  tips?: string;
  authorId: string;
  author?: AccountIdentity | null;
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

export default function RecipeDetailPage({
  recipeId,
  initialRecipe = null,
}: {
  recipeId: string;
  initialRecipe?: Recipe | null;
}) {
  const router = useRouter();
  const { isSaved, saveRecipe, unsaveRecipe, fetchSaved } = useSaved();

  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [loading, setLoading] = useState(!initialRecipe);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (recipe) {
      recordRecentlyViewedRecipe({
        id: recipeId,
        title: recipe.title,
        description: recipe.description || "",
        language: recipe.language,
        image: recipe.image,
      });
    } else {
      fetchRecipe();
    }
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
        await unsaveRecipe(undefined, recipeId);
      } else {
        await saveRecipe(undefined, recipeId);
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
      <main className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error || ""}</p>
          <BackButton fallbackHref="/" className={styles.backLink} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.topBar}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Browse", href: "/browse" }, { label: recipe.title }]} mobileBackHref="/" />
      </div>

      <div className={styles.fabOnlyMobile}>
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
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.recipeTitle}>{recipe.title}</h1>

        <div className={styles.titleActions}>
          {canEditRecipe && (
            <button
              type="button"
              className={styles.editPill}
              onClick={handleEdit}
            >
              <span className="material-symbols-outlined" aria-hidden="true">edit</span>
              Edit
            </button>
          )}
          <button
            type="button"
            className={`${styles.saveIconBtn} ${saved ? styles.saveIconBtnActive : ""}`}
            onClick={handleSaveRecipe}
            disabled={isSavingRecipe}
            aria-label={saved ? "Remove from saved" : "Save recipe"}
            title={saved ? "Remove from saved" : "Save recipe"}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {saved ? "favorite" : "favorite_border"}
            </span>
          </button>
        </div>
      </div>

      {recipe.subtitle && <p className={styles.recipeSubtitle}>{recipe.subtitle}</p>}

      {(() => {
        const author = getRecipeAuthor(recipe);
        if (!author) return null;
        return (
          <div className={styles.byline}>
            <AccountAvatar account={author} size={28} />
            <span className={styles.bylineName}>{getAccountDisplayName(author)}</span>
            {recipe.createdAt && (
              <span className={styles.bylineDate}>
                {new Date(recipe.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        );
      })()}

      <div className={styles.metaRow}>
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

          <span className={styles.metaChip}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            {recipe.views}
          </span>

          {recipe.likes > 0 && (
            <span className={styles.metaChip}>
              <span className="material-symbols-outlined" aria-hidden="true">thumb_up</span>
              {recipe.likes}
            </span>
          )}

          {recipe.servings > 0 && (
            <span className={styles.metaChip}>
              <span className="material-symbols-outlined" aria-hidden="true">restaurant</span>
              {recipe.servings} servings
            </span>
          )}
        </div>

        {getVisibleTags(recipe.tags).length > 0 && (
          <div className={styles.tagsRow}>
            {getVisibleTags(recipe.tags).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        <div className={styles.layout}>

          {recipe.image && (
            <div className={styles.imageContainer}>
              <img
                src={recipe.image}
                alt={recipe.title}
                className={styles.recipeImage}
                fetchPriority="high"
              />
            </div>
          )}

          {recipe.description && <p className={styles.recipeDescription}>{recipe.description}</p>}

          <div className={styles.ingredientsSection}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>

          {recipe.mainIngredients && recipe.mainIngredients.length > 0 && (
            <div className={styles.ingredientGroup}>
              <h3 className={styles.ingredientGroupTitle}>Main Ingredients</h3>
              <ul className={styles.ingredientsList}>
                {recipe.mainIngredients.map((ing, idx) => (
                  <li key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientName}>{ing.name}</span>
                    {formatIngredientAmount(ing) && <span className={styles.ingredientDots} />}
                    {formatIngredientAmount(ing) && <span className={styles.ingredientAmount}>{formatIngredientAmount(ing)}</span>}
                    {ing.note && <span className={styles.note}>{ing.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.seasonings && recipe.seasonings.length > 0 && (
            <div className={styles.ingredientGroup}>
              <h3 className={styles.ingredientGroupTitle}>Seasonings</h3>
              <ul className={styles.ingredientsList}>
                {recipe.seasonings.map((ing, idx) => (
                  <li key={idx} className={styles.ingredientItem}>
                    <span className={styles.ingredientName}>{ing.name}</span>
                    {formatIngredientAmount(ing) && <span className={styles.ingredientDots} />}
                    {formatIngredientAmount(ing) && <span className={styles.ingredientAmount}>{formatIngredientAmount(ing)}</span>}
                    {ing.note && <span className={styles.note}>{ing.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.directionsSection}>
          <h2 className={styles.sectionTitle}>Steps</h2>
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

        {recipe.tips?.trim() && (
          <section className={styles.tipsSection}>
            <h2 className={styles.sectionTitle}>Pro tips</h2>
            <p className={styles.tipsText}>{recipe.tips}</p>
          </section>
        )}

        </div>

        <CommentSection
        entryType="recipe"
        entryId={recipeId}
        card
        title="Reviews"
        ratingSlot={
          <div className={styles.mergedRating}>
            <span className={styles.mergedRatingLabel}>Rate this recipe</span>
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
            {ratingSubmitting ? (
              <span className={styles.ratingMessage}>Submitting...</span>
            ) : ratingSubmitted ? (
              <span className={styles.ratingMessage}>You rated this {selectedRating}/5</span>
            ) : (
              ratingMessage && <span className={styles.ratingMessage}>{ratingMessage}</span>
            )}
          </div>
        }
      />
    </main>
  );
}
