"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useSaved } from "./contexts/SavedContext";
import AccountAvatar from "./components/AccountAvatar";
import { hasHealthTag } from "./utils/recipeTags";
import { authFetch } from "./utils/authSession";
import { getAccountDisplayName, type AccountIdentity } from "./utils/accountAvatar";
import { getRecipeAuthor } from "./utils/recipeAuthor";

type Recipe = {
  id: string;
  _id?: string;
  title: string;
  description: string;
  author?: AccountIdentity | null;
  authorId?: string | AccountIdentity | null;
  image?: string;
  component?: boolean;
  servings?: number;
  tags?: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  isPublic?: boolean;
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
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const { isSaved, addFavorite, removeFavorite, fetchSaved } = useSaved();
  const publicRecipes = recipes.filter((recipe) => recipe.isPublic !== false);
  const featuredRecipes = publicRecipes.filter((recipe) => recipe.image).slice(0, 10);

  async function fetchRecipes() {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`/api/recipes`, {
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

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveSlideIndex(0);
    if (featuredRecipes.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % featuredRecipes.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [featuredRecipes.length]);

  const tabs = [
    { id: "recommended", label: "Recommended" },
    { id: "healthy", label: "Healthy" },
    { id: "quick", label: "Quick" },
    { id: "dinner", label: "Dinner" },
  ];

  const visibleRecipes = publicRecipes.filter((recipe) => {
    const tags = recipe.tags || [];
    if (activeTab === "healthy") return hasHealthTag(tags);
    if (activeTab === "quick") return tags.some((tag) => ["Quick", "Easy", "Meal prep"].includes(tag));
    if (activeTab === "dinner") return tags.some((tag) => ["Dinner", "Family dinner", "Protein", "Chicken", "Seafood"].includes(tag));
    return true;
  });

  function goToSlide(direction: -1 | 1) {
    if (featuredRecipes.length <= 1) return;
    setActiveSlideIndex((current) => (current + direction + featuredRecipes.length) % featuredRecipes.length);
  }

  return (
    <main className={styles.container}>
      <section className={styles.dashboard}>
        <div className={styles.dashboardContent}>
          {featuredRecipes.length > 0 ? (
            <div
              className={styles.carouselTrack}
              style={{ transform: `translate3d(-${activeSlideIndex * 100}%, 0, 0)` }}
            >
              {featuredRecipes.map((recipe) => (
                <Link key={recipe._id || recipe.id} href={`/recipes/${recipe._id || recipe.id}`} className={styles.slideCard}>
                  <img src={recipe.image!} alt={recipe.title} className={styles.slideImage} />
                  <div className={styles.slideShade} />
                  <div className={styles.slideContent}>
                    <h1>{recipe.title}</h1>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.slideFallback}>
              <h1>Fresh recipes for this week</h1>
            </div>
          )}

          {featuredRecipes.length > 1 && (
            <>
              <button type="button" className={`${styles.slideArrow} ${styles.slideArrowLeft}`} onClick={() => goToSlide(-1)} aria-label="Previous recipe">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className={`${styles.slideArrow} ${styles.slideArrowRight}`} onClick={() => goToSlide(1)} aria-label="Next recipe">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <div className={styles.slideDots} aria-label="Featured recipes">
                {featuredRecipes.map((recipe, index) => (
                  <button
                    key={recipe._id || recipe.id}
                    type="button"
                    aria-label={`Show ${recipe.title}`}
                    className={index === activeSlideIndex % featuredRecipes.length ? styles.slideDotActive : ""}
                    onClick={() => setActiveSlideIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

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
          <h3 className={styles.emptyTitle}>No recipes yet</h3>
          <p className={styles.emptyDescription}>
            Be the first to share a recipe.
          </p>
          <Link href="/create" className={styles.emptyButton}>
            + Create Recipe
          </Link>
        </div>
      ) : (
        <div className={styles.recipeGrid}>
          {visibleRecipes.map((r) => {
            const recipeId = r._id || r.id;
            const saved = isSaved(recipeId);
            const author = getRecipeAuthor(r);
            return (
            <div key={recipeId} className={styles.recipeCardWrapper}>
              <article className={styles.recipeCard}>
                <Link href={`/recipes/${recipeId}`} className={styles.cardLink}>
                  <div className={styles.cardImage}>
                    {r.image ? (
                      <img src={r.image} alt={r.title} />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{r.title}</h3>
                  </div>
                </Link>

                <div className={styles.cardFooter}>
                  <div className={styles.uploaderLine}>
                    <AccountAvatar account={author} size={24} />
                    <span>{getAccountDisplayName(author)}</span>
                  </div>
                </div>
              </article>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (saved) {
                    removeFavorite(undefined, recipeId);
                  } else {
                    addFavorite(undefined, recipeId);
                  }
                }}
                className={`${styles.saveButton} ${saved ? styles.saveButtonActive : ""}`}
                title={saved ? "Remove from saved" : "Save recipe"}
                aria-label={saved ? "Remove from saved" : "Save recipe"}
              >
                <span className="material-symbols-outlined">{saved ? "bookmark" : "bookmark_border"}</span>
              </button>
            </div>
          );
          })}
        </div>
      )}
    </main>
  );
}
