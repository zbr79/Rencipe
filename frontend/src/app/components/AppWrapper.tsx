"use client";

import { ReactNode, useEffect } from "react";
import { populateRecipeImages } from "../utils/populateImages";

export default function AppWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Populate recipe images on app startup (once)
    const populateImages = async () => {
      try {
        await populateRecipeImages();
      } catch (error) {
        // Silently fail - images will be generated on demand if needed
        console.warn("Could not pre-populate recipe images", error);
      }
    };

    populateImages();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        paddingBottom: 'max(80px, calc(60px + env(safe-area-inset-bottom)))',
      }}
    >
      {children}
    </div>
  );
}
