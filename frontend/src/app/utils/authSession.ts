export const AUTH_SESSION_KEY = "rencipe-auth-session";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: "admin" | "user";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  signedInAt: string;
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
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
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
