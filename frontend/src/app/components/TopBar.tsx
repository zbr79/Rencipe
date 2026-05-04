"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./top-bar.module.css";

export default function TopBar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navLinks = [
    { href: "/recipes", label: "Recipes" },
    { href: "/saved", label: "Saved" },
    { href: "/meal-plans", label: "Meal Plans" },
  ];

  return (
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

        <div className={styles.actions} aria-hidden="true" />
      </div>
    </header>
  );
}
