"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import searchStyles from "../search/page.module.css";
import { useSaved } from "../contexts/SavedContext";
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

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const HISTORY_KEY = "rencipe-search-history";

function matchesRecipeSearch(recipe: Recipe, query: string) {
  return (
    matchesPinyinSearch(query, recipe.title) ||
    matchesPinyinSearch(query, recipe.description) ||
    getVisibleTags(recipe.tags).some((tag) => matchesPinyinSearch(query, tag))
  );
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSaved, addFavorite, removeFavorite, fetchSaved } = useSaved();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [didLoadRecipes, setDidLoadRecipes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    try {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(Array.isArray(stored) ? stored.slice(0, 8) : []);
    } catch {
      setHistory([]);
    }

    setSearchTerm("");

    fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || didLoadRecipes) return;

    let ignore = false;

    async function fetchAllRecipes() {
      setLoading(true);
      setError("");

      try {
        const response = await authFetch(`/api/recipes?limit=1000`);
        if (!response.ok) throw new Error("Failed to fetch recipes");

        const data = await response.json();
        if (ignore) return;

        setAllRecipes((data.recipes || []) as Recipe[]);
      } catch (fetchError: any) {
        if (!ignore) setError(fetchError.message || "Failed to fetch recipes");
      } finally {
        if (!ignore) {
          setLoading(false);
          setDidLoadRecipes(true);
        }
      }
    }

    fetchAllRecipes();

    return () => {
      ignore = true;
    };
  }, [didLoadRecipes, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const filteredRecipes = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return [];
    return allRecipes.filter((recipe) => matchesRecipeSearch(recipe, query));
  }, [allRecipes, searchTerm]);

  const historyEntries = useMemo(() => {
    return history.map((item) => {
      const firstMatch = allRecipes.find((recipe) => matchesRecipeSearch(recipe, item));
      return {
        value: item,
        previewImage: firstMatch?.image || "",
      };
    });
  }, [allRecipes, history]);

  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
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

  const clearHistory = () => {
    window.localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  if (!open) return null;

  return (
    <div className={searchStyles.overlay} role="dialog" aria-modal="true" aria-label="Search">
      <main className={searchStyles.page}>
        <header className={searchStyles.searchHeader}>
          <button type="button" className={searchStyles.backButton} onClick={onClose} aria-label="Close search">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <div className={searchStyles.searchBox}>
            <span className={`material-symbols-outlined ${searchStyles.searchIcon}`}>search</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search recipes"
              value={searchTerm}
              onChange={(event) => updateSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitSearchTerm();
              }}
            />
            {searchTerm && (
              <button type="button" className={searchStyles.clearSearch} onClick={() => updateSearchTerm("")} aria-label="Clear search">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </header>

        {error && <div className={searchStyles.error}>Error: {error}</div>}

        {!searchTerm.trim() && (
          <section className={`${searchStyles.sectionBlock} ${searchStyles.historySection}`}>
            <div className={searchStyles.sectionHeader}>
              <h2>Search History</h2>
              {history.length > 0 && (
                <button type="button" className={searchStyles.iconButton} onClick={clearHistory} aria-label="Clear history">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
            </div>

            {historyEntries.length > 0 ? (
              <div className={searchStyles.historyList}>
                {historyEntries.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    className={searchStyles.historyRow}
                    onClick={() => {
                      updateSearchTerm(entry.value);
                      commitSearchTerm(entry.value);
                    }}
                  >
                    <span className={searchStyles.historyRowText}>{entry.value}</span>
                    {entry.previewImage ? (
                      <img className={searchStyles.historyPreview} src={entry.previewImage} alt="" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className={searchStyles.emptyHistory}>Your recent searches will appear here.</p>
            )}
          </section>
        )}

        {searchTerm.trim() && (
          <div className={searchStyles.resultsHeader}>
            <h2>Search Results</h2>
            <span>{filteredRecipes.length} recipes</span>
          </div>
        )}

        {loading && <p className={searchStyles.loading}>Loading...</p>}

        {!loading && searchTerm.trim() && filteredRecipes.length === 0 && (
          <div className={searchStyles.empty}>
            <p>{allRecipes.length === 0 ? "No recipes yet" : "No matching recipes found"}</p>
            <button type="button" onClick={() => updateSearchTerm("")} className={searchStyles.secondaryButton}>
              Clear search
            </button>
          </div>
        )}

        {searchTerm.trim() && (
          <div className={searchStyles.resultList}>
            {filteredRecipes.map((recipe) => {
              const recipeId = recipe._id || recipe.id;
              const saved = isSaved(recipeId);

              return (
                <article key={recipeId} className={`${searchStyles.recipeCard} ${searchStyles.resultCard}`}>
                  <Link
                    href={`/recipes/${recipeId}`}
                    className={searchStyles.resultCardLink}
                    onClick={() => {
                      commitSearchTerm();
                      onClose();
                    }}
                  >
                    <div className={searchStyles.recipeImage}>
                      {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <span className="material-symbols-outlined">restaurant</span>}
                    </div>
                    <div className={searchStyles.recipeBody}>
                      <h3>{recipe.title}</h3>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={`${searchStyles.saveButton} ${saved ? searchStyles.saveButtonActive : ""}`}
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
    </div>
  );
}