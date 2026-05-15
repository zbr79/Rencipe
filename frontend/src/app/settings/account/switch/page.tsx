"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "../../../components/BackButton";
import AccountAvatar from "../../../components/AccountAvatar";
import { toastSuccess } from "../../../components/toast/toast";
import {
  clearAllAuthSessions,
  readAuthSession,
  readSignedInAccounts,
  removeSignedInAccount,
  switchToSignedInAccount,
  type AuthSession,
} from "../../../utils/authSession";
import { getAccountDisplayName } from "../../../utils/accountAvatar";
import styles from "../../page.module.css";

const ADD_ACCOUNT_PATH = `/login?mode=add-account&next=${encodeURIComponent("/")}`;

function getSessionKey(session: AuthSession) {
  return session.user.id || session.user.username;
}

export default function SwitchAccountPage() {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<AuthSession | null>(null);
  const [accounts, setAccounts] = useState<AuthSession[]>([]);

  useEffect(() => {
    setActiveSession(readAuthSession());
    setAccounts(readSignedInAccounts());
  }, []);

  const activeKey = activeSession ? getSessionKey(activeSession) : "";

  const refreshAccounts = () => {
    setActiveSession(readAuthSession());
    setAccounts(readSignedInAccounts());
  };

  const handleSwitchAccount = (account: AuthSession) => {
    const nextSession = switchToSignedInAccount(getSessionKey(account));
    if (nextSession) {
      toastSuccess(`Switched to ${getAccountDisplayName(nextSession.user)}`);
      router.replace("/");
      return;
    }

    refreshAccounts();
  };

  const handleSignOutAccount = (account: AuthSession) => {
    const remainingAccounts = removeSignedInAccount(getSessionKey(account));
    setActiveSession(readAuthSession());
    setAccounts(remainingAccounts);
    toastSuccess(`${getAccountDisplayName(account.user)} signed out`);

    if (remainingAccounts.length === 0) {
      router.replace("/login");
    }
  };

  const handleSignOutAll = () => {
    clearAllAuthSessions();
    setActiveSession(null);
    setAccounts([]);
    toastSuccess("Signed out of all accounts");
    router.replace("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.accountPageHeader}>
        <BackButton fallbackHref="/settings/account" className={styles.backLink} label="Account" />
        <h1>Switch Account</h1>
      </div>

      <section className={styles.switchAccountBox} aria-label="Signed-in accounts">
        {accounts.length === 0 ? (
          <div className={styles.switchAccountEmpty}>No accounts</div>
        ) : (
          <div className={styles.switchAccountList}>
            {accounts.map((account) => {
              const accountKey = getSessionKey(account);
              const isCurrent = accountKey === activeKey;

              return (
                <div key={accountKey} className={`${styles.switchAccountRow} ${isCurrent ? styles.switchAccountRowCurrent : ""}`}>
                  <button
                    type="button"
                    className={styles.switchAccountChoice}
                    onClick={() => !isCurrent && handleSwitchAccount(account)}
                    disabled={isCurrent}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <AccountAvatar account={account.user} size={38} />
                    <span className={styles.accountSwitchText}>
                      <span>{getAccountDisplayName(account.user)}</span>
                      {isCurrent && <span className={styles.accountCurrentMarker}>(current)</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.redOutlineButton}
                    onClick={() => handleSignOutAccount(account)}
                  >
                    Sign out
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className={styles.switchAccountActions}>
        <button type="button" className={styles.primaryButton} onClick={() => router.push(ADD_ACCOUNT_PATH)}>
          Add account
        </button>
        <button type="button" className={styles.redOutlineButton} onClick={handleSignOutAll} disabled={accounts.length === 0}>
          Sign out all
        </button>
      </div>
    </div>
  );
}