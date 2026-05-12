"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSaved } from "../contexts/SavedContext";
import AccountAvatar from "../components/AccountAvatar";
import styles from "../search/page.module.css";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { getVisibleTags } from "../utils/recipeTags";
import { authFetch } from "../utils/authSession";
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

type VisibilityTab = "public" | "private";

function matchesCategory(recipe: Recipe, category: string) {
  const tags = getVisibleTags(recipe.tags || []);
  if (category !== "all") return tags.some((tag) => tag.toLowerCase() === category.toLowerCase());
  return true;
}

function matchesVisibility(recipe: Recipe, visibility: VisibilityTab) {
  return visibility === "public" ? recipe.isPublic !== false : recipe.isPublic === false;
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

export default function CategoriesPage() {
  const { isSaved, addFavorite, removeFavorite, fetchSaved } = useSaved();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibilityTab, setVisibilityTab] = useState<VisibilityTab>("public");

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllRecipes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`/api/recipes?limit=1000`);

      if (!response.ok) {
        throw new Error("Failed to fetch recipes");
      }

      const data = await response.json();
      setAllRecipes(enrichRecipesWithMockImages<Recipe>((data.recipes || []) as Recipe[]));
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleRecipes = useMemo(() => allRecipes.filter((recipe) => matchesVisibility(recipe, visibilityTab)), [allRecipes, visibilityTab]);
  const filteredRecipes = visibleRecipes.filter((recipe) => matchesCategory(recipe, selectedCategory));
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

  return (
    <main className={styles.page}>
      {error && <div className={styles.error}>Error: {error}</div>}

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

      <div className={styles.resultsHeader}>
        <h2>Browse</h2>
        <span>{filteredRecipes.length} recipes</span>
      </div>

      {loading && <p className={styles.loading}>Loading...</p>}

      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>{allRecipes.length === 0 ? "No recipes yet" : `No ${visibilityTab} recipes in this category`}</p>
          <button type="button" onClick={() => setSelectedCategory("all")} className={styles.secondaryButton}>
            Show all
          </button>
        </div>
      )}

      <div className={styles.recipeGrid}>
        {filteredRecipes.map((recipe) => {
          const recipeId = recipe._id || recipe.id;
          const saved = isSaved(recipeId);
          const author = getRecipeAuthor(recipe);

          return (
            <div key={recipeId} className={styles.recipeCardWrapper}>
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
                </div>
              </article>
              <button
                type="button"
                className={`${styles.saveButton} ${saved ? styles.saveButtonActive : ""}`}
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
                <span className="material-symbols-rounded">{saved ? "bookmark" : "bookmark_border"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}