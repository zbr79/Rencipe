"use client";

import { useTheme } from "../contexts/ThemeContext";
import Link from "next/link";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>设置</h1>
      </div>

      {/* Recipe Management Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>食谱管理</h2>

        <Link href="/drafts" style={{ textDecoration: "none" }}>
          <div className={styles.settingItem} style={{ cursor: "pointer" }}>
            <div className={styles.settingLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
              <span>我的草稿</span>
            </div>
            <span style={{ color: "#999", fontSize: "12px" }}>管理草稿</span>
          </div>
        </Link>
      </section>

      {/* Display Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>显示</h2>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>
            <span>深色模式</span>
          </div>
          <button
            className={`${styles.toggle} ${theme === "dark" ? styles.active : ""}`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? "开启" : "关闭"}
          </button>
        </div>
      </section>

      {/* Account Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>个人信息</h2>

        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
            <span>用户名</span>
          </div>
          <div className={styles.settingValue}>
            <span>未登录</span>
          </div>
        </div>
      </section>
    </div>
  );
}
