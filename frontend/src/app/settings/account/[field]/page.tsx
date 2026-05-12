"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toastError, toastSuccess } from "../../../components/toast/toast";
import { authFetch, readAuthSession, writeAuthSession, type AuthSession, type AuthUser } from "../../../utils/authSession";
import styles from "../../page.module.css";

type EditableField = "display-name" | "email" | "phone";
type EditableKey = "displayName" | "email" | "phone";

const fieldConfig = {
  "display-name": {
    label: "Display name",
    inputType: "text",
    autoComplete: "name",
    valueKey: "displayName",
    successMessage: "Name updated",
  },
  email: {
    label: "Email",
    inputType: "email",
    autoComplete: "email",
    valueKey: "email",
    successMessage: "Email updated",
  },
  phone: {
    label: "Phone",
    inputType: "tel",
    autoComplete: "tel",
    valueKey: "phone",
    successMessage: "Phone updated",
  },
} as const satisfies Record<EditableField, {
  label: string;
  inputType: string;
  autoComplete: string;
  valueKey: EditableKey;
  successMessage: string;
}>;

function resolveFieldValue(user: AuthUser | null | undefined, key: EditableKey) {
  if (!user) return "";
  if (key === "displayName") return user.displayName || user.username || "";
  if (key === "email") return user.email || "";
  return user.phone || "";
}

export default function EditAccountFieldPage() {
  const params = useParams<{ field?: string | string[] }>();
  const router = useRouter();
  const rawField = Array.isArray(params.field) ? params.field[0] : params.field;
  const config = rawField ? fieldConfig[rawField as EditableField] : undefined;

  const [session, setSession] = useState<AuthSession | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rawField && !config) {
      router.replace("/settings/account");
    }
  }, [config, rawField, router]);

  useEffect(() => {
    if (!config) return;

    const nextSession = readAuthSession();
    setSession(nextSession);
    setFieldValue(resolveFieldValue(nextSession?.user, config.valueKey));

    if (!nextSession) return;

    let ignore = false;
    authFetch("/api/auth/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.user || ignore) return;

        const refreshedSession = { ...nextSession, user: data.user } satisfies AuthSession;
        writeAuthSession(refreshedSession);
        setSession(refreshedSession);
        setFieldValue(resolveFieldValue(data.user, config.valueKey));
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [config]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!config || !session?.user) return;

    const trimmedValue = fieldValue.trim();
    if (config.valueKey === "displayName" && !trimmedValue) {
      toastError("Display name is required");
      return;
    }

    setSaving(true);

    try {
      const response = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: config.valueKey === "displayName" ? trimmedValue : resolveFieldValue(session.user, "displayName"),
          email: config.valueKey === "email" ? trimmedValue : resolveFieldValue(session.user, "email"),
          phone: config.valueKey === "phone" ? trimmedValue : resolveFieldValue(session.user, "phone"),
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update profile");

      const nextSession = {
        token: data.token,
        user: data.user,
        signedInAt: session.signedInAt || new Date().toISOString(),
      } satisfies AuthSession;

      writeAuthSession(nextSession);
      setSession(nextSession);
      setFieldValue(resolveFieldValue(data.user, config.valueKey));
      toastSuccess(config.successMessage);
      router.replace("/settings/account");
    } catch (error: any) {
      toastError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <Link href="/settings/account" className={styles.backLink}>
          <span className="material-symbols-outlined">arrow_back</span>
          Account
        </Link>

        <form className={`${styles.profileEditor} ${styles.profileEditorCompact}`} onSubmit={handleSave}>
          <label>
            <span>{config.label}</span>
            <input
              type={config.inputType}
              autoComplete={config.autoComplete}
              value={fieldValue}
              onChange={(event) => setFieldValue(event.target.value)}
            />
          </label>
          <div className={styles.profileActions}>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? "Saving" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}