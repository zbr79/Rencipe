"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      containerStyle={{
        top: "calc(12px + env(safe-area-inset-top))",
        zIndex: 2200,
      }}
      toastOptions={{
        duration: 2500,
        style: {
          maxWidth: "min(420px, calc(100vw - 28px))",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          padding: "10px 14px",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "var(--shadow-md)",
          color: "var(--foreground)",
          background: "var(--card-bg)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
          style: {
            background: "color-mix(in srgb, var(--success) 10%, var(--card-bg))",
            borderLeft: "5px solid var(--success)",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            background: "color-mix(in srgb, var(--error) 10%, var(--card-bg))",
            borderLeft: "5px solid var(--error)",
          },
        },
        loading: {
          style: {
            background: "color-mix(in srgb, var(--primary) 10%, var(--card-bg))",
            borderLeft: "5px solid var(--primary)",
          },
        },
      }}
    />
  );
}
