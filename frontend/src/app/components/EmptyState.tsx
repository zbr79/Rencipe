import Link from "next/link";
import styles from "./empty-state.module.css";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, actionHref, onActionClick, className }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${className || ""}`.trim()}>
      <div className={styles.iconWrap}>
        <span className={`material-symbols-rounded ${styles.iconGlyph}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {actionLabel && (onActionClick ? (
        <button type="button" className={styles.action} onClick={onActionClick}>
          {actionLabel}
        </button>
      ) : (
        actionHref && (
          <Link href={actionHref} className={styles.action}>
            {actionLabel}
          </Link>
        )
      ))}
    </div>
  );
}