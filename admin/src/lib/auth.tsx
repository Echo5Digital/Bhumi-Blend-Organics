import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";

// Who is logged in. The token (from the backend's admin login) is kept in
// localStorage so a refresh doesn't log you out; any request answered "401"
// (expired, or the admin was switched off) calls `logout()`.

export type Admin = { id: string; email: string; name: string };
type Session = { token: string; admin: Admin };

const KEY = "bhumiblend-admin:session";

function read(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    return typeof parsed.token === "string" && parsed.admin && typeof parsed.admin.name === "string" ? (parsed as Session) : null;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  token: string | null;
  admin: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(read);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // storage blocked: logging out still works for this visit
    }
    setSession(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<Session>("/admin/auth/login", { method: "POST", body: { email, password } });
    try {
      window.localStorage.setItem(KEY, JSON.stringify(result));
    } catch {
      // not remembered across a refresh, but this visit works
    }
    setSession(result);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token: session?.token ?? null, admin: session?.admin ?? null, login, logout }),
    [session, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
