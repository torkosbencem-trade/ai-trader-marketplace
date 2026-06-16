export type UserRole = "investor" | "creator" | "admin";

export type DemoSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export const SESSION_STORAGE_KEY = "ai-trader-demo-session";

export const demoUsers: Record<UserRole, Omit<DemoSession, "createdAt">> = {
  investor: {
    id: "demo-investor-001",
    name: "Investor Demo",
    email: "investor@aitrader.local",
    role: "investor",
  },
  creator: {
    id: "demo-creator-001",
    name: "Creator Demo",
    email: "creator@aitrader.local",
    role: "creator",
  },
  admin: {
    id: "demo-admin-001",
    name: "Admin Demo",
    email: "admin@aitrader.local",
    role: "admin",
  },
};

export const roleLabels: Record<UserRole, string> = {
  investor: "Investor",
  creator: "Strategy Creator",
  admin: "Admin / Operator",
};

export const roleHome: Record<UserRole, string> = {
  investor: "/portfolio",
  creator: "/strategy-builder",
  admin: "/admin",
};

export const rolePermissions: Record<UserRole, string[]> = {
  investor: [
    "Browse marketplace strategies",
    "View strategy reports",
    "Submit allocation requests",
    "Monitor portfolio deployments",
  ],
  creator: [
    "Upload CSV/JSON strategy evidence",
    "Submit strategy packages",
    "Track admin review status",
    "Prepare marketplace publication",
  ],
  admin: [
    "Review strategy submissions",
    "Review allocation requests",
    "Prepare execution packages",
    "Monitor system storage and audit logs",
  ],
};

export function createDemoSession(role: UserRole): DemoSession {
  return {
    ...demoUsers[role],
    createdAt: new Date().toISOString(),
  };
}

export function getStoredSession(): DemoSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function saveSession(session: DemoSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  document.cookie = `ai_trader_role=${session.role}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `ai_trader_email=${encodeURIComponent(
    session.email
  )}; path=/; max-age=604800; SameSite=Lax`;
}

export function signInAsRole(role: UserRole) {
  const session = createDemoSession(role);
  saveSession(session);
  return session;
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);

  document.cookie = "ai_trader_role=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "ai_trader_email=; path=/; max-age=0; SameSite=Lax";
}

export function canAccessPath(role: UserRole, path: string) {
  if (role === "admin") {
    return true;
  }

  if (path.startsWith("/admin")) {
    return false;
  }

  if (path.startsWith("/allocation-requests")) {
    return false;
  }

  if (path.startsWith("/execution")) {
    return false;
  }

  if (path.startsWith("/system")) {
    return false;
  }

  if (path.startsWith("/strategy-builder")) {
    return role === "creator";
  }

  if (path.startsWith("/portfolio")) {
    return role === "investor";
  }

  if (path.startsWith("/allocation/")) {
    return role === "investor";
  }

  return true;
}