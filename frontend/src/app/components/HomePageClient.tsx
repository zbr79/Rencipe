"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type TransitionEvent as ReactTransitionEvent } from "react";
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
const DRAG_START_THRESHOLD_PX = 10;
const FLICK_MAX_DURATION_MS = 350;
const FLICK_MIN_DISTANCE_PX = 40;
const FLICK_MIN_VELOCITY = 0.3;

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
  const [slidePosition, setSlidePosition] = useState(0);
  const [skipTransition, setSkipTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const dragStartTimeRef = useRef(0);
  const draggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
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
  const slideCount = featuredRecipes.length;
  const activeSlideIndex = slideCount > 0 ? ((slidePosition % slideCount) + slideCount) % slideCount : 0;
  const trackSlides =
    slideCount > 1 ? [featuredRecipes[slideCount - 1], ...featuredRecipes, featuredRecipes[0]] : featuredRecipes;
  const trackBasePercent = slideCount > 1 ? (slidePosition + 1) * 100 : 0;

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
    if (slideCount <= 1 || paused) return;

    const timeoutId = window.setTimeout(() => {
      setSlidePosition((current) => current + 1);
    }, AUTO_SCROLL_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [slidePosition, paused, slideCount]);

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
    if (slideCount <= 1) return;
    setSlidePosition((current) => {
      const normalized = ((current % slideCount) + slideCount) % slideCount;
      const forward = (index - normalized + slideCount) % slideCount;
      const backward = forward - slideCount;
      return current + (forward <= -backward ? forward : backward);
    });
  }

  function handleSlidePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartXRef.current = event.clientX;
    swipeStartYRef.current = event.clientY;
    dragStartTimeRef.current = Date.now();
    setPaused(true);
  }

  function handleSlidePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const startX = swipeStartXRef.current;
    if (startX === null) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - (swipeStartYRef.current ?? startX);

    if (
      !draggingRef.current &&
      Math.abs(deltaX) > DRAG_START_THRESHOLD_PX &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      draggingRef.current = true;
      setDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    if (draggingRef.current) {
      setDragOffset(deltaX);
    }
  }

  function handleSlidePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const startX = swipeStartXRef.current;
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    setPaused(false);

    if (startX === null) return;

    const deltaX = event.clientX - startX;
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    setDragging(false);
    setDragOffset(0);

    if (wasDragging) {
      suppressSlideClickUntilRef.current = Date.now() + 400;
    }

    if (!wasDragging || slideCount <= 1) return;

    const width = dashboardRef.current?.clientWidth ?? 0;
    if (width <= 0) return;

    const elapsed = Date.now() - dragStartTimeRef.current;
    const distance = Math.abs(deltaX);
    const flicked =
      elapsed > 0 &&
      elapsed < FLICK_MAX_DURATION_MS &&
      distance >= FLICK_MIN_DISTANCE_PX &&
      distance / elapsed >= FLICK_MIN_VELOCITY;

    if (distance > width / 2 || flicked) {
      setSlidePosition((current) => current + (deltaX < 0 ? 1 : -1));
    }
  }

  function handleTrackTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "transform" || draggingRef.current || slideCount <= 1) return;
    const normalized = ((slidePosition % slideCount) + slideCount) % slideCount;
    if (normalized === slidePosition) return;
    setSkipTransition(true);
    setSlidePosition(normalized);
    requestAnimationFrame(() => requestAnimationFrame(() => setSkipTransition(false)));
  }

  function handleSlidePointerCancel() {
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    setDragOffset(0);
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
          ref={dashboardRef}
          className={styles.dashboardContent}
          onPointerDown={handleSlidePointerDown}
          onPointerMove={handleSlidePointerMove}
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
              <div
                className={`${styles.carouselTrack}${dragging ? ` ${styles.carouselTrackDragging}` : ""}${skipTransition ? ` ${styles.carouselTrackNoTransition}` : ""}`}
                onTransitionEnd={handleTrackTransitionEnd}
                style={{
                  transform: `translateX(calc(-${trackBasePercent}% + ${dragOffset}px))`,
                }}
              >
                {trackSlides.map((recipe, trackIndex) => {
                  const visibleIndex =
                    trackIndex === 0
                      ? slideCount - 1
                      : trackIndex === slideCount + 1
                        ? 0
                        : trackIndex - 1;
                  const active = visibleIndex === activeSlideIndex;
                  return (
                    <Link
                      key={`slide-${trackIndex}`}
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
                        aria-current={index === activeSlideIndex ? "true" : undefined}
                        className={index === activeSlideIndex ? styles.slideDotActive : ""}
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
