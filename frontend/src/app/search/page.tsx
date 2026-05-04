"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useSaved } from "../contexts/SavedContext";
import { enrichRecipesWithMockImages } from "../utils/recipeImageUtils";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { getVisibleTags } from "../utils/recipeTags";
import { authFetch } from "../utils/authSession";
import { type AccountIdentity } from "../utils/accountAvatar";

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
  image?: string;
}

const HISTORY_KEY = "rencipe-search-history";

export default function SearchPage() {
  const router = useRouter();
  const { isSaved, addFavorite, removeFavorite, fetchSaved } = useSaved();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const recommendationTags = useMemo(() => {
    const counts = new Map<string, number>();
    allRecipes.forEach((recipe) => {
      getVisibleTags(recipe.tags).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });

    return Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .map(([tag]) => tag)
      .slice(0, 8);
  }, [allRecipes]);

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

        <span className={styles.headerSpacer} aria-hidden="true" />
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
            <div className={`${styles.chipList} ${styles.recommendationList}`}>
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
          {filteredRecipes.map((recipe) => {
            const recipeId = recipe._id || recipe.id;
            const saved = isSaved(recipeId);

            return (
              <article key={recipeId} className={`${styles.recipeCard} ${styles.resultCard}`}>
                <Link href={`/recipes/${recipeId}`} className={styles.resultCardLink} onClick={() => commitSearchTerm()}>
                  <div className={styles.recipeImage}>
                    {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span className="material-symbols-outlined">restaurant</span>}
                  </div>
                  <div className={styles.recipeBody}>
                    <h3>{recipe.title}</h3>
                  </div>
                </Link>
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
                  <span className="material-symbols-outlined">{saved ? "bookmark" : "bookmark_border"}</span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}