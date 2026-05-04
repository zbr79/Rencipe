"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import styles from "./bottom-nav.module.css";

interface NavItem {
  href: string | null;
  icon: string;
  label: string;
  action?: () => void;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { openCreateForm } = useCreateForm();

  if (pathname === "/login") return null;

  const navItems: NavItem[] = [
    { href: `/`, icon: "home", label: "Home" },
    { href: `/categories`, icon: "category", label: "Browse" },
    { href: null, icon: "add_circle", label: "Create", action: openCreateForm },
    { href: `/saved`, icon: "bookmark", label: "Saved" },
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

          const active = pathname === item.href || (item.href === "/categories" && pathname.startsWith("/categories"));

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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
