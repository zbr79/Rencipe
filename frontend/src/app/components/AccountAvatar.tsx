import type { CSSProperties } from "react";
import Image from "next/image";
import { getAccountAvatarColor, getAccountDisplayName, getAccountInitial, type AccountIdentity } from "../utils/accountAvatar";
import styles from "./account-avatar.module.css";

interface AccountAvatarProps {
  account?: AccountIdentity | null;
  size?: number;
  className?: string;
}

export default function AccountAvatar({ account, size = 32, className = "" }: AccountAvatarProps) {
  const label = getAccountDisplayName(account);
  const isAdmin = account?.username?.trim().toLowerCase() === "admin" || account?.displayName?.trim().toLowerCase() === "admin";
  const avatarUrl = isAdmin ? "" : account?.avatarUrl?.trim() || "";
  const style = {
    "--avatar-size": `${size}px`,
    "--avatar-bg": getAccountAvatarColor(),
  } as CSSProperties;

  return (
    <span className={`${styles.avatar} ${className}`} style={style} aria-label={label} title={label}>
      {avatarUrl ? <Image className={styles.image} src={avatarUrl} alt="" width={size} height={size} unoptimized /> : getAccountInitial(account)}
    </span>
  );
}
