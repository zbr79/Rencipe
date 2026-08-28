"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import AccountAvatar from "./AccountAvatar";
import SearchOverlay from "./SearchOverlay";
import { getCurrentUser, type AuthUser } from "../utils/authSession";
import { getAccountDisplayName } from "../utils/accountAvatar";
import styles from "./desktop-chrome.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse", label: "Browse", icon: "category" },
  { href: "/saved", label: "Saved", icon: "favorite_border" },
  { href: "/meals", label: "Meals", icon: "restaurant_menu" },
  { href: "/my-work", label: "My Work", icon: "work" },
  { href: "/drafts", label: "Drafts", icon: "draft" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function DesktopChrome() {
  const pathname = usePathname();
  const { openCreateForm } = useCreateForm();
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    setSearchOpen(false);
  }, [pathname]);

  if (pathname === "/login") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className={styles.sidebar} aria-label="Primary">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">R</span>
          <span className={styles.brandText}>Rencipe</span>
        </Link>

        <button type="button" className={styles.createButton} onClick={openCreateForm}>
          <span className="material-symbols-rounded">add</span>
          New Recipe
        </button>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ""}`}
            >
              <span className="material-symbols-rounded">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/settings/account" className={styles.account}>
          <AccountAvatar account={user} size={32} />
          <span className={styles.accountName}>
            {user?.role === "guest" ? "Guest — Create account" : getAccountDisplayName(user) || "Account"}
          </span>
        </Link>
      </aside>

      <header className={styles.topStrip}>
        <button
          type="button"
          className={styles.searchTrigger}
          onClick={() => setSearchOpen(true)}
        >
          <span className="material-symbols-rounded">search</span>
          <span className={styles.searchHint}>Search recipes…</span>
        </button>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
