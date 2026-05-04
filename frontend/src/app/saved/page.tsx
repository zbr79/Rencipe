"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import { useCreateForm } from "../contexts/CreateFormContext";
import AccountAvatar from "../components/AccountAvatar";
import styles from "./page.module.css";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { getAccountDisplayName } from "../utils/accountAvatar";
import { getRecipeAuthor } from "../utils/recipeAuthor";

export default function SavedPage() {
  const {
    savedRecipes,
    loadingSaved,
    fetchSaved,
    removeFavorite,
    mealPlans,
    loadingPlans,
    fetchMealPlans,
    deleteMealPlan,
  } = useSaved();
  const { openCreateForm, setShowMealPlanForm } = useCreateForm();

  const [activeTab, setActiveTab] = useState<"recipes" | "plans">("recipes");
  const [filters, setFilters] = useState({
    searchTerm: "",
  });
  const openMealPlanForm = () => {
    setShowMealPlanForm(true);
    openCreateForm();
  };

  useEffect(() => {
    fetchSaved();
    fetchMealPlans();
  }, []);

  const filteredRecipes = savedRecipes.filter((recipe) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesPinyinSearch(filters.searchTerm, recipe.title) ||
      matchesPinyinSearch(filters.searchTerm, recipe.description);

    return matchesSearch;
  });

  const filteredPlans = mealPlans.filter((plan) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesPinyinSearch(filters.searchTerm, plan.name);

    return matchesSearch;
  });
  const getPlanRecipeCount = (plan: any) => {
    const scheduledCount = (plan.days || []).reduce((total: number, day: any) => {
      return total + (day.meals || []).reduce((mealTotal: number, meal: any) => mealTotal + (meal.recipes?.length || 0), 0);
    }, 0);
    return scheduledCount || plan.recipes?.length || 0;
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteMealPlan(planId);
      await fetchMealPlans();
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  };

  const handleRemoveSavedRecipe = async (recipeId: string) => {
    await removeFavorite(undefined, recipeId);
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder={
            activeTab === "recipes" ? "Search saved recipes" : "Search meal plans"
          }
          value={filters.searchTerm}
          onChange={(e) =>
            setFilters({ ...filters, searchTerm: e.target.value })
          }
          className={styles.searchInput}
        />
      </div>

      {/* Tabs */}
      <div className={styles.segmentedTabs}>
        <button
          onClick={() => setActiveTab("recipes")}
          className={`${styles.segmentedTab} ${activeTab === "recipes" ? styles.segmentedTabActive : ""}`}
        >
          Recipes ({savedRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`${styles.segmentedTab} ${activeTab === "plans" ? styles.segmentedTabActive : ""}`}
        >
          Meal Plans ({mealPlans.length})
        </button>
      </div>

      {/* ===== Recipes Tab ===== */}
      {activeTab === "recipes" && (
        <>
          <div className={styles.count}>
            Saved {filteredRecipes.length} recipes
          </div>

          {loadingSaved && <p className={styles.loading}>Loading...</p>}

          {!loadingSaved && filteredRecipes.length === 0 && (
            <div className={styles.empty}>
              <p>
                {savedRecipes.length === 0
                  ? "You have not saved any recipes yet"
                  : "No matching recipes found"}
              </p>
              <Link href="/" className={styles.createLink}>
                Back to Home
              </Link>
            </div>
          )}

          <div className={styles.savedList}>
            {filteredRecipes.map((recipe) => {
              const recipeId = recipe._id || recipe.id;
              const author = getRecipeAuthor(recipe);

              return (
                <div key={recipeId} className={styles.swipeRow}>
                  <div className={styles.savedRecipeRow}>
                    <Link href={`/recipes/${recipeId}`} className={styles.savedRecipeLink}>
                      <div className={styles.savedRecipeImage}>
                        {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span className="material-symbols-outlined">restaurant</span>}
                      </div>
                      <div className={styles.savedRecipeText}>
                        <h3>{recipe.title}</h3>
                        <div className={styles.uploaderLine}>
                          <AccountAvatar account={author} size={24} />
                          <span>{getAccountDisplayName(author)}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                  <button
                    type="button"
                    className={styles.swipeDeleteButton}
                    onClick={() => handleRemoveSavedRecipe(recipeId)}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== Plan Tab ===== */}
      {activeTab === "plans" && (
        <>
          <div className={styles.planToolbar}>
            <div className={styles.count}>
              Total {filteredPlans.length} plans
            </div>
            <button
              onClick={openMealPlanForm}
              className={styles.newPlanButton}
            >
              New Plan
            </button>
          </div>

          {loadingPlans && <p className={styles.loading}>Loading...</p>}

          {!loadingPlans && filteredPlans.length === 0 && (
            <div className={styles.empty}>
              <p>
                {mealPlans.length === 0
                  ? "You have not created any meal plans yet"
                  : "No matching plans found"}
              </p>
              <button
                onClick={openMealPlanForm}
                className={styles.newPlanButton}
              >
                Create your first plan
              </button>
            </div>
          )}

          <div className={styles.savedList}>
            {filteredPlans.map((plan) => (
              <div key={plan._id} className={styles.swipeRow}>
                <Link href={`/meal-plans/${plan._id}`} className={styles.savedPlanRow}>
                  <h3>{plan.name}</h3>
                  <span>{getPlanRecipeCount(plan)} recipes</span>
                </Link>
                <button
                  type="button"
                  className={styles.swipeDeleteButton}
                  onClick={() => handleDeletePlan(plan._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
