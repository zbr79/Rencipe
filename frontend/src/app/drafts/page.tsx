"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "../components/BackButton";
import styles from "./drafts.module.css";
import { useConfirmDialog } from "../components/ConfirmDialogProvider";
import { getCurrentUserId } from "../utils/authSession";
import { matchesPinyinSearch } from "../utils/pinyinSearch";
import { useSwipeRowDrag } from "../hooks/useSwipeRowDrag";

interface Draft {
  _id: string;
  draftType?: "recipe" | "meal";
  name: string;
  title: string;
  description: string;
  image?: string;
  updatedAt: string;
  createdAt: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { confirm, notify } = useConfirmDialog();
  const swipeRowDrag = useSwipeRowDrag();

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) throw new Error("Sign in before viewing drafts");
      const response = await fetch(`/api/drafts?authorId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch drafts");
      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDraft = (draftId: string) => {
    const draft = drafts.find((item) => item._id === draftId);
    router.push(draft?.draftType === "meal" ? `/meal-plans/new?draftId=${draftId}#edit` : `/create?draftId=${draftId}`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!(await confirm({
      title: "Delete draft",
      message: "Delete this draft?",
      intent: "danger",
      confirmText: "Delete",
    }))) return;
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("Sign in before deleting drafts");
      const response = await fetch(`/api/drafts?authorId=${userId}&id=${draftId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete draft");
      setDrafts(drafts.filter((d) => d._id !== draftId));
    } catch (err: any) {
      await notify({
        title: "Delete failed",
        message: `Delete failed: ${err.message}`,
        intent: "danger",
      });
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    if (!searchTerm.trim()) return true;
    return (
      matchesPinyinSearch(searchTerm, draft.name || "") ||
      matchesPinyinSearch(searchTerm, draft.title || "") ||
      matchesPinyinSearch(searchTerm, draft.description || "")
    );
  });

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <BackButton fallbackHref="/settings" className={styles.backLink} />
        <div>
          <p className={styles.kicker}>Recipes</p>
          <h1>Drafts</h1>
        </div>
      </header>

      <div className={styles.filtersSection}>
        <input
          type="text"
          placeholder="Search drafts"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.count}>Drafts {filteredDrafts.length}</div>
        <Link href="/create" className={styles.newRecipeButton}>
          New Recipe
        </Link>
      </div>

      {loading && <p className={styles.statusText}>Loading...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && filteredDrafts.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>{drafts.length === 0 ? "No drafts yet" : "No matching drafts found"}</p>
          <Link href="/create" className={styles.newRecipeButton}>New Recipe</Link>
        </div>
      ) : (
        <div className={styles.draftsList}>
          {filteredDrafts.map((draft) => (
            <div key={draft._id} className={styles.swipeRow} {...swipeRowDrag}>
              <button type="button" className={styles.draftRow} onClick={() => handleOpenDraft(draft._id)}>
                <div className={styles.draftImage}>
                  {draft.image ? <img src={draft.image} alt={draft.title || draft.name || "Draft"} /> : <span className="material-symbols-outlined">edit_note</span>}
                </div>
                <div className={styles.draftText}>
                  <h3>{draft.name || draft.title || "Untitled Draft"}</h3>
                  <p>{draft.draftType === "meal" ? "Meal draft" : draft.title || "Untitled recipe"}</p>
                  <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDraft(draft._id)}
                className={styles.swipeDeleteButton}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
