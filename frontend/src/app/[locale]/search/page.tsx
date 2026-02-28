"use client";

import { useTranslations } from "next-intl";

export default function SearchPage() {
  const t = useTranslations("navigation");

  return <div style={{ padding: 16 }}>{t("search")}</div>;
}
