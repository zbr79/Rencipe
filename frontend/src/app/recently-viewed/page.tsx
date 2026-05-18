"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "../components/BackButton";
import { useSwipeRowDrag } from "../hooks/useSwipeRowDrag";
import { readRecentlyViewedRecipes, removeRecentlyViewedRecipe, type RecentlyViewedRecipe } from "../utils/recentlyViewedRecipes";
import { matchesTextSearch } from "../utils/textSearch";
import styles from "./page.module.css";

function getViewedAgoLabel(viewedAt: string, now: number) {
  const viewedTime = Date.parse(viewedAt);
  if (!Number.isFinite(viewedTime)) return "Just now";

  const elapsedMinutes = Math.max(0, Math.floor((now - viewedTime) / 60000));
  if (elapsedMinutes < 10) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} minutes ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return elapsedHours === 1 ? "1 hour ago" : `${elapsedHours} hours ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return elapsedDays === 1 ? "1 day ago" : `${elapsedDays} days ago`;
}

export default function RecentlyViewedPage() {
  const router = useRouter();
  const [items, setItems] = useState<RecentlyViewedRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const swipeRowDrag = useSwipeRowDrag();

  useEffect(() => {
    setItems(readRecentlyViewedRecipes());
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return items;
    return items.filter((item) => matchesTextSearch(query, item.title, item.description));
  }, [items, searchQuery]);

  function handleRemoveItem(recipeId: string) {
    setItems(removeRecentlyViewedRecipe(recipeId));
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BackButton fallbackHref="/settings" className={styles.backLink} label="Settings" />
        <h1>Recently Viewed</h1>
      </header>

      <div className={styles.searchBar}>
        <span className="material-symbols-outlined" aria-hidden="true">search</span>
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search recent" aria-label="Search recently viewed" />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear recent search">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <section className={styles.emptyState}>
          <span className="material-symbols-outlined">history</span>
          <p>No recently viewed recipes</p>
        </section>
      ) : filteredItems.length === 0 ? (
        <section className={styles.emptyState}>
          <span className="material-symbols-outlined">search_off</span>
          <p>No matching recipes</p>
        </section>
      ) : (
        <div className={styles.list}>
          {filteredItems.map((item) => (
            <div key={item.id} className={styles.swipeRow} {...swipeRowDrag}>
              <div
                className={styles.rowMain}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/recipes/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/recipes/${item.id}`);
                  }
                }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} />
                ) : (
                  <span className={`material-symbols-outlined ${styles.imageFallback}`}>restaurant</span>
                )}
                <span className={styles.rowText}>
                  <strong>{item.title}</strong>
                </span>
                <span className={styles.viewedTime}>{getViewedAgoLabel(item.viewedAt, now)}</span>
              </div>
              <button type="button" className={styles.swipeDeleteButton} onClick={() => handleRemoveItem(item.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
