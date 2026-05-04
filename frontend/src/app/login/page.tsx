"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { writeAuthSession } from "../utils/authSession";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishLogin = (data: any) => {
    writeAuthSession({
      token: data.token,
      user: data.user,
      signedInAt: new Date().toISOString(),
    });
    const nextPath = new URLSearchParams(window.location.search).get("next");
    router.replace(nextPath || "/");
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
        <div className={styles.brandLockup}>
          <span className={styles.brandIcon} aria-hidden="true">R</span>
          <span>Rencipe</span>
        </div>

        <div className={styles.formHeader}>
          <h2>Sign in</h2>
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

        <p className={styles.helperText}>Backend login controls which recipes you can see. Admin can see private drafts; testuser1 only sees public recipes.</p>
      </section>
    </main>
  );
}