import Link from "next/link";
import styles from "./breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[]; mobileBackHref?: string }) {
  if (items.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <ol className={styles.list}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast || !item.href) {
              return (
                <li key={item.label + index} className={isLast ? styles.current : ""} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </li>
              );
            }
            return (
              <li key={item.label + index}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}