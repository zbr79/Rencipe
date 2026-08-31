import { Suspense } from "react";
import HomePage from "./components/HomePageClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  );
}
