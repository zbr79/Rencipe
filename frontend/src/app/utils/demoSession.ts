export const DEMO_SESSION_KEY = "rencipe-demo-session";

export interface DemoSession {
  displayName: string;
  email: string;
  remember: boolean;
  signedInAt: string;
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as Partial<DemoSession>;
    if (!session.displayName || !session.email || !session.signedInAt) {
      return null;
    }
    return {
      displayName: session.displayName,
      email: session.email,
      remember: Boolean(session.remember),
      signedInAt: session.signedInAt,
    };
  } catch {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
}

export function writeDemoSession(session: DemoSession) {
  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}