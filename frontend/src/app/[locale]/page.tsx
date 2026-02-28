"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./page.module.css";

type Recipe = {
  id: string;
  title: string;
  content: string;
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
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recommended");

  async function fetchRecipes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/recipes`, {
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
      setError(e?.message || t("common.fetchError"));
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
    { id: "following", label: t("home.following") || "Following" },
    { id: "recommended", label: t("home.recommended") || "Recommended" },
    { id: "trending", label: t("home.trending") || "Trending" },
    { id: "categories", label: t("home.categories") || "Categories" },
  ];

  return (
    <main className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchInput}>
          <span className={styles.searchIcon}>search</span>
          <input 
            type="text" 
            placeholder={t("home.searchPlaceholder") || "Search recipes..."} 
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
          <h3 className={styles.bannerTitle}>{t("home.featured") || "Featured Recipes"}</h3>
          <p className={styles.bannerSubtitle}>{t("home.startsToday") || "Discover today"}</p>
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
          <h3 className={styles.emptyTitle}>{t("home.noRecipes")}</h3>
          <p className={styles.emptyDescription}>
            {t("home.beFirst") || "Be the first to share a recipe!"}
          </p>
          <Link href={`/${locale}/create`} className={styles.emptyButton}>
            + {t("home.createRecipe")}
          </Link>
        </div>
      ) : (
        <div className={styles.recipeGrid}>
          {recipes.map((r) => (
            <Link key={r.id} href={`/${locale}/recipes/${r.id}`} className={styles.recipeCard}>
              <div className={styles.cardImage}>
                <div className={styles.imagePlaceholder}>
                  <span>🍽️</span>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{r.title}</h3>
                
                <div className={styles.cardMeta}>
                  <span className={styles.author}>
                    <span className={styles.avatarInitial}>C</span>
                    {t("home.creator") || "Creator"}
                  </span>
                </div>

                {r.content && (
                  <p className={styles.cardDescription}>
                    {r.content.length > 60 ? r.content.slice(0, 60) + "…" : r.content}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
