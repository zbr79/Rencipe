"use client";

import { FormEvent, useEffect, useState } from "react";
import { toastError } from "./toast/toast";
import { authFetch } from "../utils/authSession";
import styles from "./comment-section.module.css";

type CommentEntryType = "recipe" | "meal";

interface Comment {
  _id: string;
  displayName: string;
  text: string;
  upvotes: number;
  upvotedByCurrentUser: boolean;
  isOwn: boolean;
  canDelete: boolean;
  createdAt: string;
}

interface CommentSectionProps {
  entryType: CommentEntryType;
  entryId: string;
}

function formatCommentDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  return new Date(timestamp).toLocaleDateString();
}

export default function CommentSection({ entryType, entryId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [canComment, setCanComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      try {
        const response = await authFetch(`/api/comments/${entryType}/${entryId}`);
        if (!response.ok) throw new Error("Failed to load comments");
        const data = await response.json();
        setComments(data.comments || []);
        setCanComment(Boolean(data.canComment));
      } catch (error: any) {
        toastError(error.message || "Could not load comments");
      } finally {
        setLoading(false);
      }
    }

    if (entryId) void fetchComments();
  }, [entryId, entryType]);

  async function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const response = await authFetch(`/api/comments/${entryType}/${entryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not post comment");
      setComments((current) => [data.comment, ...current]);
      setCanComment(false);
      setCommentText("");
    } catch (error: any) {
      toastError(error.message || "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateComment(commentId: string, path: string, method = "POST") {
    try {
      const response = await authFetch(path, { method });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Comment update failed");
      if (data.comment) {
        setComments((current) => current.map((comment) => comment._id === commentId ? data.comment : comment));
      }
      return true;
    } catch (error: any) {
      toastError(error.message || "Comment update failed");
      return false;
    }
  }

  async function handleDeleteComment(commentId: string) {
    const target = comments.find((comment) => comment._id === commentId);
    const deleted = await updateComment(commentId, `/api/comments/${commentId}`, "DELETE");
    if (deleted) {
      setComments((current) => current.filter((comment) => comment._id !== commentId));
      if (target?.isOwn) setCanComment(true);
    }
  }

  return (
    <section className={styles.commentsSection} aria-label={`${entryType} comments`}>
      <div className={styles.sectionHeader}>
        <h3>Comments</h3>
        <span>{comments.length}</span>
      </div>

      {canComment ? (
        <form className={styles.commentForm} onSubmit={handleSubmitComment}>
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment" rows={3} />
          <button type="submit" disabled={submitting || !commentText.trim()}>{submitting ? "Posting" : "Post"}</button>
        </form>
      ) : (
        <p className={styles.statusText}>You can comment once.</p>
      )}

      {loading ? (
        <p className={styles.statusText}>Loading...</p>
      ) : comments.length === 0 ? (
        <p className={styles.statusText}>No comments yet</p>
      ) : (
        <div className={styles.commentList}>
          {comments.map((comment) => (
            <article key={comment._id} className={styles.commentCard}>
              <div className={styles.commentMeta}>
                <strong>{comment.displayName}</strong>
                <span>{formatCommentDate(comment.createdAt)}</span>
              </div>
              <p>{comment.text}</p>
              <div className={styles.commentActions}>
                <button type="button" className={comment.upvotedByCurrentUser ? styles.actionActive : ""} onClick={() => updateComment(comment._id, `/api/comments/${comment._id}/upvote`)}>
                  <span className="material-symbols-outlined">thumb_up</span>
                  {comment.upvotes}
                </button>
                {comment.canDelete && <button type="button" onClick={() => handleDeleteComment(comment._id)}>Delete</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}