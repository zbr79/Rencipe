"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../recipes/page.module.css";
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
  authorId: string;
  image?: string;
}

export default function ProfilePage() {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchUserRecipes();
  }, []);

  const fetchUserRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/recipes?limit=1000`);

      if (!response.ok) {
        throw new Error("获取食谱失败");
      }

      const data = await response.json();
      // Filter recipes by user's authorId
      const myRecipes = data.recipes?.filter((recipe: Recipe) => recipe.authorId === userId) || [];
      // Enrich with mock images
      const enrichedRecipes = enrichRecipesWithMockImages(myRecipes);
      setUserRecipes(enrichedRecipes);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalLikes = userRecipes.reduce((sum, recipe) => sum + recipe.likes, 0);
  const totalViews = userRecipes.reduce((sum, recipe) => sum + recipe.views, 0);
  const averageRating =
    userRecipes.filter((r) => r.ratingCount > 0).length > 0
      ? (
          userRecipes.filter((r) => r.ratingCount > 0).reduce((sum, recipe) => sum + recipe.ratingAverage, 0) /
          userRecipes.filter((r) => r.ratingCount > 0).length
        ).toFixed(1)
      : "N/A";

  return (
    <div className={styles.container}>
      <h1>我的资料</h1>

      {error && <div className={styles.error}>错误: {error}</div>}

      {/* Profile Stats */}
      <div
        style={{
          background: "var(--bg-secondary)",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{userRecipes.length}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>已发布食谱</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalLikes}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>获赞</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalViews}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>浏览量</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{averageRating}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>平均评分</div>
        </div>
      </div>

      {/* Recipes Count */}
      <div className={styles.count}>
        共发布 {userRecipes.length} 个食谱
      </div>

      {/* Loading State */}
      {loading && <p className={styles.loading}>加载中...</p>}

      {/* Empty State */}
      {!loading && userRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>您还没有发布任何食谱</p>
          <Link href="/create" className={styles.createLink}>
            创建第一个食谱
          </Link>
        </div>
      )}

      {/* User Recipes Grid */}
      <div className={styles.grid}>
        {userRecipes.map((recipe) => (
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
