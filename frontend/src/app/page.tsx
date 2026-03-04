"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useSaved } from "./contexts/SavedContext";

type Recipe = {
  id: string;
  _id?: string;
  title: string;
  description: string;
  image?: string;
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt?: string;
  updatedAt?: string;
};

type ListRes = { recipes: Recipe[] };

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recommended");
  const { isSaved, addFavorite, removeFavorite } = useSaved();
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  async function fetchRecipes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes`, {
        method: "GET",
        credentials: "include",
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;

      if (!res.ok) {
        throw new Error(
          (data && (data.error || data.message)) || text || `HTTP ${res.status}`
        );
      }

      const parsed = data as ListRes;
      setRecipes(Array.isArray(parsed?.recipes) ? parsed.recipes : []);
    } catch (e: any) {
      setError(e?.message || "");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id: "following", label: "关注" },
    { id: "recommended", label: "推荐" },
    { id: "trending", label: "热门" },
    { id: "categories", label: "分类" },
  ];

  return (
    <main className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchInput}>
          <span className={styles.searchIcon}>search</span>
          <input 
            type="text" 
            placeholder="搜索食谱..." 
            readOnly
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Featured Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <h3 className={styles.bannerTitle}>精选食谱</h3>
          <p className={styles.bannerSubtitle}>今日发现</p>
        </div>
        <span className={styles.bannerArrow}>→</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
        </div>
      ) : recipes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🍳</div>
          <h3 className={styles.emptyTitle}>尚无食谱</h3>
          <p className={styles.emptyDescription}>
            成为第一个分享食谱的人！
          </p>
          <Link href="/create" className={styles.emptyButton}>
            + 创建食谱
          </Link>
        </div>
      ) : (
        <div className={styles.recipeGrid}>
          {recipes.map((r) => (
            <div key={r._id || r.id} className={styles.recipeCardWrapper}>
              <Link href={`/recipes/${r._id || r.id}`} className={styles.recipeCard}>
                <div className={styles.cardImage}>
                  {r.image ? (
                    <img src={r.image} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>🍽️</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{r.title}</h3>
                  
                  <div className={styles.cardMeta}>
                    <span>❤️ {r.likes} • 👁️ {r.views}</span>
                    {r.ratingCount > 0 && (
                      <span style={{ marginLeft: "8px" }}>⭐ {r.ratingAverage.toFixed(1)}</span>
                    )}
                  </div>

                  {r.description && (
                    <p className={styles.cardDescription}>
                      {r.description.length > 60 ? r.description.slice(0, 60) + "…" : r.description}
                    </p>
                  )}
                </div>
              </Link>
              
              {/* Save Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const saved = isSaved(r._id || r.id);
                  if (saved) {
                    removeFavorite(userId, r._id || r.id);
                  } else {
                    addFavorite(userId, r._id || r.id);
                  }
                }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "20px",
                  zIndex: 10,
                }}
                title={isSaved(r._id || r.id) ? "取消保存" : "保存食谱"}
              >
                {isSaved(r._id || r.id) ? "❤️" : "🤍"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
