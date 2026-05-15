import { getCurrentUser, getCurrentUserId } from "./authSession";
import { filterRecipesForUserLanguage, type RecipeLanguage } from "./recipeLanguage";

const RECENTLY_VIEWED_BASE_KEY = "rencipe-recently-viewed-recipes";
const RECENTLY_VIEWED_MAX_ITEMS = 50;
const RECENTLY_VIEWED_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export interface RecentlyViewedRecipe {
  id: string;
  title: string;
  description?: string;
  language?: RecipeLanguage;
  image?: string;
  viewedAt: string;
}

function getRecentlyViewedKey(userId = getCurrentUserId()) {
  return userId ? `${RECENTLY_VIEWED_BASE_KEY}:${userId}` : RECENTLY_VIEWED_BASE_KEY;
}

function isRecentlyViewedRecipe(value: Partial<RecentlyViewedRecipe> | null | undefined): value is RecentlyViewedRecipe {
  return Boolean(value?.id && value.title && value.viewedAt);
}

function pruneRecentlyViewedRecipes(items: RecentlyViewedRecipe[]) {
  const newestById = new Map<string, RecentlyViewedRecipe>();
  const cutoff = Date.now() - RECENTLY_VIEWED_RETENTION_MS;

  items
    .filter(isRecentlyViewedRecipe)
    .sort((left, right) => Date.parse(right.viewedAt) - Date.parse(left.viewedAt))
    .forEach((item) => {
      const viewedAt = Date.parse(item.viewedAt);
      if (!Number.isFinite(viewedAt) || viewedAt < cutoff || newestById.has(item.id)) return;
      newestById.set(item.id, item);
    });

  return Array.from(newestById.values()).slice(0, RECENTLY_VIEWED_MAX_ITEMS);
}

function readRawRecentlyViewedRecipes(userId?: string) {
  if (typeof window === "undefined") return [];

  const storageKey = getRecentlyViewedKey(userId);
  const rawItems = window.localStorage.getItem(storageKey);
  if (!rawItems) return [];

  try {
    const parsedItems = JSON.parse(rawItems);
    if (!Array.isArray(parsedItems)) return [];
    const prunedItems = pruneRecentlyViewedRecipes(parsedItems);
    window.localStorage.setItem(storageKey, JSON.stringify(prunedItems));
    return prunedItems;
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

export function readRecentlyViewedRecipes(userId?: string) {
  return filterRecipesForUserLanguage(readRawRecentlyViewedRecipes(userId), getCurrentUser());
}

export function recordRecentlyViewedRecipe(recipe: Omit<RecentlyViewedRecipe, "viewedAt">, userId?: string) {
  if (typeof window === "undefined" || !recipe.id || !recipe.title) return;

  const storageKey = getRecentlyViewedKey(userId);
  const nextItem: RecentlyViewedRecipe = {
    ...recipe,
    description: recipe.description || "",
    viewedAt: new Date().toISOString(),
  };
  const nextItems = pruneRecentlyViewedRecipes([nextItem, ...readRawRecentlyViewedRecipes(userId)]);

  window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
}

export function clearRecentlyViewedRecipes(userId?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getRecentlyViewedKey(userId));
}

export function removeRecentlyViewedRecipe(recipeId: string, userId?: string) {
  if (typeof window === "undefined" || !recipeId) return [];

  const storageKey = getRecentlyViewedKey(userId);
  const nextItems = readRawRecentlyViewedRecipes(userId).filter((item) => item.id !== recipeId);
  if (nextItems.length === 0) {
    window.localStorage.removeItem(storageKey);
    return [];
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
  return nextItems;
}