"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./page.module.css";

export default function SettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("settings");
  const { theme, toggleTheme } = useTheme();

  const handleLanguageChange = (newLocale: string) => {
    window.location.href = newLocale === "en" ? "/en/settings" : "/zh/settings";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("title")}</h1>
      </div>

      {/* Account Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("account.title")}</h2>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
            <span>{t("account.loggedInAs")}</span>
          </div>
          <div className={styles.settingValue}>
            <span>{t("account.guestUser")}</span>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("app.title")}</h2>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>language</span>
            <span>{t("app.language")}</span>
          </div>
          <select
            value={locale}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={styles.settingSelect}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>
            <span>{t("app.darkMode")}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <span className={styles.toggleSlider}></span>
          </label>
        </div>
      </section>
    </div>
  );
}
