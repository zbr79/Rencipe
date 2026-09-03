"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authFetch, clearAuthSession, readAuthSession, readSignedInAccounts, writeAuthSession } from "../utils/authSession";

async function startGuestSession() {
  const response = await fetch("/api/auth/guest", { method: "POST" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.token || !data?.user?.id) {
    throw new Error(data?.error || "Failed to start guest session");
  }
  writeAuthSession({ token: data.token, user: data.user, signedInAt: new Date().toISOString() });
}

const GUEST_BLOCKED_PREFIXES = [
  "/create",
  "/edit",
  "/drafts",
  "/my-work",
  "/meals",
  "/settings/account",
  "/settings/profile",
  "/profile",
];

function isGuestBlockedPath(pathname: string) {
  return GUEST_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isMealsPath(pathname: string) {
  return pathname === "/meals" || pathname.startsWith("/meals/");
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    const isLoginPage = pathname === "/login";
    const isAddAccountLogin = isLoginPage && searchParams.get("mode") === "add-account";
    const isAccountSwitcher = pathname === "/settings/account/switch";
    const session = readAuthSession();

    async function verifySession() {
      if (!session) {
        if (!active) return;

        if (isAccountSwitcher && readSignedInAccounts().length > 0) {
          setAuthenticated(true);
          setChecking(false);
          return;
        }

        if (isLoginPage) {
          setAuthenticated(false);
          setChecking(false);
          return;
        }

        try {
          await startGuestSession();
          if (!active) return;
          if (isGuestBlockedPath(pathname)) {
            setChecking(false);
            router.replace("/login");
            return;
          }
          setAuthenticated(true);
          setChecking(false);
        } catch {
          if (!active) return;
          setAuthenticated(false);
          setChecking(false);
          router.replace("/login");
        }
        return;
      }

      try {
        const response = await authFetch("/api/auth/me");

        if (!active) return;
        if (!response.ok) {
          clearAuthSession();
          if (isAccountSwitcher && readSignedInAccounts().length > 0) {
            setAuthenticated(true);
            setChecking(false);
            return;
          }

          setAuthenticated(false);
          setChecking(false);
          if (!isLoginPage) {
            router.replace("/login");
          }
          return;
        }

        const isGuest = session.user?.role === "guest";
        if (isGuest && isGuestBlockedPath(pathname)) {
          setChecking(false);
          router.replace("/login");
          return;
        }

        if (isMealsPath(pathname) && session.user?.role !== "admin") {
          setChecking(false);
          router.replace("/");
          return;
        }

        setAuthenticated(true);
        setChecking(false);
        if (isLoginPage && !isAddAccountLogin && !isGuest) router.replace("/");
      } catch {
        if (!active) return;
        const isGuest = session.user?.role === "guest";
        if (isGuest && isGuestBlockedPath(pathname)) {
          setChecking(false);
          router.replace("/login");
          return;
        }
        if (isMealsPath(pathname) && session.user?.role !== "admin") {
          setChecking(false);
          router.replace("/");
          return;
        }
        setAuthenticated(true);
        setChecking(false);
        if (isLoginPage && !isAddAccountLogin && !isGuest) router.replace("/");
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [pathname, router, searchParams]);

  if (checking) return null;
  if (!authenticated && pathname !== "/login") return null;

  return <>{children}</>;
}
