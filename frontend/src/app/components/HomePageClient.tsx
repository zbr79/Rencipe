"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../page.module.css";
import { useSaved } from "../contexts/SavedContext";
import AccountAvatar from "./AccountAvatar";
import { authFetch } from "../utils/authSession";
import { getAccountDisplayName, type AccountIdentity } from "../utils/accountAvatar";
import { getRecipeAuthor } from "../utils/recipeAuthor";

const TABS = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "health", label: "Health" },
  { id: "quick", label: "Quick" },
];

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

const AUTO_SCROLL_DELAY_MS = 4200;
const SWIPE_THRESHOLD_PX = 48;

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getRecipeCreatedTimestamp(recipe: Recipe) {
  const timestamp = Date.parse(recipe.createdAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRecipeUpdatedTimestamp(recipe: Recipe) {
  const timestamp = Date.parse(recipe.updatedAt || recipe.createdAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRecipeStableId(recipe: Recipe) {
  return String(recipe._id || recipe.id || "");
}

function compareNewestRecipes(left: Recipe, right: Recipe) {
  const createdDiff = getRecipeCreatedTimestamp(right) - getRecipeCreatedTimestamp(left);
  if (createdDiff !== 0) return createdDiff;

  return getRecipeStableId(right).localeCompare(getRecipeStableId(left));
}

function getRecommendationScore(recipe: Recipe) {
  return recipe.ratingAverage * 100 + recipe.ratingCount * 12 + recipe.likes * 5 + recipe.views * 0.1 + getRecipeUpdatedTimestamp(recipe) / 1_000_000_000_000;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recommended");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const swipeStartXRef = useRef<number | null>(null);
  const suppressSlideClickUntilRef = useRef(0);
  const { isSaved, saveRecipe, unsaveRecipe, fetchSaved } = useSaved();
  const publicRecipes = recipes.filter((recipe) => recipe.isPublic !== false);
  const recommendedPublicRecipes = [...publicRecipes].sort((left, right) => {
    const scoreDiff = getRecommendationScore(right) - getRecommendationScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return compareNewestRecipes(left, right);
  });
  const newestPublicRecipes = [...publicRecipes].sort(compareNewestRecipes);
  const featuredRecipes = newestPublicRecipes.filter((recipe) => recipe.image).slice(0, 10);

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
  }, []);

  useEffect(() => {
    fetchSaved();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (featuredRecipes.length <= 1 || paused) return;

    const timeoutId = window.setTimeout(() => {
      setActiveSlideIndex((current) => (current + 1) % featuredRecipes.length);
    }, AUTO_SCROLL_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeSlideIndex, paused, featuredRecipes.length]);

  const tabs = TABS;

  useEffect(() => {
    if (tabParam && TABS.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const selectTab = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/?tab=${tabId}`, { scroll: false });
  };

  const baseRecipes = activeTab === "recommended" ? recommendedPublicRecipes : newestPublicRecipes;

  const visibleRecipes = baseRecipes.filter((recipe) => {
    const tags = (recipe.tags || []).map((tag) => tag.toLowerCase());
    if (activeTab === "health") return tags.some((tag) => tag.includes("health"));
    if (activeTab === "quick") return tags.some((tag) => tag.includes("quick"));
    return true;
  });

  function showSlide(index: number) {
    if (featuredRecipes.length <= 1) return;
    setActiveSlideIndex(index);
  }

  function handleSlidePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartXRef.current = event.clientX;
    setPaused(true);
  }

  function handleSlidePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (swipeStartXRef.current === null) return;
    const deltaX = event.clientX - swipeStartXRef.current;
    swipeStartXRef.current = null;
    setPaused(false);

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    suppressSlideClickUntilRef.current = Date.now() + 400;
    setActiveSlideIndex((current) => {
      if (featuredRecipes.length <= 1) return current;
      return (current + (deltaX < 0 ? 1 : -1) + featuredRecipes.length) % featuredRecipes.length;
    });
  }

  function handleSlidePointerCancel() {
    swipeStartXRef.current = null;
    setPaused(false);
  }

  function handleSlideClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (Date.now() < suppressSlideClickUntilRef.current) {
      event.preventDefault();
    }
  }

  return (
    <main className={styles.container}>
      <section className={styles.dashboard}>
        <div
          className={styles.dashboardContent}
          onPointerDown={handleSlidePointerDown}
          onPointerUp={handleSlidePointerUp}
          onPointerCancel={handleSlidePointerCancel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {loading ? (
            <div className={styles.heroLoading}>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : featuredRecipes.length > 0 ? (
            <>
              <div className={styles.carouselTrack}>
                {featuredRecipes.map((recipe, index) => {
                  const active = index === activeSlideIndex % featuredRecipes.length;
                  return (
                    <Link
                      key={recipe._id || recipe.id}
                      href={`/recipes/${recipe._id || recipe.id}`}
                      className={`${styles.slideCard} ${active ? styles.slideCardActive : ""}`}
                      onClick={handleSlideClick}
                      onMouseDown={(event) => event.preventDefault()}
                      onDragStart={(event) => event.preventDefault()}
                      aria-hidden={!active}
                      tabIndex={active ? 0 : -1}
                    >
                      <img src={recipe.image!} alt={recipe.title} className={styles.slideImage} draggable={false} />
                      <div className={styles.slideShade} />
                      <div className={styles.slideContent}>
                        <p className={styles.slideKicker}>Featured recipe</p>
                        <h1>{recipe.title}</h1>
                        {recipe.description && <p className={styles.slideDescription}>{recipe.description}</p>}
                        <div className={styles.slideMeta}>
                          {recipe.ratingCount > 0 && <span>{recipe.ratingAverage.toFixed(1)} ★</span>}
                          <span>{recipe.views ?? 0} views</span>
                          <span>{recipe.servings ?? 1} servings</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {featuredRecipes.length > 1 && (
                <div className={styles.slideDots} aria-label="Newest recipes">
                  {featuredRecipes.map((recipe, index) => (
                    <button
                      key={recipe._id || recipe.id}
                      type="button"
                      aria-label={`Show ${recipe.title}`}
                      aria-current={index === activeSlideIndex % featuredRecipes.length ? "true" : undefined}
                      className={index === activeSlideIndex % featuredRecipes.length ? styles.slideDotActive : ""}
                      onClick={() => showSlide(index)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.slideFallback}>
              <h1>Newest recipes for this week</h1>
            </div>
          )}
        </div>

        <aside className={styles.quickPanel} aria-label="Quick actions">
          <div className={styles.quickClock}>
            <p className={styles.quickClockTime}>
              {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className={styles.quickClockDate}>
              {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>

          <nav className={styles.quickActions}>
            <Link href="/create" className={styles.quickActionPrimary}>
              <span className="material-symbols-outlined">add</span>
              New Recipe
            </Link>
            <div className={styles.quickActionRow}>
              <Link href="/browse" className={styles.quickAction}>
                <span className="material-symbols-outlined">category</span>
                Browse
              </Link>
              <Link href="/saved" className={styles.quickAction}>
                <span className="material-symbols-outlined">favorite</span>
                Saved
              </Link>
              <Link href="/drafts" className={styles.quickAction}>
                <span className="material-symbols-outlined">draft</span>
                Drafts
              </Link>
            </div>
          </nav>
        </aside>
      </section>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
        </div>
      )}

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
            + New Recipe
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

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (saved) {
                        unsaveRecipe(undefined, recipeId);
                      } else {
                        saveRecipe(undefined, recipeId);
                      }
                    }}
                    className={`${styles.saveButton} ${saved ? styles.saveButtonActive : ""}`}
                    title={saved ? "Remove from saved" : "Save recipe"}
                    aria-label={saved ? "Remove from saved" : "Save recipe"}
                  >
                    <span className="material-symbols-outlined">{saved ? "favorite" : "favorite_border"}</span>
                  </button>
                </div>
              </article>
            </div>
          );
          })}
        </div>
      )}
    </main>
  );
}
