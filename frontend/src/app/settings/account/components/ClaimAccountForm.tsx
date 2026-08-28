"use client";

import { useState } from "react";
import { authFetch, writeAuthSession, type AuthSession } from "../../../utils/authSession";
import { toastError, toastSuccess } from "../../../components/toast/toast";
import styles from "./claim-account.module.css";

interface ClaimAccountFormProps {
  onClaimed: (session: AuthSession) => void;
}

export default function ClaimAccountForm({ onClaimed }: ClaimAccountFormProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      const response = await authFetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim() || undefined,
          password,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.error || "Could not create account");
      }

      const nextSession = { token: data.token, user: data.user, signedInAt: new Date().toISOString() } satisfies AuthSession;
      writeAuthSession(nextSession);
      onClaimed(nextSession);
      toastSuccess("Account created — your data is now linked to it.");
    } catch (err: any) {
      toastError(err.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <h2>Create your account</h2>
        <p>You&apos;re using a guest profile. Pick a username and password to keep your recipes, saves, and meals across devices.</p>
      </div>

      <label className={styles.field}>
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="3-20 letters, numbers, underscore"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
        />
      </label>

      <label className={styles.field}>
        <span>Display name (optional)</span>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How others see you"
          autoComplete="name"
          maxLength={40}
        />
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </label>

      <button type="submit" className={styles.submit} disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
