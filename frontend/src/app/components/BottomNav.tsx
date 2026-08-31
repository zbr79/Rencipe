"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import { getCurrentUser } from "../utils/authSession";
import styles from "./bottom-nav.module.css";

interface NavItem {
  href: string | null;
  icon: string;
  label: string;
  action?: () => void;
}

const FULL_NAV_ITEMS: NavItem[] = [
  { href: `/`, icon: "home", label: "Home" },
  { href: `/browse`, icon: "category", label: "Browse" },
  { href: null, icon: "add_circle", label: "Create", action: undefined },
  { href: `/saved`, icon: "favorite_border", label: "Saved" },
  { href: `/settings`, icon: "settings", label: "Settings" },
];

const GUEST_NAV_ITEMS: NavItem[] = [
  { href: `/`, icon: "home", label: "Home" },
  { href: `/browse`, icon: "category", label: "Browse" },
  { href: `/login`, icon: "login", label: "Sign in" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isOpen, openCreateForm, closeCreateForm } = useCreateForm();

  if (pathname === "/login") return null;

  const isGuest = getCurrentUser()?.role === "guest";
  const navItems = isGuest
    ? GUEST_NAV_ITEMS
    : FULL_NAV_ITEMS.map((item) => ({
        ...item,
        action: item.href === null ? openCreateForm : item.action,
      }));

  const getItemIcon = (item: NavItem, active: boolean) => {
    if (item.href === "/saved") {
      return active ? "favorite" : "favorite_border";
    }

    return item.icon;
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navItems}>
        {navItems.map((item) => {
          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (isOpen) {
                    closeCreateForm();
                    return;
                  }
                  item.action?.();
                }}
                className={styles.item}
                title={item.label}
              >
                <span className={`material-symbols-outlined ${styles.icon}`}>
                  {getItemIcon(item, false)}
                </span>
              </button>
            );
          }

          const active = pathname === item.href || (item.href === "/browse" && pathname.startsWith("/browse"));

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`${styles.item} ${active ? styles.active : ""}`}
              title={item.label}
              onClick={() => {
                if (isOpen) closeCreateForm();
              }}
            >
              <span className={`material-symbols-outlined ${styles.icon}`}>
                {getItemIcon(item, active)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
