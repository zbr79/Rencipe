"use client";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export default function UnsavedChangesModal({
  isOpen,
  isSaving,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Unsaved Changes</h2>
        <p style={styles.message}>
          You have unsaved recipe changes. Save them as a draft before leaving?
        </p>
        <div style={styles.buttons}>
          <button
            onClick={onDiscard}
            disabled={isSaving}
            style={{ ...styles.button, ...styles.discardBtn }}
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            style={{ ...styles.button, ...styles.saveBtn }}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    backgroundColor: "var(--card-bg)",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--foreground)",
    margin: "0 0 12px 0",
  },
  message: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    margin: "0 0 24px 0",
  },
  buttons: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  discardBtn: {
    backgroundColor: "var(--border)",
    color: "var(--foreground)",
  },
  saveBtn: {
    backgroundColor: "var(--primary)",
    color: "white",
  },
};
