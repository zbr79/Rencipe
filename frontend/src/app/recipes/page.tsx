"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./recipes.module.css";

interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    searchTerm: "",
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/recipes?limit=100`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data = await response.json();
      setRecipes(data.recipes);
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
      recipe.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      recipe.description
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase());

    return matchesSearch;
  });



  return (
    <div className={styles.container}>
      <h1>Recipes</h1>

      {error && <div className={styles.error}>Error: {error}</div>}

      {/* Filters */}
      <div className={styles.filtersSection}>
        <h2>Filters</h2>
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



          <button onClick={fetchRecipes} className={styles.refreshBtn}>
            Refresh
          </button>
        </div>
      </div>

      {/* Recipes Count */}
      <div className={styles.count}>
        Showing {filteredRecipes.length} of {recipes.length} recipes
      </div>

      {/* Loading State */}
      {loading && <p className={styles.loading}>Loading recipes...</p>}

      {/* Empty State */}
      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>No recipes found. Try adjusting your filters.</p>
          <Link href="/create" className={styles.createLink}>
            Create Your First Recipe
          </Link>
        </div>
      )}

      {/* Recipes Grid */}
      <div className={styles.grid}>
        {filteredRecipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <h3>{recipe.title}</h3>
            </div>

            <p className={styles.description}>{recipe.description || "No description provided"}</p>

            <div className={styles.meta}>
              <span className={styles.metaItem}>🍽️ {recipe.servings || 1} servings</span>
            </div>

            {recipe.tags.length > 0 && (
              <div className={styles.tags}>
                {recipe.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 3 && (
                  <span className={styles.tag}>+{recipe.tags.length - 3}</span>
                )}
              </div>
            )}

            <div className={styles.stats}>
              <span>❤️ {recipe.likes}</span>
              <span>👁️ {recipe.views}</span>
              {recipe.ratingCount > 0 && (
                <span>⭐ {recipe.ratingAverage.toFixed(1)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
