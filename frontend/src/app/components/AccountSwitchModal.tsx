"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountAvatar from "./AccountAvatar";
import { toastSuccess } from "./toast/toast";
import { getAccountDisplayName } from "../utils/accountAvatar";
import {
  readAuthSession,
  readSignedInAccounts,
  switchToSignedInAccount,
  type AuthSession,
} from "../utils/authSession";
import styles from "./account-switch-modal.module.css";

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADD_ACCOUNT_PATH = `/login?mode=add-account&next=${encodeURIComponent("/")}`;

function getSessionKey(session: AuthSession) {
  return session.user.id || session.user.username;
}

export default function AccountSwitchModal({ isOpen, onClose }: AccountSwitchModalProps) {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<AuthSession | null>(null);
  const [accounts, setAccounts] = useState<AuthSession[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveSession(readAuthSession());
    setAccounts(readSignedInAccounts());
  }, [isOpen]);

  if (!isOpen) return null;

  const activeKey = activeSession ? getSessionKey(activeSession) : "";

  const handleSwitchAccount = (account: AuthSession) => {
    const accountKey = getSessionKey(account);
    if (accountKey === activeKey) {
      onClose();
      return;
    }

    const nextSession = switchToSignedInAccount(accountKey);
    if (!nextSession) {
      setActiveSession(readAuthSession());
      setAccounts(readSignedInAccounts());
      return;
    }

    toastSuccess(`Switched to ${getAccountDisplayName(nextSession.user)}`);
    onClose();
    router.replace("/");
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="account-switch-title">
        <header className={styles.header}>
          <h2 id="account-switch-title">Switch Account</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close account switcher">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className={styles.accountList}>
          {accounts.length === 0 ? (
            <div className={styles.empty}>No accounts</div>
          ) : (
            accounts.map((account) => {
              const accountKey = getSessionKey(account);
              const isCurrent = accountKey === activeKey;

              return (
                <button
                  key={accountKey}
                  type="button"
                  className={`${styles.accountButton} ${isCurrent ? styles.accountButtonCurrent : ""}`}
                  onClick={() => handleSwitchAccount(account)}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  <AccountAvatar account={account.user} size={38} />
                  <span className={styles.accountText}>
                    <span>{getAccountDisplayName(account.user)}</span>
                    {isCurrent && <span className={styles.currentLabel}>Current</span>}
                  </span>
                  {isCurrent && <span className={`material-symbols-outlined ${styles.currentIcon}`}>check</span>}
                </button>
              );
            })
          )}
        </div>

        <button type="button" className={styles.addButton} onClick={() => router.push(ADD_ACCOUNT_PATH)}>
          Add account
        </button>
      </section>
    </div>
  );
}