"use client";

import { useEffect, useRef, useState } from "react";
import { useSaved } from "../contexts/SavedContext";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import RecipeCard from "../components/RecipeCard";
import styles from "./page.module.css";
import { getRecipeAuthor } from "../utils/recipeAuthor";
import { matchesTextSearch } from "../utils/textSearch";

export default function SavedPage() {
  const {
    savedRecipes,
    loadingSaved,
    fetchSaved,
    unsaveRecipe,
  } = useSaved();

  const [filters, setFilters] = useState({
    searchTerm: "",
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const fetchSavedRef = useRef(fetchSaved);

  useEffect(() => {
    let active = true;
    fetchSavedRef.current().finally(() => {
      if (active) setHasLoaded(true);
    });

    return () => {
      active = false;
    };
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

  const isLoading = loadingSaved || !hasLoaded;

  return (
    <main className={styles.container}>
      <div className={styles.pageTop}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Saved" }]} mobileBackHref="/" />
      </div>

      <div className={styles.pageHeader}>
        <div className={styles.resultsTitleGroup}>
          <h2 className={styles.pageTitle}>Saved</h2>
        </div>
        {savedRecipes.length > 0 && (
          <div className={styles.searchBar}>
            <span className={`material-symbols-rounded ${styles.searchBarIcon}`} aria-hidden="true">
              search
            </span>
            <label htmlFor="saved-recipe-search" className="visually-hidden">
              Search within saved recipes
            </label>
            <input
              id="saved-recipe-search"
              type="search"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              className={styles.searchInput}
            />
            {filters.searchTerm && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setFilters({ searchTerm: "" })}
                aria-label="Clear saved recipe search"
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </div>
        )}
        {!isLoading && savedRecipes.length > 0 && (
          <span className={styles.pageCount}>
            {filteredRecipes.length} {filteredRecipes.length === 1 ? "Recipe" : "Recipes"}
          </span>
        )}
      </div>

      {isLoading && <p className={styles.loading}>Loading saved recipes...</p>}

      {!isLoading && savedRecipes.length === 0 && (
        <EmptyState
          icon="favorite_border"
          title="No saved recipes yet"
          actionLabel="Browse"
          actionHref="/browse"
        />
      )}

      {!isLoading && savedRecipes.length > 0 && filteredRecipes.length === 0 && (
        <EmptyState
          icon="search_off"
          title="No matching recipes"
          subtitle="Try a different search term."
          actionLabel="Clear search"
          actionHref="/saved"
        />
      )}

      {!isLoading && filteredRecipes.length > 0 && (
        <div className={styles.savedGrid}>
          {filteredRecipes.map((recipe) => {
            const recipeId = recipe._id || recipe.id;
            const author = getRecipeAuthor(recipe);

            return (
              <RecipeCard
                key={recipeId}
                href={`/recipes/${recipeId}`}
                title={recipe.title}
                subtitle={recipe.description}
                image={recipe.image}
                author={author}
                saved
                onToggleSave={() => handleRemoveSavedRecipe(recipeId)}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
