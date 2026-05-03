"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { getPrimaryRecipeLabel, getVisibleTags } from "../utils/recipeTags";
import { authFetch } from "../utils/authSession";

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
  image?: string;
}

const HISTORY_KEY = "rencipe-search-history";

export default function SearchPage() {
  const router = useRouter();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  useEffect(() => {
    setSearchTerm(new URLSearchParams(window.location.search).get("q") || "");
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(Array.isArray(stored) ? stored.slice(0, 8) : []);
    } catch {
      setHistory([]);
    }
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
      const enrichedRecipes = enrichRecipesWithMockImages<Recipe>((data.recipes || []) as Recipe[]);
      setAllRecipes(enrichedRecipes);

      const tags = new Set<string>();
      enrichedRecipes.forEach((recipe) => {
        getVisibleTags(recipe.tags).forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const recommendationTags = useMemo(() => {
    const preferred = ["High Protein", "Balanced", "Quick", "Dinner", "Vegetable", "Seafood", "Meal prep", "Keto Friendly"];
    const merged = [...preferred, ...allTags];
    return Array.from(new Set(merged)).filter(Boolean).slice(0, 12);
  }, [allTags]);

  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
    const query = value.trim();
    router.replace(query ? `/search?q=${encodeURIComponent(query)}` : "/search", { scroll: false });
  };

  const commitSearchTerm = (value = searchTerm) => {
    const query = value.trim();
    if (!query) return;
    setHistory((prev) => {
      const next = [query, ...prev.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeHistoryItem = (value: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item !== value);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    window.localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const hasQuery = Boolean(searchTerm.trim());
  const filteredRecipes = hasQuery
    ? allRecipes.filter((recipe) => (
        matchesPinyinSearch(searchTerm, recipe.title) ||
        matchesPinyinSearch(searchTerm, recipe.description) ||
        getVisibleTags(recipe.tags).some((tag) => matchesPinyinSearch(searchTerm, tag))
      ))
    : [];

  return (
    <main className={styles.page}>
      <header className={styles.searchHeader}>
        <button type="button" className={styles.backButton} onClick={() => router.back()} aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className={styles.searchBox}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            type="text"
            placeholder="Search recipes"
            value={searchTerm}
            onChange={(event) => updateSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitSearchTerm();
            }}
            autoFocus
          />
          {searchTerm && (
            <button type="button" className={styles.clearSearch} onClick={() => updateSearchTerm("")} aria-label="Clear search">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <Link href="/cart" className={styles.cartButton} aria-label="Shopping Cart">
          <span className="material-symbols-outlined">shopping_cart</span>
        </Link>
      </header>

      {error && <div className={styles.error}>Error: {error}</div>}

      {!hasQuery && (
        <>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2>Search History</h2>
              {history.length > 0 && (
                <button type="button" className={styles.iconButton} onClick={clearHistory} aria-label="Clear history">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
            </div>
            {history.length > 0 ? (
              <div className={styles.chipList}>
                {history.map((item) => (
                  <button key={item} type="button" className={styles.historyChip} onClick={() => updateSearchTerm(item)}>
                    <span>{item}</span>
                    <span
                      className="material-symbols-outlined"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeHistoryItem(item);
                      }}
                    >
                      close
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.emptyHistory}>Your recent searches will appear here.</p>
            )}
          </section>

          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h2>Recommended</h2>
            </div>
            <div className={styles.chipList}>
              {recommendationTags.map((tag, index) => (
                <button key={tag} type="button" className={styles.recommendChip} onClick={() => updateSearchTerm(tag)}>
                  {index < 3 && <span className="material-symbols-outlined">local_fire_department</span>}
                  {tag}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {hasQuery && (
        <div className={styles.resultsHeader}>
          <h2>Search Results</h2>
          <span>{filteredRecipes.length} recipes</span>
        </div>
      )}

      {loading && <p className={styles.loading}>Loading...</p>}

      {!loading && hasQuery && filteredRecipes.length === 0 && (
        <div className={styles.empty}>
          <p>{allRecipes.length === 0 ? "No recipes yet" : "No matching recipes found"}</p>
          <button type="button" onClick={() => updateSearchTerm("")} className={styles.secondaryButton}>
            Clear search
          </button>
        </div>
      )}

      {hasQuery && (
        <div className={styles.resultList}>
          {filteredRecipes.map((recipe, index) => (
            <Link
              key={recipe._id || recipe.id}
              href={`/recipes/${recipe._id || recipe.id}`}
              className={`${styles.recipeCard} ${styles.resultCard}`}
              onClick={() => commitSearchTerm()}
            >
              <span className={styles.discountBadge}>{index % 3 === 0 ? "New" : index % 3 === 1 ? "Popular" : "Fresh"}</span>
              {recipe.image && (
                <div className={styles.recipeImage}>
                  <img src={recipe.image} alt={recipe.title} />
                </div>
              )}
              <div className={styles.recipeBody}>
                <div className={styles.recipeTopLine}>
                  <span>{getPrimaryRecipeLabel(recipe.tags)}</span>
                  <span>{recipe.servings || 1} servings</span>
                </div>
                <h3>{recipe.title}</h3>
                {recipe.description && <p>{recipe.description}</p>}
                {getVisibleTags(recipe.tags).length > 0 && (
                  <div className={styles.cardTags}>
                    {getVisibleTags(recipe.tags).slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}