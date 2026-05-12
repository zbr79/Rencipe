"use client";

import { useState } from "react";
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
  toggleOpenLabel?: string;
  toggleCloseLabel?: string;
  initiallyCollapsed?: boolean;
  mobilePlacement?: "bottom-right" | "middle-right";
}

export default function FloatingActionPanel({
  ariaLabel,
  actions,
  toggleOpenLabel = "Open actions",
  toggleCloseLabel = "Minimize actions",
  initiallyCollapsed = false,
  mobilePlacement = "bottom-right",
}: FloatingActionPanelProps) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  return (
    <aside
      className={`${styles.floatingPanel} ${mobilePlacement === "middle-right" ? styles.floatingPanelMobileMiddle : ""} ${collapsed ? styles.floatingPanelCollapsed : ""}`}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={styles.panelToggle}
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? toggleOpenLabel : toggleCloseLabel}
        aria-expanded={!collapsed}
      >
        <span className="material-symbols-outlined">{collapsed ? "chevron_left" : "chevron_right"}</span>
      </button>

      <div className={styles.panelActions}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`${styles.panelButton} ${action.tone === "primary" ? styles.panelButtonPrimary : ""} ${action.tone === "danger" ? styles.panelButtonDanger : ""}`}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
            title={action.label}
          >
            <span className="material-symbols-outlined">{action.icon}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}