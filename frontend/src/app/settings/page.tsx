"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountAvatar from "../components/AccountAvatar";
import { toastError, toastSuccess } from "../components/toast/toast";
import { useTheme } from "../contexts/ThemeContext";
import { getAccountDisplayName } from "../utils/accountAvatar";
import { authFetch, clearAuthSession, readAuthSession, writeAuthSession, type AuthSession } from "../utils/authSession";
import styles from "./page.module.css";

const languageOptions = [{ value: "en", label: "English" }];

const shortcutItems = [
  { label: "Drafts", icon: "description", href: "/drafts" },
  { label: "Meal Preferences", icon: "tune", message: "Meal preferences ready" },
  { label: "Notifications", icon: "notifications", message: "Notifications ready" },
  { label: "Privacy", icon: "lock", message: "Privacy controls ready" },
];

interface ProfileForm {
  displayName: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    displayName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const nextSession = readAuthSession();
    setSession(nextSession);
    setProfileForm((current) => ({
      ...current,
      displayName: nextSession?.user.displayName || "",
      email: nextSession?.user.email || "",
      phone: nextSession?.user.phone || "",
    }));

    if (!nextSession) return;

    let ignore = false;
    authFetch("/api/auth/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.user || ignore) return;

        const refreshedSession = { ...nextSession, user: data.user } satisfies AuthSession;
        writeAuthSession(refreshedSession);
        setSession(refreshedSession);
        setProfileForm((current) => ({
          ...current,
          displayName: data.user.displayName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        }));
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleSignOut = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const handleShortcut = (item: typeof shortcutItems[number]) => {
    if (item.href) {
      router.push(item.href);
      return;
    }

    toastSuccess(item.message || `${item.label} ready`);
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update profile");

      const nextSession = {
        token: data.token,
        user: data.user,
        signedInAt: session?.signedInAt || new Date().toISOString(),
      } satisfies AuthSession;

      writeAuthSession(nextSession);
      setSession(nextSession);
      setProfileForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      toastSuccess("Profile updated");
    } catch (error: any) {
      toastError(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <div className={styles.profileCard}>
          <AccountAvatar account={session?.user} size={52} />
          <div>
            <h1>{getAccountDisplayName(session?.user)}</h1>
            <p>{session?.user.email || session?.user.username || "Current account"}</p>
          </div>
        </div>

        <button type="button" className={styles.settingItemButton} onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined">manage_accounts</span>
            <span>Edit Profile</span>
          </div>
          <span className="material-symbols-outlined">{profileOpen ? "expand_less" : "chevron_right"}</span>
        </button>

        {profileOpen && (
          <form className={styles.profileEditor} onSubmit={handleProfileSave}>
            <label>
              <span>Display name</span>
              <input value={profileForm.displayName} onChange={(event) => updateProfileField("displayName", event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={profileForm.email} onChange={(event) => updateProfileField("email", event.target.value)} />
            </label>
            <label>
              <span>Phone</span>
              <input value={profileForm.phone} onChange={(event) => updateProfileField("phone", event.target.value)} />
            </label>
            <label>
              <span>Current password</span>
              <input type="password" value={profileForm.currentPassword} onChange={(event) => updateProfileField("currentPassword", event.target.value)} autoComplete="current-password" />
            </label>
            <label>
              <span>New password</span>
              <input type="password" value={profileForm.newPassword} onChange={(event) => updateProfileField("newPassword", event.target.value)} autoComplete="new-password" />
            </label>
            <div className={styles.profileActions}>
              <button type="submit" className={styles.primaryButton} disabled={savingProfile}>
                {savingProfile ? "Saving" : "Save profile"}
              </button>
              <button type="button" className={styles.signOutButton} onClick={handleSignOut}>
                <span className="material-symbols-outlined">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        )}
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