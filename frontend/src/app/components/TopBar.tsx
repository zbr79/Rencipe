"use client";

import { useTheme } from "../contexts/ThemeContext";
import styles from "./top-bar.module.css";

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.topBar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1>🍳 Rencipe</h1>
        </div>
        
        <div className={styles.actions}>
          <button 
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={theme === "dark" ? "切换浅色" : "切换深色"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
