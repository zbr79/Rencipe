"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../recipes/page.module.css";

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

export default function SearchPage() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  const fetchAllRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/recipes?limit=1000`);

      if (!response.ok) {
        throw new Error("获取食谱失败");
      }

      const data = await response.json();
      setAllRecipes(data.recipes || []);

      // Extract all unique tags
      const tags = new Set<string>();
      data.recipes?.forEach((recipe: Recipe) => {
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

  const filteredRecipes = allRecipes.filter((recipe) => {
    const matchesSearch =
      !searchTerm ||
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => recipe.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <div className={styles.container}>
      <h1>搜索食谱</h1>

      {error && <div className={styles.error}>错误: {error}</div>}

      {/* Search Bar */}
      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder="输入食谱标题或描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          autoFocus
          style={{ fontSize: "16px", marginBottom: "16px" }}
        />

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ marginBottom: "8px", fontSize: "14px" }}>按标签筛选</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  style={{
                    padding: "8px 12px",
                    background: selectedTags.includes(tag) ? "#667eea" : "#f0f0f0",
                    color: selectedTags.includes(tag) ? "white" : "black",
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
      </div>

      {/* Results Count */}
      <div className={styles.count}>
        找到 {filteredRecipes.length} 个食谱
      </div>

      {/* Loading State */}
      {loading && <p className={styles.loading}>加载中...</p>}

      {/* Empty State */}
      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>
            {allRecipes.length === 0 ? "尚无食谱" : "没有找到匹配的食谱"}
          </p>
          {allRecipes.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTags([]);
              }}
              className={styles.createLink}
              style={{
                background: "none",
                border: "1px solid #667eea",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              清除筛选
            </button>
          )}
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
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  overflow: "hidden",
                  borderRadius: "8px 8px 0 0",
                }}
              >
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

            <p className={styles.description}>{recipe.description || ""}</p>

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
