"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { getVisibleTags, hasHealthTag } from "../utils/recipeTags";
import { authFetch } from "../utils/authSession";

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  description: string;
  servings: number;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  image?: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedTags: [] as string[],
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/recipes?limit=100`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data = await response.json();
      // Enrich recipes with mock images if they don't have images
      const enrichedRecipes = enrichRecipesWithMockImages<Recipe>((data.recipes || []) as Recipe[]);
      setRecipes(enrichedRecipes);

      // Extract all unique tags
      const tags = new Set<string>();
      enrichedRecipes?.forEach((recipe: Recipe) => {
        getVisibleTags(recipe.tags).forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      !filters.searchTerm ||
      matchesPinyinSearch(filters.searchTerm, recipe.title) ||
      matchesPinyinSearch(filters.searchTerm, recipe.description);

    const matchesTags =
      filters.selectedTags.length === 0 ||
      filters.selectedTags.every((tag) => recipe.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const healthCount = recipes.filter((recipe) => hasHealthTag(recipe.tags)).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Recipe Library</p>
          <h1>Browse Recipes</h1>
          <p className={styles.headerMeta}>
            {recipes.length} recipes, {healthCount} health-tagged
          </p>
        </div>
        <Link href="/create" className={styles.createButton}>
          <span className="material-symbols-outlined">add</span>
          Create
        </Link>
      </header>

      {error && <div className={styles.error}>Error: {error}</div>}

      <section className={styles.filtersSection}>
        <div className={styles.filtersHeader}>
          <h2>Filters</h2>
          <button onClick={fetchRecipes} className={styles.refreshBtn}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters({ ...filters, searchTerm: e.target.value })
            }
            className={styles.searchInput}
          />

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className={styles.tagFilter}>
              <h3>Tags</h3>
              <div className={styles.tagList}>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        selectedTags: prev.selectedTags.includes(tag)
                          ? prev.selectedTags.filter((t) => t !== tag)
                          : [...prev.selectedTags, tag],
                      }));
                    }}
                    className={`${styles.tagButton} ${filters.selectedTags.includes(tag) ? styles.tagButtonActive : ""}`}
                  >
                    {tag}
                  </button>
                ))}
                {filters.selectedTags.length > 0 && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => setFilters((prev) => ({ ...prev, selectedTags: [] }))}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recipes Count */}
      <div className={styles.count}>
        Found {filteredRecipes.length} / {recipes.length} recipes
      </div>

      {/* Loading State */}
      {loading && <p className={styles.loading}>Loading...</p>}

      {/* Empty State */}
      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>No recipes yet</p>
          <Link href="/create" className={styles.createLink}>
            Create Recipe
          </Link>
        </div>
      )}

      {/* Recipes Grid */}
      <div className={styles.grid}>
        {filteredRecipes.map((recipe) => (
          <Link
            key={recipe._id || recipe.id}
            href={`/recipes/${recipe._id || recipe.id}`}
            className={styles.card}
          >
            {recipe.image && (
              <div className={styles.cardImage}>
                <img src={recipe.image} alt={recipe.title} />
              </div>
            )}
            <div className={styles.cardHeader}>
              <h3>{recipe.title}</h3>
            </div>

            <p className={styles.description}>
              {recipe.description || ""}
            </p>

            <div className={styles.meta}>
              <span className={styles.metaItem}>
                🍽️ {recipe.servings || 1} servings
              </span>
            </div>

            {getVisibleTags(recipe.tags).length > 0 && (
              <div className={styles.tags}>
                {getVisibleTags(recipe.tags).slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {getVisibleTags(recipe.tags).length > 3 && (
                  <span className={styles.tag}>
                    +{getVisibleTags(recipe.tags).length - 3}
                  </span>
                )}
              </div>
            )}

            <div className={styles.stats}>
              <span>{recipe.likes} saves</span>
              <span>{recipe.views} views</span>
              {recipe.ratingCount > 0 && (
                <span>{recipe.ratingAverage.toFixed(1)} rating</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
