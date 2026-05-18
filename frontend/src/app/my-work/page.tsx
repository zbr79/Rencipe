"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BackButton from "../components/BackButton";
import { toastError, toastSuccess } from "../components/toast/toast";
import { useSaved, type Meal } from "../contexts/SavedContext";
import { authFetch, getCurrentUser, type AuthUser } from "../utils/authSession";
import type { AccountIdentity } from "../utils/accountAvatar";
import styles from "./page.module.css";

type VisibilityTab = "private" | "public";
type WorkKind = "all" | "recipes" | "meals" | "trash";
type WorkItemKind = "recipes" | "meals";

interface Recipe {
  id: string;
  _id?: string;
  title: string;
  description: string;
  image?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  trashExpiresAt?: string | null;
  author?: AccountIdentity | null;
  authorId?: string | (AccountIdentity & { _id?: string | null }) | null;
}

interface WorkItem {
  id: string;
  kind: WorkItemKind;
  title: string;
  meta: string;
  href?: string;
  image?: string;
  icon: string;
  updatedAt?: string;
  trashed?: boolean;
}

function getIdentityId(identity?: Recipe["authorId"] | Recipe["author"]) {
  if (!identity) return "";
  if (typeof identity === "string") return identity;
  return identity.id || ("_id" in identity ? identity._id || "" : "");
}

function formatDate(value?: string) {
  if (!value) return "Updated recently";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Updated recently";
  return `Updated ${new Date(timestamp).toLocaleDateString()}`;
}

function formatTrashTime(value?: string | null) {
  if (!value) return "Removed soon";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Removed soon";
  const daysLeft = Math.max(0, Math.ceil((timestamp - Date.now()) / (24 * 60 * 60 * 1000)));
  if (daysLeft <= 0) return "Removed soon";
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
}

function recipeToItem(recipe: Recipe, trashed = false): WorkItem {
  const recipeId = recipe._id || recipe.id;
  return {
    id: recipeId,
    kind: "recipes",
    title: recipe.title || "Untitled Recipe",
    meta: trashed ? `Recipe | ${formatTrashTime(recipe.trashExpiresAt)}` : recipe.isPublic === false ? "Private recipe" : "Public recipe",
    href: trashed ? undefined : `/recipes/${recipeId}`,
    image: recipe.image,
    icon: "restaurant",
    updatedAt: trashed ? recipe.deletedAt || recipe.updatedAt : recipe.updatedAt || recipe.createdAt,
    trashed,
  };
}

function mealToItem(meal: Meal, trashed = false): WorkItem {
  const recipeCount = meal.recipes?.length || 0;

  return {
    id: meal._id,
    kind: "meals",
    title: meal.name || "Untitled Meal",
    meta: trashed ? `Meal | ${formatTrashTime(meal.trashExpiresAt)}` : `Meal | ${recipeCount} recipes`,
    href: trashed ? undefined : `/meals/${meal._id}`,
    icon: "restaurant",
    updatedAt: trashed ? meal.deletedAt || meal.updatedAt : meal.updatedAt,
    trashed,
  };
}

