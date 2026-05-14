export const AUTH_SESSION_KEY = "rencipe-auth-session";
export const AUTH_ACCOUNTS_KEY = "rencipe-auth-accounts";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  role: "admin" | "user";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  signedInAt: string;
}

function isAuthSession(value: Partial<AuthSession> | null | undefined): value is AuthSession {
  return Boolean(value?.token && value.user?.id && value.user?.username && value.signedInAt);
}

function getAccountKey(session: AuthSession) {
  return session.user.id || session.user.username;
}

function matchesAccount(session: AuthSession, accountKey: string) {
  return session.user.id === accountKey || session.user.username === accountKey;
}

function readStoredAccountSessions(): AuthSession[] {
  if (typeof window === "undefined") return [];

  const rawAccounts = window.localStorage.getItem(AUTH_ACCOUNTS_KEY);
  if (!rawAccounts) return [];

  try {
    const accounts = JSON.parse(rawAccounts);
    if (!Array.isArray(accounts)) return [];
    return accounts.filter(isAuthSession);
  } catch {
    window.localStorage.removeItem(AUTH_ACCOUNTS_KEY);
    return [];
  }
}

function writeSignedInAccounts(accounts: AuthSession[]) {
  if (typeof window === "undefined") return;

  const seen = new Set<string>();
  const normalizedAccounts = accounts.filter(isAuthSession).filter((account) => {
    const accountKey = getAccountKey(account);
    if (!accountKey || seen.has(accountKey)) return false;
    seen.add(accountKey);
    return true;
  });

  if (normalizedAccounts.length === 0) {
    window.localStorage.removeItem(AUTH_ACCOUNTS_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(normalizedAccounts));
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as Partial<AuthSession>;
    if (!session.token || !session.user?.id || !session.user?.username) {
      return null;
    }
    return session as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function writeAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  writeSignedInAccounts([session, ...readStoredAccountSessions()]);
}

export function clearAuthSession() {
  const currentSession = readAuthSession();
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  if (currentSession) {
    writeSignedInAccounts(readStoredAccountSessions().filter((account) => !matchesAccount(account, getAccountKey(currentSession))));
  }
}

export function readSignedInAccounts() {
  const currentSession = readAuthSession();
  const storedAccounts = readStoredAccountSessions();
  if (!currentSession) return storedAccounts;

  return [currentSession, ...storedAccounts.filter((account) => !matchesAccount(account, getAccountKey(currentSession)))];
}

export function switchToSignedInAccount(accountKey: string) {
  const account = readSignedInAccounts().find((session) => matchesAccount(session, accountKey));
  if (!account) return null;

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(account));
  writeSignedInAccounts([account, ...readStoredAccountSessions()]);
  return account;
}

export function removeSignedInAccount(accountKey: string) {
  const currentSession = readAuthSession();
  const remainingAccounts = readSignedInAccounts().filter((session) => !matchesAccount(session, accountKey));
  writeSignedInAccounts(remainingAccounts);

  if (currentSession && matchesAccount(currentSession, accountKey)) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }

  return remainingAccounts;
}

export function clearAllAuthSessions() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.localStorage.removeItem(AUTH_ACCOUNTS_KEY);
}

export function getAuthToken() {
  return readAuthSession()?.token || null;
}

export function getCurrentUser() {
  return readAuthSession()?.user || null;
}

export function getCurrentUserId() {
  return getCurrentUser()?.id || "";
}

export function authHeaders(existingHeaders?: HeadersInit) {
  const headers = new Headers(existingHeaders);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: authHeaders(init.headers),
  });
}
