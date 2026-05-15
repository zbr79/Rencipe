"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { toastError } from "../components/toast/toast";
import { writeAuthSession } from "../utils/authSession";

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
      <section className={styles.formPanel}>
        <div className={styles.brandLockup}>Rencipe</div>

        <div className={styles.formHeader}>
          <h2>{isAddAccount ? "Add account" : "Welcome back"}</h2>
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

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className={styles.formFooter}>
          <button type="button" onClick={() => toastError("please contant admin")}>
            Forgot password?
          </button>
          {!isAddAccount && (
            <button type="button" onClick={() => toastError("sign up not open")}>
              Sign up
            </button>
          )}
        </div>
      </section>
    </main>
  );
}