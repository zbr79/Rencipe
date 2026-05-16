"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import AccountAvatar from "../components/AccountAvatar";
import styles from "./page.module.css";
import { getAccountDisplayName } from "../utils/accountAvatar";
import { getRecipeAuthor } from "../utils/recipeAuthor";
import { useSwipeRowDrag } from "../hooks/useSwipeRowDrag";
import { matchesTextSearch } from "../utils/textSearch";

export default function SavedPage() {
  const {
    savedRecipes,
    loadingSaved,
    fetchSaved,
    unsaveRecipe,
    savedMeals,
    unsaveMeal,
  } = useSaved();
  const swipeRowDrag = useSwipeRowDrag();

  const [activeTab, setActiveTab] = useState<"recipes" | "meals">("recipes");
  const [filters, setFilters] = useState({
    searchTerm: "",
  });

  useEffect(() => {
    fetchSaved();
  }, []);

  const filteredRecipes = savedRecipes.filter((recipe) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesTextSearch(filters.searchTerm, recipe.title, recipe.description);

    return matchesSearch;
  });

  const filteredMeals = savedMeals.filter((meal) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesTextSearch(filters.searchTerm, meal.name);

    return matchesSearch;
  });

  const getMealRecipeCount = (meal: any) => {
    return meal.recipes?.length || 0;
  };

  const handleRemoveSavedRecipe = async (recipeId: string) => {
    await unsaveRecipe(undefined, recipeId);
  };

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder={
            activeTab === "recipes" ? "Search saved recipes" : "Search saved meals"
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
          onClick={() => setActiveTab("meals")}
          className={`${styles.segmentedTab} ${activeTab === "meals" ? styles.segmentedTabActive : ""}`}
        >
          Meals ({savedMeals.length})
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
                <div key={recipeId} className={styles.swipeRow} {...swipeRowDrag}>
                  <Link href={`/recipes/${recipeId}`} className={styles.savedRecipeRow}>
                    <div className={styles.savedRecipeLink}>
                      <div className={styles.savedRecipeImage}>
                        {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span className="material-symbols-outlined">restaurant</span>}
                      </div>
                      <div className={styles.savedRecipeText}>
                        <h3>{recipe.title}</h3>
                        <div className={styles.uploaderLine}>
                          <AccountAvatar account={author} size={18} />
                          <span>{getAccountDisplayName(author)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={styles.swipeDeleteButton}
                    onClick={() => handleRemoveSavedRecipe(recipeId)}
                    aria-label={`Unsave ${recipe.title}`}
                  >
                    Unsave
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== Meals Tab ===== */}
      {activeTab === "meals" && (
        <>
          <div className={styles.mealToolbar}>
            <div className={styles.count}>
              Saved {filteredMeals.length} meals
            </div>
          </div>

          {loadingSaved && <p className={styles.loading}>Loading...</p>}

          {!loadingSaved && filteredMeals.length === 0 && (
            <div className={styles.empty}>
              <p>
                {savedMeals.length === 0
                  ? "You have not saved any meals yet"
                  : "No matching meals found"}
              </p>
              <Link href="/browse" className={styles.createLink}>Browse</Link>
            </div>
          )}

          <div className={styles.savedList}>
            {filteredMeals.map((meal) => (
              <div key={meal._id} className={styles.swipeRow} {...swipeRowDrag}>
                <Link href={`/meals/${meal._id}`} className={styles.savedMealRow}>
                  <h3>{meal.name}</h3>
                  <span>{getMealRecipeCount(meal)} recipes</span>
                  <div className={styles.uploaderLine}>
                    <AccountAvatar account={meal.userId as any} size={18} />
                    <span>{getAccountDisplayName(meal.userId as any)}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  className={styles.swipeDeleteButton}
                  onClick={() => unsaveMeal(undefined, meal._id)}
                  aria-label={`Unsave ${meal.name}`}
                >
                  Unsave
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
