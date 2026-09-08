"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RecipeComposer from "../recipes/components/RecipeComposer";

function CreatePageInner() {
  const searchParams = useSearchParams();

  return <RecipeComposer mode="create" draftId={searchParams.get("draftId") || undefined} />;
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageInner />
    </Suspense>
  );
}