"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, login as apiLogin, register as apiRegister } from "@/lib/api";
import type { UserProfile } from "@/types/prediction";

interface AuthCtx {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null, loading: true,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback(async (tok: string) => {
    localStorage.setItem("diabetes_ai_token", tok);
    setToken(tok);
    try {
      const profile = await getMe();
      setUser(profile);
    } catch {
      localStorage.removeItem("diabetes_ai_token");
      setToken(null);
      setUser(null);
    }
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("diabetes_ai_token");
    if (stored) {
      applyToken(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [applyToken]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    await applyToken(res.access_token);
  };

  const register = async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    await applyToken(res.access_token);
  };

  const logout = () => {
    localStorage.removeItem("diabetes_ai_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
