"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "../contexts/SettingsContext";
import { useTheme } from "../contexts/ThemeContext";
import { toastError } from "./toast/toast";
import { authFetch, readAuthSession, writeAuthSession, type AuthSession } from "../utils/authSession";
import styles from "./settings-modal.module.css";

export default function SettingsModal() {
  const { isOpen, closeSettings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [savingAccountSetting, setSavingAccountSetting] = useState(false);

  useEffect(() => {
    const nextSession = readAuthSession();
    setSession(nextSession);
    if (!nextSession) return;

    let ignore = false;
    authFetch("/api/auth/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.user || ignore) return;
        const refreshedSession = { ...nextSession, user: data.user } satisfies AuthSession;
        writeAuthSession(refreshedSession);
        setSession(refreshedSession);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isGuest = session?.user?.role === "guest";
  const projectModeOn = session?.user.projectMode !== false;

  async function updateAccountSettings(body: { projectMode?: boolean }) {
    setSavingAccountSetting(true);
    try {
      const response = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.user || !data.token) throw new Error(data.error || "Could not save account setting");

      const nextSession = {
        token: data.token,
        user: data.user,
        signedInAt: session?.signedInAt || new Date().toISOString(),
      } satisfies AuthSession;
      writeAuthSession(nextSession);
      setSession(nextSession);
    } catch (error: any) {
      toastError(error.message || "Could not save account setting");
    } finally {
      setSavingAccountSetting(false);
    }
  }

  const darkOn = theme === "dark";

  return (
    <>
      <div className={styles.backdrop} onClick={closeSettings} aria-hidden="true" />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Settings">
        <div className={styles.head}>
          <span className={styles.title}>Settings</span>
          <button type="button" className={styles.close} onClick={closeSettings} aria-label="Close settings">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!isGuest && (
          <>
            <button
              type="button"
              className={styles.row}
              onClick={() => {
                closeSettings();
                router.push("/settings/account");
              }}
            >
              <span className={styles.rowIcon}>
                <span className="material-symbols-outlined">person</span>
              </span>
              <span className={styles.rowLabel}>Account</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            {session?.user.role === "admin" && (
              <div className={styles.row}>
                <span className={styles.rowIcon}>
                  <span className="material-symbols-outlined">filter_alt</span>
                </span>
                <span className={styles.rowLabel}>Project mode</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={projectModeOn}
                  className={`${styles.switch} ${projectModeOn ? styles.switchOn : ""}`}
                  onClick={() => void updateAccountSettings({ projectMode: !projectModeOn })}
                  disabled={savingAccountSetting}
                  aria-label="Project mode"
                >
                  <span className={styles.switchKnob} />
                </button>
              </div>
            )}
          </>
        )}
        <div className={styles.row}>
          <span className={styles.rowIcon}>
            <span className="material-symbols-outlined">language</span>
          </span>
          <span className={styles.rowLabel}>Language</span>
          <select className={styles.select} value="en" disabled aria-label="Language">
            <option value="en">English</option>
          </select>
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon}>
            <span className="material-symbols-outlined">dark_mode</span>
          </span>
          <span className={styles.rowLabel}>Dark mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={darkOn}
            className={`${styles.switch} ${darkOn ? styles.switchOn : ""}`}
            onClick={toggleTheme}
            aria-label="Dark mode"
          >
            <span className={styles.switchKnob} />
          </button>
        </div>
      </div>
    </>
  );
}