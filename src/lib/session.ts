export type Session = {
  memberId: string;
  email: string;
};

const SESSION_KEY = "ai-kitchen-secretary:session:v1";

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.memberId) return null;
    return {
      memberId: parsed.memberId,
      email: parsed.email?.trim().toLowerCase() || "",
    };
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function createInviteToken(): string {
  return `ksec_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
