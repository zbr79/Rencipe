"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

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
        throw new Error("获取食谱失败");
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
