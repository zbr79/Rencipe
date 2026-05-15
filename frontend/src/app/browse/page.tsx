"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import AccountAvatar from "../components/AccountAvatar";
import styles from "../search/page.module.css";
import { getVisibleTags } from "../utils/recipeTags";
import { authFetch, getCurrentUserId } from "../utils/authSession";
import { getAccountDisplayName, type AccountIdentity } from "../utils/accountAvatar";
import { getRecipeAuthor } from "../utils/recipeAuthor";

interface Recipe {
  id: string;
  _id?: string;
  title: string;
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
  kind?: "mealPlan" | "meal";
  name: string;
  recipes?: Recipe[];
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
type ContentFilter = "all" | "recipes" | "meals";

const BROWSE_CONTENT_FILTER_KEY = "rencipe-browse-content-filter";
const contentFilterOptions: { value: ContentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recipes", label: "Recipes" },
  { value: "meals", label: "Meals" },
];

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

function matchesCategory(recipe: Recipe, category: string) {
  const tags = getVisibleTags(recipe.tags || []);
  if (category !== "all") return tags.some((tag) => tag.toLowerCase() === category.toLowerCase());
  return true;
}

function matchesVisibility(recipe: Recipe, visibility: VisibilityTab) {
  return visibility === "public" ? recipe.isPublic !== false : recipe.isPublic === false;
}

function matchesMealVisibility(meal: Meal, visibility: VisibilityTab) {
  return visibility === "public" ? meal.isPublic === true : meal.isPublic !== true;
}

function getMealId(meal: Meal) {
  return meal._id || meal.id || "";
}

function getMealAuthor(meal: Meal) {
  return typeof meal.userId === "object" ? meal.userId : null;
}

function iconForTag(tag: string) {
  const normalized = tag.toLowerCase();
  if (normalized.includes("spicy") || normalized.includes("sichuan")) return "local_fire_department";
  if (normalized.includes("seafood") || normalized.includes("fish") || normalized.includes("shrimp")) return "set_meal";
  if (normalized.includes("korean")) return "rice_bowl";
  if (normalized.includes("cantonese") || normalized.includes("chinese")) return "restaurant";
  if (normalized.includes("quick")) return "bolt";
  if (normalized.includes("vegetable")) return "eco";
  return "local_offer";
}

export default function BrowsePage() {
  const { isSaved, addFavorite, removeFavorite, fetchSaved, isMealSaved, addFavoriteMeal, removeFavoriteMeal } = useSaved();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibilityTab, setVisibilityTab] = useState<VisibilityTab>("public");
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [contentFilterOpen, setContentFilterOpen] = useState(false);

