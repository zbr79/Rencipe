"use client";

import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { clearAuthSession, readAuthSession, type AuthSession } from "../utils/authSession";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(readAuthSession());
  }, []);

  const handleSignOut = () => {
    clearAuthSession();
    router.replace("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings</h1>
      </div>

      {/* Recipe Management Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recipe Management</h2>

        <Link href="/drafts" style={{ textDecoration: "none" }}>
          <div className={styles.settingItem} style={{ cursor: "pointer" }}>
            <div className={styles.settingLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
              <span>My Drafts</span>
            </div>
            <span style={{ color: "#999", fontSize: "12px" }}>Manage drafts</span>
          </div>
        </Link>
      </section>

      {/* Display Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Display</h2>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>
            <span>Dark Mode</span>
          </div>
          <button
            className={`${styles.toggle} ${theme === "dark" ? styles.active : ""}`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? "On" : "Off"}
          </button>
        </div>
      </section>

      {/* Account Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
            <span>Username</span>
          </div>
          <div className={styles.settingValue}>
            <span>{session?.user.displayName || "Signed in"}</span>
          </div>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>verified_user</span>
            <span>Role</span>
          </div>
          <div className={styles.settingValue}>
            <span>{session?.user.role || "user"}</span>
          </div>
        </div>

        <button type="button" className={styles.settingButton} onClick={handleSignOut}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          <span>Sign Out</span>
        </button>
      </section>
    </div>
  );
}
