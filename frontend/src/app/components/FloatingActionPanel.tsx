"use client";

import styles from "./floating-action-panel.module.css";

export type FloatingActionPanelTone = "default" | "primary" | "danger";

export interface FloatingActionPanelAction {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: FloatingActionPanelTone;
}

interface FloatingActionPanelProps {
  ariaLabel: string;
  actions: FloatingActionPanelAction[];
}

export default function FloatingActionPanel({ ariaLabel, actions }: FloatingActionPanelProps) {
  const primaryAction = actions.find((action) => action.tone === "primary") ?? actions[0];
  const orderedActions = primaryAction
    ? [...actions.filter((action) => action.id !== primaryAction.id), primaryAction]
    : actions;

  if (actions.length === 0 || !primaryAction) {
    return null;
  }

  const getActionIcon = (action: FloatingActionPanelAction) => {
    if (action.id === "save" && action.icon === "save") {
      return "favorite";
    }

    return action.icon;
  };

  return (
    <aside className={styles.floatingPanel} aria-label={ariaLabel}>
      <div className={styles.panelActions}>
        {orderedActions.map((action) => {
          const isPrimaryAction = action.id === primaryAction.id;

          return (
            <button
              key={action.id}
              type="button"
              className={`${styles.panelButton} ${isPrimaryAction ? styles.panelButtonAnchor : styles.panelButtonSecondary} ${action.id === "save" ? styles.panelButtonSave : ""} ${action.tone === "primary" ? styles.panelButtonPrimary : ""} ${action.tone === "danger" ? styles.panelButtonDanger : ""}`}
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.label}
              title={action.label}
            >
              <span className="material-symbols-outlined">{getActionIcon(action)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}