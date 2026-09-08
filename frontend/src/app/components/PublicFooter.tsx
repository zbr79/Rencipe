"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./public-footer.module.css";

export default function PublicFooter() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>Rencipe</span>
        <nav className={styles.links} aria-label="Public information">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/legal">Legal</Link>
        </nav>
      </div>
    </footer>
  );
}
