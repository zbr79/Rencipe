"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useSaved } from "./contexts/SavedContext";
import AccountAvatar from "./components/AccountAvatar";
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

const AUTO_SCROLL_DELAY_MS = 4200;
const MANUAL_SLIDE_PAUSE_MS = 9000;
const SWIPE_THRESHOLD_PX = 42;
const SWIPE_THRESHOLD_RATIO = 0.18;
const SWIPE_REVERSAL_CANCEL_RATIO = 0.55;
const DESKTOP_DRAG_MULTIPLIER = 1.7;

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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recommended");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [autoplayResumeAt, setAutoplayResumeAt] = useState(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDraggingSlide, setIsDraggingSlide] = useState(false);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeDeltaXRef = useRef(0);
  const swipePeakDeltaXRef = useRef(0);
  const swipeWidthRef = useRef(1);
  const swipePointerTypeRef = useRef<string>("");
  const suppressSlideClickUntilRef = useRef(0);
  const { isSaved, addFavorite, removeFavorite, fetchSaved } = useSaved();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveSlideIndex((current) => {
      if (featuredRecipes.length === 0) return 0;
      return current % featuredRecipes.length;
    });
  }, [featuredRecipes.length]);

  useEffect(() => {
    if (featuredRecipes.length <= 1 || isDraggingSlide) return;

    const pauseMs = Math.max(0, autoplayResumeAt - Date.now());
    const timeoutId = window.setTimeout(() => {
      setActiveSlideIndex((current) => (current + 1) % featuredRecipes.length);
    }, pauseMs + AUTO_SCROLL_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeSlideIndex, autoplayResumeAt, featuredRecipes.length, isDraggingSlide]);

  const tabs = [
    { id: "recommended", label: "Recommended" },
    { id: "newest", label: "Newest" },
    { id: "health", label: "Health" },
    { id: "quick", label: "Quick" },
  ];

  const baseRecipes = activeTab === "recommended" ? recommendedPublicRecipes : newestPublicRecipes;

  const visibleRecipes = baseRecipes.filter((recipe) => {
    const tags = (recipe.tags || []).map((tag) => tag.toLowerCase());
    if (activeTab === "health") return tags.some((tag) => tag.includes("health"));
    if (activeTab === "quick") return tags.some((tag) => tag.includes("quick"));
    return true;
  });

  function pauseAutoplay() {
    setAutoplayResumeAt(Date.now() + MANUAL_SLIDE_PAUSE_MS);
  }

  function goToSlide(direction: -1 | 1, pause = false) {
    if (featuredRecipes.length <= 1) return;
    if (pause) pauseAutoplay();
    setActiveSlideIndex((current) => (current + direction + featuredRecipes.length) % featuredRecipes.length);
  }

  function showSlide(index: number) {
    if (featuredRecipes.length <= 1) return;
    pauseAutoplay();
    setActiveSlideIndex(index);
  }

  function handleSlidePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartXRef.current = event.clientX;
    swipeDeltaXRef.current = 0;
    swipePeakDeltaXRef.current = 0;
    swipeWidthRef.current = event.currentTarget.clientWidth || 1;
    swipePointerTypeRef.current = event.pointerType;
    setDragOffsetX(0);
    setIsDraggingSlide(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSlidePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (swipeStartXRef.current === null) return;
    const dragMultiplier = swipePointerTypeRef.current === "mouse" ? DESKTOP_DRAG_MULTIPLIER : 1;
    const rawOffset = (event.clientX - swipeStartXRef.current) * dragMultiplier;
    const nextOffset = Math.max(
      -swipeWidthRef.current,
      Math.min(swipeWidthRef.current, rawOffset)
    );
    swipeDeltaXRef.current = nextOffset;
    if (Math.abs(nextOffset) > Math.abs(swipePeakDeltaXRef.current)) {
      swipePeakDeltaXRef.current = nextOffset;
    }
    setDragOffsetX(nextOffset);
  }

  function finishSlidePointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (swipeStartXRef.current === null) return;

    const deltaX = swipeDeltaXRef.current;
    const peakDeltaX = swipePeakDeltaXRef.current;
    const releaseTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest("a[href]");
    swipeStartXRef.current = null;
    swipeDeltaXRef.current = 0;
    swipePeakDeltaXRef.current = 0;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDraggingSlide(false);
    setDragOffsetX(0);

    const swipeThreshold = Math.max(SWIPE_THRESHOLD_PX, swipeWidthRef.current * SWIPE_THRESHOLD_RATIO);
    if (Math.abs(deltaX) < swipeThreshold) {
      if (releaseTarget instanceof HTMLAnchorElement) {
        const href = releaseTarget.getAttribute("href");
        if (href) {
          pauseAutoplay();
          suppressSlideClickUntilRef.current = Date.now() + 400;
          router.push(href);
        }
      }
      return;
    }

    const reversedTowardStart =
      peakDeltaX !== 0 &&
      Math.sign(deltaX) === Math.sign(peakDeltaX) &&
      Math.abs(deltaX) < Math.abs(peakDeltaX) * SWIPE_REVERSAL_CANCEL_RATIO;

    if (reversedTowardStart) {
      return;
    }

    suppressSlideClickUntilRef.current = Date.now() + 400;
    goToSlide(deltaX < 0 ? 1 : -1, true);
  }

  function handleSlideClick(event: React.MouseEvent<HTMLAnchorElement>) {
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
          onPointerMove={handleSlidePointerMove}
          onPointerUp={finishSlidePointer}
          onPointerCancel={finishSlidePointer}
        >
          {featuredRecipes.length > 0 ? (
            <div
              className={styles.carouselTrack}
              style={{
                transform: `translate3d(calc(-${activeSlideIndex * 100}% + ${dragOffsetX}px), 0, 0)`,
                transitionDuration: isDraggingSlide ? "0ms" : undefined,
              }}
            >
              {featuredRecipes.map((recipe) => (
                <Link
                  key={recipe._id || recipe.id}
                  href={`/recipes/${recipe._id || recipe.id}`}
                  className={styles.slideCard}
                  onClick={handleSlideClick}
                >
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
              <h1>Newest recipes for this week</h1>
            </div>
          )}

          {featuredRecipes.length > 1 && (
            <div className={styles.slideDots} aria-label="Newest recipes">
                {featuredRecipes.map((recipe, index) => (
                  <button
                    key={recipe._id || recipe.id}
                    type="button"
                    aria-label={`Show ${recipe.title}`}
                    className={index === activeSlideIndex % featuredRecipes.length ? styles.slideDotActive : ""}
                    onClick={() => showSlide(index)}
                  />
                ))}
            </div>
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
                        removeFavorite(undefined, recipeId);
                      } else {
                        addFavorite(undefined, recipeId);
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
