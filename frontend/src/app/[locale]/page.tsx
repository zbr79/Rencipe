"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function HomePage() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(e?.message || t("common.fetchError"));
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Rencipe</h1>
          <div className={styles.sub}>
            API: <span className={styles.mono}>{API}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/${locale}/recipes`} className={styles.btn}>
            {t("home.viewAllRecipes")}
          </Link>
          <Link href={`/${locale}/create`} className={styles.primaryBtn}>
            + {t("home.createRecipe")}
          </Link>
        </div>
      </header>

      {error && <div className={styles.error}>❌ {error}</div>}

      {loading ? (
        <div className={styles.muted}>{t("common.loading")}</div>
      ) : recipes.length === 0 ? (
        <div className={styles.muted}>{t("home.noRecipes")}</div>
      ) : (
        <div className={styles.list}>
          {recipes.map((r) => (
            <article key={r.id} className={styles.card}>
              <div className={styles.cardTitle}>{r.title}</div>

              {(r.updatedAt || r.createdAt) && (
                <div className={styles.meta}>
                  {r.updatedAt
                    ? `${t("common.updated")}: ${new Date(r.updatedAt).toLocaleString()}`
                    : `${t("common.created")}: ${new Date(r.createdAt!).toLocaleString()}`}
                </div>
              )}

              <div className={styles.preview}>
                {r.content?.length > 260 ? r.content.slice(0, 260) + "…" : r.content}
              </div>

              <Link href={`/${locale}/recipes/${r.id}`} className={styles.link}>
                → {t("common.readMore")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
