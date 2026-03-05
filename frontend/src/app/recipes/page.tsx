"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../utils/pinyinSearch";

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
      const response = await fetch(`/api/recipes?limit=100`);

      if (!response.ok) {
        throw new Error("获取食谱失败");
      }

      const data = await response.json();
      // Enrich recipes with mock images if they don't have images
      const enrichedRecipes = enrichRecipesWithMockImages(data.recipes);
      setRecipes(enrichedRecipes);

      // Extract all unique tags
      const tags = new Set<string>();
      enrichedRecipes?.forEach((recipe: Recipe) => {
        recipe.tags?.forEach((tag) => tags.add(tag));
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

  return (
    <div className={styles.container}>
      <h1>食谱</h1>

      {error && <div className={styles.error}>错误: {error}</div>}

      {/* Filters */}
      <div className={styles.filtersSection}>
        <h2>筛选</h2>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="搜索食谱..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters({ ...filters, searchTerm: e.target.value })
            }
            className={styles.searchInput}
          />

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>按标签筛选</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
                    style={{
                      padding: "8px 12px",
                      background: filters.selectedTags.includes(tag) ? "#667eea" : "#f0f0f0",
                      color: filters.selectedTags.includes(tag) ? "white" : "black",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={fetchRecipes} className={styles.refreshBtn}>
            刷新
          </button>
        </div>
      </div>

      {/* Recipes Count */}
      <div className={styles.count}>
        找到 {filteredRecipes.length} / {recipes.length} 个食谱
      </div>

      {/* Loading State */}
      {loading && <p className={styles.loading}>加载中...</p>}

      {/* Empty State */}
      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>尚无食谱</p>
          <Link href="/create" className={styles.createLink}>
            创建食谱
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
            {recipe.image && (
              <div style={{ width: "100%", height: "200px", overflow: "hidden", borderRadius: "8px 8px 0 0" }}>
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
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
                🍽️ {recipe.servings || 1} 人份
              </span>
            </div>

            {recipe.tags.length > 0 && (
              <div className={styles.tags}>
                {recipe.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 3 && (
                  <span className={styles.tag}>
                    +{recipe.tags.length - 3}
                  </span>
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