  useEffect(() => {
    const storedFilter = window.localStorage.getItem(BROWSE_CONTENT_FILTER_KEY);
    if (storedFilter === "all" || storedFilter === "recipes" || storedFilter === "meals") {
      setContentFilter(storedFilter);
    }
    fetchBrowseData();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BROWSE_CONTENT_FILTER_KEY, contentFilter);
  }, [contentFilter]);

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBrowseData = async () => {
    setLoading(true);
    setError("");
    try {
      const accountId = getCurrentUserId();
      const [recipeResponse, publicMealResponse, privateMealResponse] = await Promise.all([
        authFetch(`/api/recipes?limit=1000`),
        authFetch(`/api/meal-plans?kind=meal&visibility=public`),
        accountId ? authFetch(`/api/meal-plans?userId=${accountId}&kind=meal`) : Promise.resolve(null),
      ]);

      if (!recipeResponse.ok) {
        throw new Error("Failed to fetch recipes");
      }

      if (!publicMealResponse.ok) {
        throw new Error("Failed to fetch meals");
      }

      if (privateMealResponse && !privateMealResponse.ok) {
        throw new Error("Failed to fetch your meals");
      }

      const recipeData = await recipeResponse.json();
      const publicMealData = await publicMealResponse.json();
      const privateMealData = privateMealResponse ? await privateMealResponse.json() : { plans: [] };
      const mealsById = new Map<string, Meal>();

      [...(publicMealData.plans || []), ...(privateMealData.plans || [])].forEach((meal: Meal) => {
        const mealId = getMealId(meal);
        if (mealId && meal.kind === "meal") mealsById.set(mealId, meal);
      });

      setAllRecipes((recipeData.recipes || []) as Recipe[]);
      setAllMeals(Array.from(mealsById.values()));
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleRecipes = useMemo(() => allRecipes.filter((recipe) => matchesVisibility(recipe, visibilityTab)), [allRecipes, visibilityTab]);
  const visibleMeals = useMemo(() => allMeals.filter((meal) => matchesMealVisibility(meal, visibilityTab)), [allMeals, visibilityTab]);
  const filteredRecipes = contentFilter === "meals" ? [] : visibleRecipes.filter((recipe) => matchesCategory(recipe, selectedCategory));
  const filteredMeals = contentFilter === "recipes" || selectedCategory !== "all" ? [] : visibleMeals;
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
  const tagCategories = useMemo(() => {
    const counts = new Map<string, number>();
    visibleRecipes.forEach((recipe) => {
      getVisibleTags(recipe.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });

    return Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .map(([tag]) => ({ id: tag, label: tag, icon: iconForTag(tag) }));
  }, [visibleRecipes]);
  const featureCategories = [{ id: "all", label: "All", icon: "restaurant_menu" }, ...tagCategories.slice(0, 4)];
  const contentFilterLabel = contentFilterOptions.find((option) => option.value === contentFilter)?.label || "All";

  return (
    <main className={styles.page}>
      {error && <div className={styles.error}>Error: {error}</div>}

      <section className={styles.featureRail} aria-label="Browse categories">
        {featureCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`${styles.featureItem} ${selectedCategory === category.id ? styles.featureItemActive : ""}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className={`material-symbols-rounded ${styles.featureIcon}`}>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </section>

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
              setSelectedCategory("all");
            }}
          >
            <span className="material-symbols-rounded" aria-hidden="true">{tab === "public" ? "public" : "lock"}</span>
            {tab === "public" ? "Public" : "Private"}
          </button>
        ))}
      </div>

      <div className={styles.resultsHeader}>
        <div className={styles.resultsTitleGroup}>
          <h2>Browse</h2>
          <div className={styles.contentFilterWrap}>
            <button
              type="button"
              className={styles.contentFilterButton}
              onClick={() => setContentFilterOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={contentFilterOpen}
              aria-label="Browse content type"
            >
              <span>{contentFilterLabel}</span>
              <span className="material-symbols-rounded" aria-hidden="true">expand_more</span>
            </button>
            {contentFilterOpen && (
              <div className={styles.contentFilterMenu} role="listbox">
                {contentFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={styles.contentFilterOption}
                    role="option"
                    aria-selected={contentFilter === option.value}
                    onClick={() => {
                      setContentFilter(option.value);
                      setSelectedCategory("all");
                      setContentFilterOpen(false);
                    }}
                  >
                    <span className={styles.contentFilterOptionLabel}>{option.label}</span>
                    {contentFilter === option.value && <span className={`material-symbols-rounded ${styles.contentFilterOptionCheck}`} aria-hidden="true">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.sortToggle} aria-label="Recipe sort">
          <button
            type="button"
            className={`${styles.sortButton} ${styles.sortButtonActive}`}
            onClick={() => setSortMode((current) => current === "popular" ? "newest" : "popular")}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              {sortMode === "popular" ? "keyboard_arrow_down" : "keyboard_arrow_up"}
            </span>
            {sortMode === "popular" ? "Most Popular" : "Most Recent"}
          </button>
        </div>
      </div>

      {loading && <p className={styles.loading}>Loading...</p>}

      {!loading && browseItems.length === 0 && (
        <div className={styles.empty}>
          <p>{allRecipes.length === 0 && allMeals.length === 0 ? "No recipes or meals yet" : `No ${visibilityTab} items in this view`}</p>
          <button type="button" onClick={() => setSelectedCategory("all")} className={styles.secondaryButton}>
            Show all
          </button>
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
                <article className={styles.recipeCard}>
                  <Link href={`/meal-plans/${item.id}`} className={styles.recipeCardLink}>
                    <div className={styles.recipeImage}>
                      <span className="material-symbols-rounded">restaurant_menu</span>
                    </div>
                    <div className={styles.recipeBody}>
                      <h3>{meal.name}</h3>
                    </div>
                  </Link>
                  <div className={styles.cardFooter}>
                    <div className={styles.uploaderLine}>
                      <AccountAvatar account={author} size={24} />
                      <span>{getAccountDisplayName(author)}</span>
                    </div>

                    <button
                      type="button"
                      className={`${styles.browseSaveButton} ${saved ? styles.browseSaveButtonActive : ""}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (saved) {
                          removeFavoriteMeal(undefined, item.id);
                        } else {
                          addFavoriteMeal(undefined, item.id);
                        }
                      }}
                      aria-label={saved ? "Remove meal from saved" : "Save meal"}
                    >
                      <span className="material-symbols-outlined">{saved ? "favorite" : "favorite_border"}</span>
                    </button>
                  </div>
                </article>
              </div>
            );
          }

          const recipe = item.recipe;
          const recipeId = recipe._id || recipe.id;
          const saved = isSaved(recipeId);
          const author = getRecipeAuthor(recipe);

          return (
            <div key={`recipe-${recipeId}`} className={styles.recipeCardWrapper}>
              <article className={styles.recipeCard}>
                <Link href={`/recipes/${recipeId}`} className={styles.recipeCardLink}>
                  <div className={styles.recipeImage}>
                    {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span className="material-symbols-rounded">restaurant</span>}
                  </div>
                  <div className={styles.recipeBody}>
                    <h3>{recipe.title}</h3>
                  </div>
                </Link>
                <div className={styles.cardFooter}>
                  <div className={styles.uploaderLine}>
                    <AccountAvatar account={author} size={24} />
                    <span>{getAccountDisplayName(author)}</span>
                  </div>

                  <button
                    type="button"
                    className={`${styles.browseSaveButton} ${saved ? styles.browseSaveButtonActive : ""}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (saved) {
                        removeFavorite(undefined, recipeId);
                      } else {
                        addFavorite(undefined, recipeId);
                      }
                    }}
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
    </main>
  );
}