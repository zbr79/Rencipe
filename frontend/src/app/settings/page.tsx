"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountAvatar from "../components/AccountAvatar";
import { toastSuccess } from "../components/toast/toast";
import { useTheme } from "../contexts/ThemeContext";
import { getAccountDisplayName } from "../utils/accountAvatar";
import { authFetch, readAuthSession, writeAuthSession, type AuthSession } from "../utils/authSession";
import styles from "./page.module.css";

const languageOptions = [{ value: "en", label: "English" }];

const shortcutItems = [
  { label: "Drafts", icon: "description", href: "/drafts" },
  { label: "My Work", icon: "workspaces", href: "/my-work" },
  { label: "Recipe Ideas", icon: "tips_and_updates", message: "Recipe ideas ready" },
  { label: "Notifications", icon: "notifications", message: "Notifications ready" },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);

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
  }, []);

  const handleShortcut = (item: typeof shortcutItems[number]) => {
    if (item.href) {
      router.push(item.href);
      return;
    }

    toastSuccess(item.message || `${item.label} ready`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <button type="button" className={styles.accountSummaryButton} onClick={() => router.push("/settings/account")}>
          <span className={styles.accountSummaryMain}>
            <AccountAvatar account={session?.user} size={52} />
            <span className={styles.accountSummaryText}>
              <span className={styles.accountSummaryTitle}>{getAccountDisplayName(session?.user)}</span>
              <span className={styles.accountSummarySubtitle}>{session?.user.email || session?.user.username || "Account settings"}</span>
            </span>
          </span>
          <span className={`material-symbols-outlined ${styles.accountSummaryChevron}`}>chevron_right</span>
        </button>
      </div>

      <div className={styles.shortcutGrid} aria-label="Account shortcuts">
        {shortcutItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.shortcutButton}
            onClick={() => handleShortcut(item)}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.group}>
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined">language</span>
            <span>Language</span>
          </div>
          <div className={styles.customSelectWrap}>
            <button type="button" className={styles.customSelectButton} onClick={() => setLanguageOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={languageOpen}>
              <span>{languageOptions[0].label}</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {languageOpen && (
              <div className={styles.customSelectMenu} role="listbox">
                {languageOptions.map((option) => (
                  <button key={option.value} type="button" className={styles.customSelectOption} onClick={() => setLanguageOpen(false)} role="option" aria-selected="true">
                    <span>{option.label}</span>
                    <span className="material-symbols-outlined">check</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined">dark_mode</span>
            <span>Dark Mode</span>
          </div>
          <button type="button" className={`${styles.toggle} ${theme === "dark" ? styles.active : ""}`} onClick={toggleTheme}>
            {theme === "dark" ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}