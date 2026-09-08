import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./public-info-page.module.css";

type PublicInfoPageProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export default function PublicInfoPage({ title, eyebrow, children }: PublicInfoPageProps) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>
        <span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>
        Back to Rencipe
      </Link>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1>{title}</h1>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
