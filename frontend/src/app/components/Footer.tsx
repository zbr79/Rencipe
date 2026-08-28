import Link from "next/link";
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">R</span>
          <div>
            <p className={styles.brandName}>Rencipe</p>
            <p className={styles.tagline}>Collect, cook, and share recipes.</p>
          </div>
        </div>

        <nav className={styles.links} aria-label="Footer">
          <Link href="/browse">Browse</Link>
          <Link href="/saved">Saved</Link>
          <Link href="/meals">Meals</Link>
          <Link href="/settings">Settings</Link>
        </nav>

        <p className={styles.copy}>© {new Date().getFullYear()} Rencipe</p>
      </div>
    </footer>
  );
}
