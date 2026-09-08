"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchOverlay from "./SearchOverlay";
import styles from "./top-bar.module.css";

export default function TopBar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  if (pathname === "/login") return null;

  const navLinks = [
    { href: "/browse", label: "Browse" },
    { href: "/saved", label: "Saved" },
  ];

  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon} aria-hidden="true">R</span>
            <span className={styles.logoText}>Rencipe</span>
          </Link>

          <nav className={styles.navLinks} aria-label="Main navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.actions}>
            <button type="button" className={styles.searchButton} onClick={() => setSearchOpen(true)} aria-label="Open search">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
