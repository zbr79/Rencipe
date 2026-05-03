"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./drafts.module.css";

interface Draft {
  _id: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const router = useRouter();
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
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
    // TODO: Implement opening draft in create form
    router.push(`/create?draftId=${draftId}`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("Delete this draft?")) return;
    try {
      const response = await fetch(`/api/drafts?authorId=${userId}&id=${draftId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete draft");
      setDrafts(drafts.filter((d) => d._id !== draftId));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleRenameDraft = async (draftId: string) => {
    if (!editingName.trim()) return;
    try {
      const response = await fetch(`/api/drafts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          authorId: userId,
          name: editingName,
        }),
      });
      if (!response.ok) throw new Error("Failed to rename draft");
      const data = await response.json();
      setDrafts(drafts.map((d) => (d._id === draftId ? { ...d, name: editingName } : d)));
      setEditingId(null);
    } catch (err: any) {
      alert("Rename failed: " + err.message);
    }
  };

  const startEditName = (draft: Draft) => {
    setEditingId(draft._id);
    setEditingName(draft.name);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Recipe Drafts</p>
          <h1>My Drafts</h1>
          <p>Resume unfinished recipes without losing work.</p>
        </div>
        <Link href="/create">
          <button className={`${styles.button} ${styles.buttonPrimary}`}>
            + New Recipe
          </button>
        </Link>
      </div>

      {loading && <p className={styles.statusText}>Loading...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && drafts.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>No drafts yet</p>
          <Link href="/create">
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              Start a Recipe
            </button>
          </Link>
        </div>
      ) : (
        <div className={styles.draftsList}>
          {drafts.map((draft) => (
            <div key={draft._id} className={styles.draftItem}>
              <div className={styles.draftInfo}>
                {editingId === draft._id ? (
                  <div className={styles.editRow}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameDraft(draft._id)}
                      className={`${styles.button} ${styles.buttonSuccess}`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className={styles.draftName} onClick={() => handleOpenDraft(draft._id)}>
                      {draft.name}
                    </h3>
                    <p className={styles.draftTitle}>
                      {draft.title || "Untitled"}
                    </p>
                    <p className={styles.draftDate}>
                      Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className={styles.draftActions}>
                <button
                  onClick={() => handleOpenDraft(draft._id)}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Open
                </button>
                <button
                  onClick={() => startEditName(draft)}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDeleteDraft(draft._id)}
                  className={`${styles.button} ${styles.buttonDanger}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
