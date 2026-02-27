"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Recipe = {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

type ListRes = { recipes: Recipe[] };
type CreateRes = { recipe: Recipe };

export default function HomePage() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function fetchRecipes() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/recipes`, {
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
      setError(e?.message || "Failed to fetch recipes");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openModal() {
    setModalError(null);
    setTitle("");
    setContent("");
    setOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setOpen(false);
  }

  async function submitRecipe() {
    setModalError(null);

    if (!title.trim()) return setModalError("title is required");
    if (!content.trim()) return setModalError("content is required");

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/recipes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const text = await res.text();
      const data = text ? safeJson(text) : null;

      if (!res.ok) {
        throw new Error(
          (data && (data.error || data.message)) || text || `HTTP ${res.status}`
        );
      }

      const created = (data as CreateRes)?.recipe;
      if (created?.id) {
        setRecipes((prev) => [created, ...prev]);
      } else {
        // fallback: just refetch if response shape differs
        await fetchRecipes();
      }

      setOpen(false);
    } catch (e: any) {
      setModalError(e?.message || "Failed to create recipe");
    } finally {
      setSubmitting(false);
    }
  }

  const headerRight = useMemo(() => {
    return (
      <div className={styles.headerActions}>
        <button className={styles.btn} onClick={fetchRecipes} disabled={loading}>
          Refresh
        </button>
        <button className={styles.primaryBtn} onClick={openModal}>
          + Create
        </button>
      </div>
    );
  }, [loading]);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Rencipe</h1>
          <div className={styles.sub}>
            API: <span className={styles.mono}>{API}</span>
          </div>
        </div>
        {headerRight}
      </header>

      {error && <div className={styles.error}>❌ {error}</div>}

      {loading ? (
        <div className={styles.muted}>Loading…</div>
      ) : recipes.length === 0 ? (
        <div className={styles.muted}>No recipes yet.</div>
      ) : (
        <div className={styles.list}>
          {recipes.map((r) => (
            <article key={r.id} className={styles.card}>
              <div className={styles.cardTitle}>{r.title}</div>

              {(r.updatedAt || r.createdAt) && (
                <div className={styles.meta}>
                  {r.updatedAt
                    ? `Updated: ${new Date(r.updatedAt).toLocaleString()}`
                    : `Created: ${new Date(r.createdAt!).toLocaleString()}`}
                </div>
              )}

              <div className={styles.preview}>
                {r.content?.length > 260 ? r.content.slice(0, 260) + "…" : r.content}
              </div>

              <div className={styles.idRow}>
                id: <span className={styles.mono}>{r.id}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className={styles.modalOverlay} onMouseDown={closeModal}>
          <div
            className={styles.modal}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Create Recipe</div>
              <button className={styles.iconBtn} onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 红烧肉"
              autoFocus
            />

            <label className={styles.label}>Content</label>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Steps/ingredients/notes…"
            />

            {modalError && <div className={styles.error}>❌ {modalError}</div>}

            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={submitRecipe}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}