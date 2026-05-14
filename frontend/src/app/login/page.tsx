"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { writeAuthSession } from "../utils/authSession";

type LoginView = "signin" | "signup" | "recover";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddAccount = searchParams.get("mode") === "add-account";
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [username, setUsername] = useState(isAddAccount ? "" : "admin");
  const [password, setPassword] = useState(isAddAccount ? "" : "admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<LoginView>("signin");

  useEffect(() => {
    document.body.classList.add("loginScreen");
    return () => document.body.classList.remove("loginScreen");
  }, []);

  const finishLogin = (data: any) => {
    writeAuthSession({
      token: data.token,
      user: data.user,
      signedInAt: new Date().toISOString(),
    });
    router.replace(isAddAccount ? nextPath : "/");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Enter a username and password to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      finishLogin(data);
    } catch (err: any) {
      setError(err.message || "Unable to sign in.");
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.authShell}>
        <div className={styles.brandPanel}>
          <div className={styles.brandLockup}>
            <span className={styles.brandIcon} aria-hidden="true">R</span>
            <span>Rencipe</span>
          </div>
          <h1>Cook, save, and plan from one recipe workspace.</h1>
        </div>

        <div className={styles.formPanel}>
          {activeView === "signin" ? (
            <>
              <div className={styles.formHeader}>
                <h2>{isAddAccount ? "Add account" : "Sign in"}</h2>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field}>
                  <span>Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                <button type="button" className={styles.inlineLink} onClick={() => setActiveView("recover")}>
                  Forgot password?
                </button>

                {error && <div className={styles.error}>{error}</div>}

                <button type="submit" className={styles.primaryButton} disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              {!isAddAccount && (
                <div className={styles.formFooter}>
                  <span>New to Rencipe?</span>
                  <button type="button" onClick={() => setActiveView("signup")}>Create account</button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.placeholderPanel}>
              <div className={styles.formHeader}>
                <h2>{activeView === "signup" ? "Create account" : "Recover password"}</h2>
              </div>
              <p>{activeView === "signup" ? "Sign up is not open yet." : "Please contact an administrator to recover your password."}</p>
              <button type="button" className={styles.primaryButton} onClick={() => setActiveView("signin")}>
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}