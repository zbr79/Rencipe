"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "./bottom-nav.module.css";
import LanguageSwitcher from "./LanguageSwitcher";

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("navigation");

  const navItems = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/recipes`, label: t("recipes") },
    { href: `/${locale}/search`, label: t("search") },
    { href: `/${locale}/create`, label: t("create") },
    { href: `/${locale}/saved`, label: t("saved") },
    { href: `/${locale}/profile`, label: t("profile") },
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
            >
              {item.label}
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