import { Suspense } from "react";
import HomePage, { type Recipe } from "./components/HomePageClient";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:6100";

async function fetchRecipes(): Promise<Recipe[] | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/recipes`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.recipes) ? data.recipes : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const initialRecipes = await fetchRecipes();
  const publicRecipes = Array.isArray(initialRecipes)
    ? initialRecipes.filter((recipe) => recipe.isPublic !== false)
    : [];
  const newest = [...publicRecipes].sort(
    (a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "")
  );
  const heroImage = newest.find((recipe) => recipe.image)?.image;

  return (
    <>
      {heroImage && <link rel="preload" as="image" href={heroImage} fetchPriority="high" />}
      <Suspense fallback={null}>
        <HomePage initialRecipes={initialRecipes} initialVisibleCount={24} />
      </Suspense>
    </>
  );
}