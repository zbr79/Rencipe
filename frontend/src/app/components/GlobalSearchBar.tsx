"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./global-search-bar.module.css";

export default function GlobalSearchBar() {
  const pathname = usePathname();
  const router = useRouter();

  const hiddenRoutes = ["/login", "/search", "/browse", "/saved", "/settings", "/drafts", "/create"];
  const hiddenPrefixes = ["/edit", "/recipes/", "/meal-plans", "/weekly-plans", "/settings/"];

  if (hiddenRoutes.includes(pathname) || hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) return null;

  const goToSearch = () => router.push("/search");

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.searchButton} onClick={goToSearch}>
        <span className={`material-symbols-outlined ${styles.icon}`}>search</span>
        <span>Search recipes, tags, and ingredients</span>
      </button>
    </div>
  );
}