export default function MyWorkPage() {
  const { meals, fetchMeals, loadingMeals } = useSaved();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [trashRecipes, setTrashRecipes] = useState<Recipe[]>([]);
  const [trashMeals, setTrashMeals] = useState<Meal[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingTrash, setLoadingTrash] = useState(true);
  const [error, setError] = useState("");
  const [visibilityTab, setVisibilityTab] = useState<VisibilityTab>("private");
  const [workKind, setWorkKind] = useState<WorkKind>("all");
  const [restoringId, setRestoringId] = useState("");

  useEffect(() => {
    const account = getCurrentUser();
    setCurrentUser(account);
    fetchMeals();
    fetchRecipes();
    fetchTrash(account?.id || "");
  }, []);

  useEffect(() => {
    if (searchParams.get("kind") === "trash") {
      setWorkKind("trash");
    }
  }, [searchParams]);

  const fetchRecipes = async () => {
    setLoadingRecipes(true);
    setError("");
    try {
      const response = await authFetch("/api/recipes?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      const data = await response.json();
      setRecipes((data.recipes || []) as Recipe[]);
    } catch (err: any) {
      setError(err.message || "Failed to load work");
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const fetchTrash = async (accountId: string) => {
    if (!accountId) {
      setTrashRecipes([]);
      setTrashMeals([]);
      setLoadingTrash(false);
      return;
    }

    setLoadingTrash(true);
    try {
      const [recipeResponse, mealResponse] = await Promise.all([
        authFetch("/api/recipes?limit=1000&trash=1"),
        authFetch(`/api/meals?userId=${accountId}&trash=1&kind=meal`),
      ]);

      if (!recipeResponse.ok) throw new Error("Failed to fetch trashed recipes");
      if (!mealResponse.ok) throw new Error("Failed to fetch trashed meals");

      const recipeData = await recipeResponse.json();
      const mealData = await mealResponse.json();
      setTrashRecipes((recipeData.recipes || []) as Recipe[]);
      setTrashMeals((mealData.meals || []) as Meal[]);
    } catch (err: any) {
      setError(err.message || "Failed to load trash");
      setTrashRecipes([]);
      setTrashMeals([]);
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestore = async (item: WorkItem) => {
    setRestoringId(`${item.kind}-${item.id}`);
    try {
      const restorePath = item.kind === "recipes"
        ? `/api/recipes/${item.id}/restore`
        : `/api/meals/${item.id}/restore`;
      const response = await authFetch(restorePath, { method: "PATCH" });
      if (!response.ok) throw new Error("Restore failed");
      await Promise.all([fetchRecipes(), fetchMeals(), fetchTrash(currentUser?.id || "")]);
      toastSuccess(`${item.title} restored`);
    } catch (err: any) {
      toastError(err.message || "Could not restore item");
    } finally {
      setRestoringId("");
    }
  };

  const ownedRecipes = useMemo(() => {
    const accountId = currentUser?.id || "";
    return recipes.filter((recipe) => {
      const ownerId = getIdentityId(recipe.authorId) || getIdentityId(recipe.author);
      if (!ownerId) return currentUser?.role === "admin";
      return ownerId === accountId;
    });
  }, [currentUser, recipes]);

  const activeWorkItems = useMemo(() => {
    const recipeItems = ownedRecipes
      .filter((recipe) => visibilityTab === "public" ? recipe.isPublic !== false : recipe.isPublic === false)
      .map((recipe) => recipeToItem(recipe));

    const mealItems = visibilityTab === "private" ? meals.map((meal) => mealToItem(meal)) : [];
    return [...recipeItems, ...mealItems].sort((left, right) => Date.parse(right.updatedAt || "") - Date.parse(left.updatedAt || ""));
  }, [meals, ownedRecipes, visibilityTab]);

  const trashItems = useMemo(() => {
    const recipeItems = trashRecipes
      .filter((recipe) => visibilityTab === "public" ? recipe.isPublic !== false : recipe.isPublic === false)
      .map((recipe) => recipeToItem(recipe, true));
    const mealItems = visibilityTab === "private" ? trashMeals.map((meal) => mealToItem(meal, true)) : [];
    return [...recipeItems, ...mealItems].sort((left, right) => Date.parse(right.updatedAt || "") - Date.parse(left.updatedAt || ""));
  }, [trashMeals, trashRecipes, visibilityTab]);

  const workItems = useMemo(() => {
    if (workKind === "trash") return trashItems;
    return workKind === "all" ? activeWorkItems : activeWorkItems.filter((item) => item.kind === workKind);
  }, [activeWorkItems, trashItems, workKind]);

  const counts = useMemo(() => {
    const privateRecipes = ownedRecipes.filter((recipe) => recipe.isPublic === false).length;
    const publicRecipes = ownedRecipes.filter((recipe) => recipe.isPublic !== false).length;
    const privateItems = [
      ...ownedRecipes.filter((recipe) => recipe.isPublic === false).map((recipe) => recipeToItem(recipe)),
      ...meals.map((meal) => mealToItem(meal)),
    ];
    const scopedItems = visibilityTab === "public"
      ? ownedRecipes.filter((recipe) => recipe.isPublic !== false).map((recipe) => recipeToItem(recipe))
      : privateItems;
    return {
      private: privateRecipes + meals.length,
      public: publicRecipes,
      all: scopedItems.length,
      recipes: scopedItems.filter((item) => item.kind === "recipes").length,
      meals: scopedItems.filter((item) => item.kind === "meals").length,
      trash: trashItems.length,
    };
  }, [meals, ownedRecipes, trashItems.length, visibilityTab]);

  const loading = loadingRecipes || loadingMeals || (workKind === "trash" && loadingTrash);

  return (
    <main className={styles.container}>
      <header className={styles.pageHeader}>
        <BackButton fallbackHref="/settings" className={styles.backLink} />
        <div>
          <p className={styles.kicker}>Workspace</p>
          <h1>My Work</h1>
        </div>
      </header>

      <div className={styles.visibilityTabs} role="tablist" aria-label="Work visibility">
        {(["private", "public"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={visibilityTab === tab}
            className={`${styles.visibilityTab} ${visibilityTab === tab ? styles.visibilityTabActive : ""}`}
            onClick={() => {
              setVisibilityTab(tab);
              setWorkKind("all");
            }}
          >
            <span className="material-symbols-outlined">{tab === "private" ? "lock" : "public"}</span>
            {tab === "private" ? `Private (${counts.private})` : `Public (${counts.public})`}
          </button>
        ))}
      </div>

      <div className={styles.kindTabs} aria-label="Work type filters">
        {([
          ["all", "All"],
          ["recipes", "Recipes"],
          ["meals", "Meals"],
          ["trash", "Trash"],
        ] as const).map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            className={`${styles.kindTab} ${workKind === kind ? styles.kindTabActive : ""}`}
            onClick={() => setWorkKind(kind)}
          >
            <span className={styles.kindTabLabel}>{label}</span>
            <span className={styles.kindTabCount}>({counts[kind]})</span>
          </button>
        ))}
      </div>

      {error && <p className={styles.errorText}>Error: {error}</p>}
      {loading && <p className={styles.statusText}>Loading...</p>}

      {!loading && workItems.length === 0 ? (
        <div className={styles.emptyState}>No work found for this filter</div>
      ) : (
        <div className={styles.workList}>
          {workItems.map((item) => (
            item.trashed ? (
              <div key={`${item.kind}-${item.id}`} className={`${styles.workRow} ${styles.workRowWithAction}`}>
                <div className={styles.workImage}>
                  {item.image ? <img src={item.image} alt={item.title} /> : <span className="material-symbols-outlined">delete</span>}
                </div>
                <div className={styles.workText}>
                  <h3>{item.title}</h3>
                  <p>{item.meta}</p>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
                <button
                  type="button"
                  className={styles.restoreButton}
                  onClick={() => handleRestore(item)}
                  disabled={restoringId === `${item.kind}-${item.id}`}
                >
                  {restoringId === `${item.kind}-${item.id}` ? "Restoring" : "Restore"}
                </button>
              </div>
            ) : (
              <Link key={`${item.kind}-${item.id}`} href={item.href || "/my-work"} className={styles.workRow}>
                <div className={styles.workImage}>
                  {item.image ? <img src={item.image} alt={item.title} /> : <span className="material-symbols-outlined">{item.icon}</span>}
                </div>
                <div className={styles.workText}>
                  <h3>{item.title}</h3>
                  <p>{item.meta}</p>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            )
          ))}
        </div>
      )}
    </main>
  );
}
