import type { CSSProperties } from "react";
import { getAccountAvatarColor, getAccountDisplayName, getAccountInitial, type AccountIdentity } from "../utils/accountAvatar";
import styles from "./account-avatar.module.css";

interface AccountAvatarProps {
  account?: AccountIdentity | null;
  size?: number;
  className?: string;
}

export default function AccountAvatar({ account, size = 32, className = "" }: AccountAvatarProps) {
  const label = getAccountDisplayName(account);
  const avatarUrl = account?.avatarUrl?.trim() || "";
  const style = {
    "--avatar-size": `${size}px`,
    "--avatar-bg": getAccountAvatarColor(account),
  } as CSSProperties;

  return (
    <span className={`${styles.avatar} ${className}`} style={style} aria-label={label} title={label}>
      {avatarUrl ? <img className={styles.image} src={avatarUrl} alt="" /> : getAccountInitial(account)}
    </span>
  );
}