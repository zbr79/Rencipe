"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountAvatar from "../../components/AccountAvatar";
import BackButton from "../../components/BackButton";
import { toastError, toastSuccess } from "../../components/toast/toast";
import { authFetch, removeSignedInAccount, readAuthSession, writeAuthSession, type AuthSession } from "../../utils/authSession";
import styles from "../page.module.css";

const profileItems = [
  {
    href: "/settings/account/display-name",
    label: "Name",
    getValue: (session: AuthSession | null) => session?.user.displayName || session?.user.username || "Add a display name",
  },
  {
    href: "/settings/account/email",
    label: "Email",
    getValue: (session: AuthSession | null) => session?.user.email || "Add an email address",
  },
  {
    href: "/settings/account/phone",
    label: "Phone",
    getValue: (session: AuthSession | null) => session?.user.phone || "Add a phone number",
  },
] as const;

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
  });

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

  const updatePasswordField = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleSignOut = () => {
    if (!session) {
      router.replace("/login");
      return;
    }

    const remainingAccounts = removeSignedInAccount(session.user.id || session.user.username);
    setSession(null);
    router.replace(remainingAccounts.length > 0 ? "/settings/account/switch" : "/login");
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !session) return;
    if (!file.type.startsWith("image/")) {
      toastError("Choose an image file");
      return;
    }

    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await authFetch("/api/auth/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to upload profile photo");

      const nextSession = {
        token: data.token,
        user: data.user,
        signedInAt: session.signedInAt || new Date().toISOString(),
      } satisfies AuthSession;

      writeAuthSession(nextSession);
      setSession(nextSession);
      toastSuccess("Profile photo updated");
    } catch (error: any) {
      toastError(error.message || "Failed to upload profile photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const closePasswordModal = () => {
    if (savingPassword) return;
    setPasswordModalOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "" });
  };

  const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user) return;

    setSavingPassword(true);

    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        throw new Error("Enter both your current password and a new password");
      }

      const response = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: session.user.displayName || session.user.username,
          email: session.user.email || "",
          phone: session.user.phone || "",
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
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
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordModalOpen(false);
      toastSuccess("Password updated");
    } catch (error: any) {
      toastError(error.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.accountPageHeader}>
        <BackButton fallbackHref="/settings" className={styles.backLink} label="Settings" />
        <h1>Account</h1>
      </div>

      <div className={styles.accountDetailGroup}>
        <input
          ref={avatarInputRef}
          className={styles.accountHiddenInput}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
        />

        <button
          type="button"
          className={`${styles.settingItemButton} ${styles.accountRowButton}`}
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarUploading}
          aria-label={avatarUploading ? "Uploading profile photo" : "Change profile photo"}
        >
          <span className={styles.accountRowLabel}>Profile Photo</span>
          <span className={styles.accountRowValueWrap}>
            {avatarUploading && <span className={styles.accountRowValue}>Uploading...</span>}
            <AccountAvatar account={session?.user} size={42} className={styles.accountRowAvatar} />
            <span className={`material-symbols-outlined ${styles.accountListChevron}`}>chevron_right</span>
          </span>
        </button>

        {profileItems.map((item) => (
          <Link key={item.href} href={item.href} className={`${styles.settingItemButton} ${styles.accountRowButton}`}>
            <span className={styles.accountRowLabel}>{item.label}</span>
            <span className={styles.accountRowValueWrap}>
              <span className={styles.accountRowValue}>{item.getValue(session)}</span>
              <span className={`material-symbols-outlined ${styles.accountListChevron}`}>chevron_right</span>
            </span>
          </Link>
        ))}
      </div>

      <div className={styles.accountDetailGroup}>
        <Link href="/settings/account/switch" className={`${styles.settingItemButton} ${styles.accountRowButton} ${styles.accountCompactRow}`}>
          <span className={styles.accountRowLabel}>Switch Account</span>
          <span className={styles.accountRowValueWrap}>
            <span className={styles.accountRowValue}>{session?.user.username || "Choose"}</span>
            <span className={`material-symbols-outlined ${styles.accountListChevron}`}>chevron_right</span>
          </span>
        </Link>

        <button
          type="button"
          className={`${styles.settingItemButton} ${styles.accountRowButton} ${styles.accountCompactRow}`}
          onClick={() => setPasswordModalOpen(true)}
        >
          <span className={styles.accountRowLabel}>Change Password</span>
          <span className={styles.accountRowValueWrap}>
            <span className={`material-symbols-outlined ${styles.accountListChevron}`}>chevron_right</span>
          </span>
        </button>
      </div>

      <div className={styles.accountDangerGroup}>
        <button
          type="button"
          className={styles.accountSignOutButton}
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      {passwordModalOpen && (
        <div className={styles.passwordModalOverlay} onClick={closePasswordModal} role="presentation">
          <div className={styles.passwordModalCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
            <div className={styles.passwordModalHeader}>
              <h2 id="password-modal-title">Change Password</h2>
              <button type="button" className={styles.passwordModalClose} onClick={closePasswordModal} aria-label="Close password dialog">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className={styles.profileEditor} onSubmit={handlePasswordSave}>
              <label>
                <span>Current password</span>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField("currentPassword", event.target.value)} autoComplete="current-password" />
              </label>
              <label>
                <span>New password</span>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField("newPassword", event.target.value)} autoComplete="new-password" />
              </label>
              <div className={styles.passwordModalActions}>
                <button type="button" className={styles.secondaryButton} onClick={closePasswordModal} disabled={savingPassword}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={savingPassword}>
                  {savingPassword ? "Saving" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}