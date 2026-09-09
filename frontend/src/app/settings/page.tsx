"use client";

import Breadcrumbs from "../components/Breadcrumbs";
import { useSettings } from "../contexts/SettingsContext";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { openSettings } = useSettings();

  return (
    <main className={styles.container}>
      <div className={styles.accountPageHeader}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings" }]} mobileBackHref="/" />
        <h1>Settings</h1>
        <p>Manage your account, appearance, and app preferences.</p>
      </div>
      <section className={styles.group}>
        <div className={styles.settingTextStack}>
          <span className={styles.settingItemTitle}>Settings menu</span>
          <span className={styles.settingItemValue}>Open the compact settings controls used throughout Rencipe.</span>
        </div>
        <button type="button" className={styles.primaryButton} onClick={openSettings}>
          Open settings
        </button>
      </section>
    </main>
  );
}