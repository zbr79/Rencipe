"use client";

import { useParams } from "next/navigation";
import RecipeComposer from "../../recipes/components/RecipeComposer";

export default function EditPage() {
  const params = useParams();

  return <RecipeComposer mode="edit" recipeId={params.id as string} />;
}
