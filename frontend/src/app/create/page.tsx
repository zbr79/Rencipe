"use client";

import { useSearchParams } from "next/navigation";
import RecipeComposer from "../recipes/components/RecipeComposer";

export default function CreatePage() {
  const searchParams = useSearchParams();

  return <RecipeComposer mode="create" draftId={searchParams.get("draftId") || undefined} />;
}
