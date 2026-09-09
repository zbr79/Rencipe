"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSaved } from "../contexts/SavedContext";
import RecipeCard from "./RecipeCard";
import Breadcrumbs from "./Breadcrumbs";
import styles from "../search/page.module.css";
import { getVisibleTags } from "../utils/recipeTags";
import { buildExploreCategories } from "../utils/exploreCategories";
import { authFetch, getCurrentUser } from "../utils/authSession";
import { getRecipeAuthor } from "../utils/recipeAuthor";
import type { AccountIdentity } from "../utils/accountAvatar";

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string;
  description: string;
  author?: AccountIdentity | null;
  authorId?: string | AccountIdentity | null;
  servings: number;
  tags: string[];
  likes: number;
  views: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  isPublic?: boolean;
  image?: string;
}

interface Meal {
  _id: string;
  id?: string;
  kind?: "meal";
  name: string;
  recipes?: Array<Recipe | null>;
  userId?: string | AccountIdentity | null;
  isPublic?: boolean;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

type BrowseItem =
  | { type: "recipe"; id: string; recipe: Recipe; title: string; createdAt: string; popularity: number }
  | { type: "meal"; id: string; meal: Meal; title: string; createdAt: string; popularity: number };

type VisibilityTab = "public" | "private";
type SortMode = "popular" | "newest";

function getRecipeTimestamp(recipe: Recipe) {
  const timestamp = Date.parse(recipe.createdAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRecipeStableId(recipe: Recipe) {
  return String(recipe._id || recipe.id || "");
}

function getPopularityScore(recipe: Recipe) {
  return recipe.ratingAverage * 100 + recipe.ratingCount * 12 + recipe.likes * 5 + recipe.views * 0.1;
}

function compareNewestRecipes(left: Recipe, right: Recipe) {
  const dateDiff = getRecipeTimestamp(right) - getRecipeTimestamp(left);
  if (dateDiff !== 0) return dateDiff;
  return getRecipeStableId(right).localeCompare(getRecipeStableId(left));
}

function comparePopularRecipes(left: Recipe, right: Recipe) {
  const scoreDiff = getPopularityScore(right) - getPopularityScore(left);
  if (scoreDiff !== 0) return scoreDiff;
  return compareNewestRecipes(left, right);
}

function getItemTimestamp(item: BrowseItem) {
  const timestamp = Date.parse(item.createdAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareNewestItems(left: BrowseItem, right: BrowseItem) {
  const dateDiff = getItemTimestamp(right) - getItemTimestamp(left);
  if (dateDiff !== 0) return dateDiff;
  return right.id.localeCompare(left.id);
}

function comparePopularItems(left: BrowseItem, right: BrowseItem) {
  const scoreDiff = right.popularity - left.popularity;
  if (scoreDiff !== 0) return scoreDiff;
  return compareNewestItems(left, right);
}

function matchesCategory(recipe: Recipe, categories: string[]) {
  const tags = getVisibleTags(recipe.tags || []).map((tag) => tag.toLowerCase());
  if (categories.length === 0) return true;
  return categories.every((category) => tags.includes(category.toLowerCase()));
}

function matchesVisibility(recipe: Recipe, visibility: VisibilityTab) {
  return visibility === "public" ? recipe.isPublic !== false : recipe.isPublic === false;
}

function matchesMealVisibility(meal: Meal, visibility: VisibilityTab) {
  return visibility === "public" ? meal.isPublic === true : meal.isPublic !== true;
}

function hasAvailableMealRecipes(meal: Meal) {
  return (meal.recipes || []).some((recipe) => Boolean(recipe && (recipe._id || recipe.id)));
}

function getMealId(meal: Meal) {
  return meal._id || meal.id || "";
}

function getMealAuthor(meal: Meal) {
  return typeof meal.userId === "object" ? meal.userId : null;
}

export default function BrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const isGuest = getCurrentUser()?.role === "guest";
  const { isSaved, saveRecipe, unsaveRecipe, fetchSaved, isMealSaved, saveMeal, unsaveMeal } = useSaved();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [visibilityTab, setVisibilityTab] = useState<VisibilityTab>("public");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchBrowseData();
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories(
        categoryParam.split(",").map((category) => category.trim().toLowerCase()).filter(Boolean)
      );
    } else {
      setSelectedCategories([]);
    }
  }, [categoryParam]);

  useEffect(() => {
    fetchSaved();

  }, []);

  const fetchBrowseData = async () => {
    setLoading(true);
    setError("");
    try {
      const [recipeResponse, mealResponse] = await Promise.all([
        authFetch(`/api/recipes?limit=1000`),
        authFetch(`/api/meals?visibility=public&kind=meal`),
      ]);

      if (!recipeResponse.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const recipeData = await recipeResponse.json();
      const mealData = mealResponse.ok ? await mealResponse.json() : { meals: [] };

      setAllRecipes((recipeData.recipes || []) as Recipe[]);
      setAllMeals((mealData.meals || []) as Meal[]);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleRecipes = useMemo(() => allRecipes.filter((recipe) => matchesVisibility(recipe, visibilityTab)), [allRecipes, visibilityTab]);
  const visibleMeals = useMemo(
    () => allMeals.filter((meal) => matchesMealVisibility(meal, visibilityTab)).filter((meal) => visibilityTab === "private" || hasAvailableMealRecipes(meal)),
    [allMeals, visibilityTab]
  );
  const filteredRecipes = visibleRecipes.filter((recipe) => matchesCategory(recipe, selectedCategories));
  const filteredMeals = selectedCategories.length > 0 ? [] : visibleMeals;
  const browseItems = useMemo<BrowseItem[]>(() => {
    const recipeItems = filteredRecipes.map((recipe) => {
      const recipeId = recipe._id || recipe.id;
      return {
        type: "recipe" as const,
        id: recipeId,
        recipe,
        title: recipe.title,
        createdAt: recipe.createdAt,
        popularity: getPopularityScore(recipe),
      };
    });
    const mealItems = filteredMeals.map((meal) => {
      const mealId = getMealId(meal);
      return {
        type: "meal" as const,
        id: mealId,
        meal,
        title: meal.name,
        createdAt: meal.createdAt || meal.updatedAt || "",
        popularity: (meal.recipes?.length || 0) * 20 + (meal.views || 0) * 0.1,
      };
    });
    return [...recipeItems, ...mealItems].sort(sortMode === "popular" ? comparePopularItems : compareNewestItems);
  }, [filteredMeals, filteredRecipes, sortMode]);
  const browseCategories = useMemo(() => {
    return buildExploreCategories(
      visibleRecipes.map((recipe) => ({ tags: getVisibleTags(recipe.tags || []) })),
      12
    ).map((entry) => ({ id: entry.tag, label: entry.tag }));
  }, [visibleRecipes]);

  const toggleCategory = (id: string) => {
    const normalized = id.toLowerCase();
    const next = selectedCategories.includes(normalized)
      ? selectedCategories.filter((category) => category !== normalized)
      : [...selectedCategories, normalized];
    setSelectedCategories(next);
    const query = next.length > 0 ? `?category=${next.map(encodeURIComponent).join(",")}` : "";
    router.replace(`/browse${query}`, { scroll: false });
  };

  const clearCategories = () => {
    setSelectedCategories([]);
    router.replace("/browse", { scroll: false });
  };

   return (
    <main className={styles.page}>
      <div className={styles.pageTop}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Browse" }]} mobileBackHref="/" />
      </div>

      {error && <div className={styles.error}>Error: {error}</div>}

      {!isGuest && (
        <div className={styles.visibilityTabs} role="tablist" aria-label="Recipe visibility">
          {(["public", "private"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={visibilityTab === tab}
              className={`${styles.visibilityTab} ${visibilityTab === tab ? styles.visibilityTabActive : ""}`}
              onClick={() => {
                setVisibilityTab(tab);
                clearCategories();
              }}
            >
              <span className="material-symbols-rounded" aria-hidden="true">{tab === "public" ? "public" : "lock"}</span>
              {tab === "public" ? "Public" : "Private"}
            </button>
          ))}
        </div>
      )}

      <div className={styles.resultsHeader}>
        <div className={styles.resultsTitleGroup}>
          <h2>Browse</h2>
        </div>
        <div className={styles.sortToggle} aria-label="Recipe sort">
          <button
            type="button"
            className={`${styles.sortButton} ${styles.sortButtonActive}`}
            onClick={() => setSortMode((current) => current === "popular" ? "newest" : "popular")}
            aria-label={`Sort by ${sortMode === "popular" ? "most recent" : "most popular"}`}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              {sortMode === "popular" ? "keyboard_arrow_down" : "keyboard_arrow_up"}
            </span>
            {sortMode === "popular" ? "Most Popular" : "Most Recent"}
          </button>
        </div>
      </div>

      {browseCategories.length > 0 && (
        <div className={styles.categoryTabsWrap}>
          <div ref={categoryTabsRef} className={styles.categoryTabs} role="list" aria-label="Browse categories">
            <button
              type="button"
              className={`${styles.categoryTab} ${selectedCategories.length === 0 ? styles.categoryTabActive : ""}`}
              onClick={clearCategories}
            >
              All
            </button>
            {(() => {
              const selectedIds = new Set(selectedCategories);
              return browseCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`${styles.categoryTab} ${selectedIds.has(category.id.toLowerCase()) ? styles.categoryTabActive : ""}`}
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.label}
                </button>
              ));
            })()}
          </div>
          <button
            type="button"
            className={styles.categoryTabsNext}
            onClick={() => categoryTabsRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
            aria-label="Show more browse categories"
          >
            <span className="material-symbols-rounded" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      )}

      {loading && <p className={styles.loading}>Loading...</p>}

      {!loading && browseItems.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-rounded" aria-hidden="true">
              {selectedCategories.length > 0 ? "search_off" : "restaurant"}
            </span>
          </div>
          <h2 className={styles.emptyStateTitle}>
            {selectedCategories.length > 0 ? "No results found" : "Nothing here yet"}
          </h2>
          <p className={styles.emptyStateText}>
            {selectedCategories.length > 0
              ? "No recipes match all of your selected filters. Try removing one or two."
              : allRecipes.length === 0 && allMeals.length === 0
                ? "No recipes or meals have been shared yet. Be the first to add one."
                : "There is nothing in this view right now."}
          </p>
          {selectedCategories.length > 0 && (
            <button type="button" onClick={clearCategories} className={styles.emptyStateButton}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      <div className={styles.recipeGrid}>
        {browseItems.map((item) => {
          if (item.type === "meal") {
            const meal = item.meal;
            const saved = isMealSaved(item.id);
            const author = getMealAuthor(meal);

            return (
              <div key={`meal-${item.id}`} className={styles.recipeCardWrapper}>
                <RecipeCard
                  href={`/meals/${item.id}`}
                  title={meal.name}
                  image={undefined}
                  imageIcon="restaurant_menu"
                  badge="Meal"
                  author={author}
                  saved={saved}
                  saveLabel="Save meal"
                  onToggleSave={() => {
                    if (saved) {
                      unsaveMeal(undefined, item.id);
                    } else {
                      saveMeal(undefined, item.id);
                    }
                  }}
                />
              </div>
            );
          }

          const recipe = item.recipe;
          const recipeId = recipe._id || recipe.id;
          const saved = isSaved(recipeId);
          const author = getRecipeAuthor(recipe);

          return (
            <div key={`recipe-${recipeId}`} className={styles.recipeCardWrapper}>
              <RecipeCard
                href={`/recipes/${recipeId}`}
                title={recipe.title}
                subtitle={recipe.subtitle}
                image={recipe.image}
                author={author}
                saved={saved}
                onToggleSave={() => {
                  if (saved) {
                    unsaveRecipe(undefined, recipeId);
                  } else {
                    saveRecipe(undefined, recipeId);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
