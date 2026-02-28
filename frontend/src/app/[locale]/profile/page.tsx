"use client";

import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const t = useTranslations("navigation");

  return <div style={{ padding: 16 }}>{t("profile")}</div>;
}
