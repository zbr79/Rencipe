import type { Metadata } from "next";
import RecipeDetailPage, { type Recipe } from "./RecipeDetailClient";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:6100";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const response = await fetch(`${BACKEND_URL}/recipes/${id}`, { cache: "no-store" });
    if (!response.ok) return {};
    const data = await response.json();
    return {
      title: data.recipe?.title ? `${data.recipe.title} | Rencipe` : "Rencipe",
      description: data.recipe?.description || data.recipe?.subtitle || undefined,
    };
  } catch {
    return {};
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initialRecipe: Recipe | null = null;

  try {
    const response = await fetch(`${BACKEND_URL}/recipes/${id}`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      initialRecipe = data.recipe || null;
    }
  } catch {
    initialRecipe = null;
  }

  return (
    <>
      {initialRecipe?.image && <link rel="preload" as="image" href={initialRecipe.image} />}
      <RecipeDetailPage recipeId={id} initialRecipe={initialRecipe} />
    </>
  );
}