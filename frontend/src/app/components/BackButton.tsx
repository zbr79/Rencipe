"use client";

import { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export default function BackButton({
  label = "Back",
  fallbackHref = "/",
  className,
  style,
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button type="button" className={className} style={style} onClick={handleBack}>
      {children ?? (
        <>
          <span className="material-symbols-outlined">arrow_back</span>
          {label}
        </>
      )}
    </button>
  );
}
