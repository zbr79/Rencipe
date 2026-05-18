"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authFetch, clearAuthSession, readAuthSession, readSignedInAccounts } from "../utils/authSession";

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

        setAuthenticated(false);
        setChecking(false);
        if (!isLoginPage) {
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

        setAuthenticated(true);
        setChecking(false);
        if (isLoginPage && !isAddAccountLogin) router.replace("/");
      } catch {
        if (!active) return;
        setAuthenticated(true);
        setChecking(false);
        if (isLoginPage && !isAddAccountLogin) router.replace("/");
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
