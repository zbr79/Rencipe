"use client";

import { useEffect, useRef, useState } from "react";
import { toastError } from "./toast/toast";
import { writeAuthSession } from "../utils/authSession";
import styles from "./sign-in-modal.module.css";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SignInModal({ open, onClose }: SignInModalProps) {
  const usernameRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    usernameRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose, open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const nextFieldErrors = {
      username: username.trim() ? "" : "Enter your username.",
      password: password.trim() ? "" : "Enter your password.",
    };
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.username || nextFieldErrors.password) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.token || !data?.user) {
        throw new Error(data?.error || "Unable to sign in.");
      }

      writeAuthSession({
        token: data.token,
        user: data.user,
        signedInAt: new Date().toISOString(),
      });
      onClose();
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
      >
        <header className={styles.header}>
          <h2>Sign in</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={loading} aria-label="Close sign in">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span>Username</span>
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: "" }));
              }}
              autoComplete="username"
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? "sign-in-username-error" : undefined}
            />
            {fieldErrors.username && <span id="sign-in-username-error" className={styles.fieldError}>{fieldErrors.username}</span>}
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: "" }));
              }}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "sign-in-password-error" : undefined}
            />
            {fieldErrors.password && <span id="sign-in-password-error" className={styles.fieldError}>{fieldErrors.password}</span>}
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <footer className={styles.footer}>
          <button type="button" onClick={() => toastError("Contact an administrator to reset your password.")}>
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => toastError("Sign up is temporarily disabled.")}
          >
            Sign up
          </button>
        </footer>
      </section>
    </div>
  );
}
