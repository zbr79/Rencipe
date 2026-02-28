"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./bottom-nav.module.css";
import LanguageSwitcher from "./LanguageSwitcher";

export default function BottomNav() {
  const pathname = usePathname();
  
  // Extract locale from pathname (e.g., /en/recipes -> en)
  const locale = pathname.split('/')[1] || 'en';

  const navItems = [
    { href: `/${locale}`, icon: "home", label: "Home" },
    { href: `/${locale}/search`, icon: "search", label: "Search" },
    { href: `/${locale}/create`, icon: "add_circle", label: "Create" },
    { href: `/${locale}/saved`, icon: "favorite", label: "Saved" },
    { href: `/${locale}/settings`, icon: "settings", label: "Settings" },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.navItems}>
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
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
      <div className={styles.langSwitcher}>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}