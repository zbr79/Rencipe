"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({
  items,
  mobileBackHref = "/",
  historyBack = false,
  historyBackLabel = "Previous page",
}: {
  items: BreadcrumbItem[];
  mobileBackHref?: string;
  historyBack?: boolean;
  historyBackLabel?: string;
}) {
  const router = useRouter();
  if (items.length === 0) return null;
  const breadcrumbItems = historyBack
    ? [{ label: historyBackLabel, href: mobileBackHref }, ...items]
    : items;

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <ol className={styles.list}>
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            if (isLast || !item.href) {
              return (
                <li key={item.label + index} className={isLast ? styles.current : ""} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </li>
              );
            }
            return (
              <li key={item.label + index}>
                <Link
                  href={item.href}
                  onClick={(event) => {
                    if (historyBack && index === 0 && typeof window !== "undefined" && window.history.length > 1) {
                      event.preventDefault();
                      router.back();
                    }
                  }}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}