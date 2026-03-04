"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import { useSaved } from "../contexts/SavedContext";
import styles from "./bottom-nav.module.css";

interface NavItem {
  href: string | null;
  icon: string;
  label: string;
  action?: () => void;
  badge?: number;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { openCreateForm } = useCreateForm();
  const { savedCount, mealPlans } = useSaved();
  const totalSavedCount = savedCount + mealPlans.length;

  const navItems: NavItem[] = [
    { href: `/`, icon: "home", label: "Home" },
    { href: `/search`, icon: "search", label: "Search" },
    { href: null, icon: "add_circle", label: "Create", action: openCreateForm },
    { href: `/saved`, icon: "bookmark", label: "Saved", badge: totalSavedCount },
    { href: `/settings`, icon: "settings", label: "Settings" },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.navItems}>
        {navItems.map((item) => {
          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={styles.item}
                title={item.label}
              >
                <span className={`material-symbols-outlined ${styles.icon}`}>
                  {item.icon}
                </span>
              </button>
            );
          }

          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`${styles.item} ${active ? styles.active : ""}`}
              title={item.label}
            >
              <span className={`material-symbols-outlined ${styles.icon}`}>
                {item.icon}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
