"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountAvatar from "../components/AccountAvatar";
import AccountSwitchModal from "../components/AccountSwitchModal";
import { toastError, toastSuccess } from "../components/toast/toast";
import { useTheme } from "../contexts/ThemeContext";
import { getAccountDisplayName } from "../utils/accountAvatar";
import { authFetch, readAuthSession, writeAuthSession, type AuthSession } from "../utils/authSession";
import styles from "./page.module.css";

type AccountLanguage = "en" | "zh";

const languageOptions: { value: AccountLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
];

const shortcutItems = [
  { label: "Drafts", icon: "description", href: "/drafts" },
  { label: "My Work", icon: "workspaces", href: "/my-work" },
  { label: "Recent", icon: "history", href: "/recently-viewed" },
  { label: "Notifications", icon: "notifications", message: "Notifications ready" },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
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
  }, []);

  const handleShortcut = (item: typeof shortcutItems[number]) => {
    if (item.href) {
      router.push(item.href);
      return;
    }

    toastSuccess(item.message || `${item.label} ready`);
  };

  const selectedLanguage = session?.user.language === "zh" ? "zh" : "en";
  const selectedLanguageLabel = languageOptions.find((option) => option.value === selectedLanguage)?.label || "English";
  const projectModeOn = session?.user.projectMode !== false;

  async function updateAccountSettings(body: { language?: AccountLanguage; projectMode?: boolean }) {
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

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <div className={styles.accountSummaryRow}>
          <button type="button" className={styles.accountSummaryAvatarButton} onClick={() => router.push("/settings/account")} aria-label="Open account settings">
            <AccountAvatar account={session?.user} size={50} />
          </button>
          <span className={styles.accountSummaryText}>
            <span className={styles.accountSummaryTitleLine}>
              <button type="button" className={styles.accountSummaryTitleButton} onClick={() => router.push("/settings/account")}>
                {getAccountDisplayName(session?.user)}
              </button>
              <button type="button" className={styles.accountSwitchButton} onClick={() => setSwitchModalOpen(true)} aria-label="Switch account">
                <span className="material-symbols-outlined">swap_horiz</span>
              </button>
            </span>
            <button type="button" className={styles.accountSummarySubtitleButton} onClick={() => router.push("/settings/account")}>
              {session?.user.email || session?.user.username || "Account settings"}
            </button>
          </span>
          <button type="button" className={styles.accountSummaryChevronButton} onClick={() => router.push("/settings/account")} aria-label="Open account settings">
            <span className={`material-symbols-outlined ${styles.accountSummaryChevron}`}>chevron_right</span>
          </button>
        </div>
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
            <button type="button" className={styles.customSelectButton} onClick={() => setLanguageOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={languageOpen} disabled={savingAccountSetting}>
              <span>{selectedLanguageLabel}</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {languageOpen && (
              <div className={styles.customSelectMenu} role="listbox">
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={styles.customSelectOption}
                    onClick={() => {
                      setLanguageOpen(false);
                      if (option.value !== selectedLanguage) void updateAccountSettings({ language: option.value });
                    }}
                    role="option"
                    aria-selected={option.value === selectedLanguage}
                  >
                    <span className={styles.customSelectOptionLabel}>{option.label}</span>
                    {option.value === selectedLanguage && <span className={`material-symbols-outlined ${styles.customSelectCheck}`}>check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {session?.user.role === "admin" && (
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <span className="material-symbols-outlined">filter_alt</span>
              <span>Project Mode</span>
            </label>
            <label className={styles.projectModeToggle}>
              <input
                type="checkbox"
                checked={projectModeOn}
                disabled={savingAccountSetting}
                onChange={(event) => void updateAccountSettings({ projectMode: event.target.checked })}
              />
              <span>{projectModeOn ? "On" : "Off"}</span>
            </label>
          </div>
        )}

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

      <AccountSwitchModal isOpen={switchModalOpen} onClose={() => setSwitchModalOpen(false)} />
    </div>
  );
}