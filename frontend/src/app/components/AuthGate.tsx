"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authFetch, clearAuthSession, readAuthSession } from "../utils/authSession";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    const isLoginPage = pathname === "/login";
    const session = readAuthSession();

    async function verifySession() {
      if (!session) {
        if (!active) return;
        setAuthenticated(false);
        setChecking(false);
        if (!isLoginPage) {
          const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
          router.replace(`/login${nextPath}`);
        }
        return;
      }

      try {
        const response = await authFetch("/api/auth/me");
        if (!response.ok) throw new Error("Invalid session");

        if (!active) return;
        setAuthenticated(true);
        setChecking(false);
        if (isLoginPage) router.replace("/");
      } catch {
        if (!active) return;
        clearAuthSession();
        setAuthenticated(false);
        setChecking(false);
        if (!isLoginPage) {
          const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
          router.replace(`/login${nextPath}`);
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (checking) return null;
  if (!authenticated && pathname !== "/login") return null;

  return <>{children}</>;
}