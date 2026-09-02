"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import AccountAvatar from "../components/AccountAvatar";
import EmptyState from "../components/EmptyState";
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
  } = useSaved();
  const swipeRowDrag = useSwipeRowDrag();

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

  const handleRemoveSavedRecipe = async (recipeId: string) => {
    await unsaveRecipe(undefined, recipeId);
  };

  return (
    <div className={styles.container}>

      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder="Search saved recipes"
          value={filters.searchTerm}
          onChange={(e) =>
            setFilters({ ...filters, searchTerm: e.target.value })
          }
          className={styles.searchInput}
        />
      </div>

      <>
          <div className={styles.count}>
            Saved {filteredRecipes.length} recipes
          </div>

          {loadingSaved && <p className={styles.loading}>Loading...</p>}

          {!loadingSaved && filteredRecipes.length === 0 && (
            <EmptyState
              icon="favorite_border"
              title={savedRecipes.length === 0 ? "No saved recipes yet" : "No matching recipes"}
              subtitle={savedRecipes.length === 0 ? "Save recipes you like and find them here." : "Try a different filter."}
              actionLabel="Browse recipes"
              actionHref={savedRecipes.length === 0 ? "/browse" : undefined}
            />
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
    </div>
  );
}
