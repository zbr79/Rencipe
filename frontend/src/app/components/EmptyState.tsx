import Link from "next/link";
import styles from "./empty-state.module.css";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span className={`material-symbols-rounded ${styles.icon}`} aria-hidden="true">
        {icon}
      </span>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={styles.action}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
