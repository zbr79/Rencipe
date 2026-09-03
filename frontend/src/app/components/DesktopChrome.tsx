"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCreateForm } from "../contexts/CreateFormContext";
import { useTheme } from "../contexts/ThemeContext";
import AccountAvatar from "./AccountAvatar";
import SearchOverlay from "./SearchOverlay";
import { authFetch, getCurrentUser } from "../utils/authSession";
import { getAccountDisplayName } from "../utils/accountAvatar";
import { readRecentlyViewedRecipes } from "../utils/recentlyViewedRecipes";
import { getVisibleTags } from "../utils/recipeTags";
import styles from "./desktop-chrome.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/browse", label: "Browse", icon: "category" },
  { href: "/saved", label: "Saved", icon: "favorite_border" },
  { href: "/my-work", label: "My Work", icon: "work" },
  { href: "/drafts", label: "Drafts", icon: "draft" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const GUEST_NAV_HREFS = ["/", "/browse", "/saved"];

const MAX_EXPLORE_CATEGORIES = 8;

const CATEGORY_PRIORITY = [
  "Chinese",
  "Cantonese",
  "Sichuan",
  "Korean",
  "Japanese",
  "Thai",
  "Vietnamese",
];

const CATEGORY_ICONS: Record<string, string> = {
  chinese: "restaurant",
  cantonese: "restaurant",
  sichuan: "local_fire_department",
  korean: "ramen_dining",
  japanese: "set_meal",
  thai: "spa",
  vietnamese: "ramen_dining",
  spicy: "local_fire_department",
  soup: "soup_kitchen",
  noodles: "ramen_dining",
  rice: "rice_bowl",
  chicken: "kebab_dining",
  beef: "kebab_dining",
  pork: "kebab_dining",
  seafood: "set_meal",
  vegetarian: "eco",
  vegan: "eco",
  healthy: "eco",
  quick: "bolt",
  easy: "check",
  breakfast: "free_breakfast",
  lunch: "lunch_dining",
  dinner: "dinner_dining",
  dessert: "icecream",
  dumplings: "tapas",
  fried: "local_fire_department",
  steamed: "soup_kitchen",
  curry: "soup_kitchen",
  sandwich: "lunch_dining",
  family: "group",
  "special occasion": "celebration",
};

function iconForCategory(tag: string) {
  return CATEGORY_ICONS[tag.toLowerCase()] || "local_offer";
}

interface SidebarRecipe {
  _id?: string;
  id?: string;
  title: string;
  tags?: string[];
}

export default function DesktopChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const { openCreateForm } = useCreateForm();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const user = getCurrentUser();
  const recentlyViewed = readRecentlyViewedRecipes();
  const [sidebarRecipes, setSidebarRecipes] = useState<SidebarRecipe[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadSidebarRecipes() {
      try {
        const response = await authFetch("/api/recipes?limit=200", { credentials: "include" });
        if (!response.ok || ignore) return;
        const data = await response.json();
        if (!ignore && Array.isArray(data?.recipes)) {
          setSidebarRecipes(data.recipes as SidebarRecipe[]);
        }
      } catch {
        if (!ignore) setSidebarRecipes([]);
      }
    }

    loadSidebarRecipes();

    return () => {
      ignore = true;
    };
  }, []);

  const exploreCategories = useMemo(() => {
    const counts = new Map<string, number>();
    sidebarRecipes.forEach((recipe) => {
      getVisibleTags(recipe.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    const byCount = Array.from(counts.entries()).sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
    );
    const priority = CATEGORY_PRIORITY.map((tag) => ({
      tag,
      count: counts.get(tag) || 0,
    })).filter((entry) => entry.count > 0);
    const rest = byCount
      .filter(([tag]) => !CATEGORY_PRIORITY.includes(tag))
      .map(([tag, count]) => ({ tag, count }));

    const merged = [...priority, ...rest];
    const seen = new Set<string>();
    const result: { tag: string; count: number }[] = [];
    for (const entry of merged) {
      if (seen.has(entry.tag)) continue;
      seen.add(entry.tag);
      result.push(entry);
      if (result.length >= MAX_EXPLORE_CATEGORIES) break;
    }
    return result;
  }, [sidebarRecipes]);

  const surpriseMe = () => {
    if (sidebarRecipes.length === 0) return;
    const recipe = sidebarRecipes[Math.floor(Math.random() * sidebarRecipes.length)];
    const recipeId = recipe._id || recipe.id;
    if (recipeId) router.push(`/recipes/${recipeId}`);
  };

  if (pathname === "/login") return null;

  const isGuest = user?.role === "guest";
  const navItems = isGuest ? NAV_ITEMS.filter((item) => GUEST_NAV_HREFS.includes(item.href)) : NAV_ITEMS;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className={styles.sidebar} aria-label="Primary">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">R</span>
          <span className={styles.brandText}>Rencipe</span>
        </Link>

        {!isGuest && (
          <button type="button" className={styles.createButton} onClick={openCreateForm}>
            <span className="material-symbols-rounded">add</span>
            New Recipe
          </button>
        )}

        <nav className={styles.nav}>
          {navItems.map((item) => (
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

        <div className={styles.sidebarSection}>
          <p className={styles.sidebarSectionLabel}>Explore</p>
          <nav className={styles.sidebarSubNav}>
            <button
              type="button"
              className={styles.sidebarSubLink}
              onClick={surpriseMe}
              disabled={sidebarRecipes.length === 0}
            >
              <span className="material-symbols-rounded">casino</span>
              <span className={styles.sidebarSubLinkTitle}>Surprise me</span>
            </button>
            {exploreCategories.map((category) => (
              <Link
                key={category.tag}
                href={`/browse?category=${encodeURIComponent(category.tag)}`}
                className={styles.sidebarSubLink}
              >
                <span className="material-symbols-rounded">{iconForCategory(category.tag)}</span>
                <span className={styles.sidebarSubLinkTitle}>{category.tag}</span>
                <span className={styles.sidebarSubLinkCount}>{category.count}</span>
              </Link>
            ))}
            <Link href="/browse" className={styles.sidebarSubLink}>
              <span className="material-symbols-rounded">grid_view</span>
              <span className={styles.sidebarSubLinkTitle}>All categories</span>
            </Link>
          </nav>
        </div>

        <div className={styles.sidebarSpacer} />

        {recentlyViewed.length > 0 && (
          <div className={styles.sidebarSection}>
            <p className={styles.sidebarSectionLabel}>Recently viewed</p>
            <nav className={styles.sidebarSubNav}>
              {recentlyViewed.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/recipes/${item.id}`}
                  className={styles.sidebarSubLink}
                  title={item.title}
                >
                  <span className="material-symbols-rounded">history</span>
                  <span className={styles.sidebarSubLinkTitle}>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="material-symbols-rounded">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {isGuest ? (
          <div className={styles.accountRow}>
            <div className={styles.account}>
              <AccountAvatar account={user} size={32} />
              <span className={styles.accountName}>Guest</span>
            </div>
            <button
              type="button"
              className={styles.accountSettings}
              onClick={() => router.push("/settings")}
              aria-label="Settings"
              title="Settings"
            >
              <span className="material-symbols-rounded">settings</span>
            </button>
          </div>
        ) : (
          <div className={styles.accountRow}>
            <Link href="/settings/account" className={styles.account}>
              <AccountAvatar account={user} size={32} />
              <span className={styles.accountName}>
                {getAccountDisplayName(user) || "Account"}
              </span>
            </Link>
            <button
              type="button"
              className={styles.accountSettings}
              onClick={() => router.push("/settings")}
              aria-label="Settings"
              title="Settings"
            >
              <span className="material-symbols-rounded">settings</span>
            </button>
          </div>
        )}
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

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
