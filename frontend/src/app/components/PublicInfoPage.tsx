import type { ReactNode } from "react";
import Breadcrumbs from "./Breadcrumbs";
import styles from "./public-info-page.module.css";

type PublicInfoPageProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export default function PublicInfoPage({ title, children }: PublicInfoPageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.pageTop}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      </div>
      <h1>{title}</h1>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
