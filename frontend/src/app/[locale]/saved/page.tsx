"use client";

import { useTranslations } from "next-intl";

export default function SavedPage() {
  const t = useTranslations("navigation");

  return <div style={{ padding: 16 }}>{t("saved")}</div>;
}
