"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "VETERINARIAN" | "RECEPTIONIST" | "ACCOUNTANT" | "SUPERADMIN";
  jobTitle: string;
  branch: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error("Authentication is unavailable"); },
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { user: null })
      .then((data) => { if (!cancelled) setUser(data.user || null); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setSessionChecked(true); });
    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(`خطأ في الاتصال بالخادم (${response.status}). يرجى إعادة المحاولة.`);
      }
      throw new Error("استجابة غير صالحة من الخادم. يرجى إعادة المحاولة.");
    }

    if (!response.ok || !result?.user) {
      throw new Error(result?.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }
    setUser(result.user);
    router.push("/");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    router.push("/login");
  };

  return <AuthContext.Provider value={{ user, login, logout, isAuthenticated: sessionChecked && !!user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
