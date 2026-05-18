"use client";

import { useEffect, type ReactNode } from "react";
import styles from "./confirm-modal.module.css";

export type ConfirmModalIntent = "danger" | "warning" | "neutral" | "success";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  intent?: ConfirmModalIntent;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function getIntentIcon(intent: ConfirmModalIntent) {
  if (intent === "danger") return "✖";
  if (intent === "warning") return "!";
  if (intent === "success") return "✔";
  return "?";
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  intent = "neutral",
  showCancel = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showCancel) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel, onConfirm, showCancel]);

  if (!open) return null;

  const dismiss = showCancel ? onCancel : onConfirm;

  return (
    <div className={styles.overlay} onClick={dismiss} role="presentation">
      <div
        className={`${styles.modal} ${styles[intent]}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className={styles.header}>
          <span id="confirm-modal-title" className={styles.title}>{title}</span>
          <button className={styles.close} onClick={dismiss} aria-label={showCancel ? "Close dialog" : "Dismiss dialog"}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={`${styles.icon} ${styles[intent]}`}>{getIntentIcon(intent)}</div>
          <div className={styles.message}>{message}</div>
        </div>

        <div className={`${styles.footer} ${!showCancel ? styles.footerSingle : ""}`}>
          {showCancel && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              {cancelText}
            </button>
          )}

          <button className={`${styles.confirmBtn} ${styles[intent]}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
