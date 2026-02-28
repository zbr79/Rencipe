"use client";

import { ReactNode } from "react";

export default function AppWrapper({ children }: { children: ReactNode }) {
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
