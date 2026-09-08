import { Suspense } from "react";
import BrowsePage from "../components/BrowsePageClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BrowsePage />
    </Suspense>
  );
}
