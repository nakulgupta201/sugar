"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "light",         label: "Light",         icon: "☀️" },
  { id: "dark",          label: "Dark",           icon: "🌙" },
  { id: "high-contrast", label: "High Contrast",  icon: "⬛" },
  { id: "neon",          label: "Neon",           icon: "⚡" },
  { id: "medical",       label: "Medical Blue",   icon: "🏥" },
  { id: "pastel",        label: "Soft Pastel",    icon: "🌸" },
  { id: "cyberpunk",     label: "Cyberpunk",      icon: "🤖" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("diabetes-ai-theme") as ThemeId | null;
    if (stored && THEMES.find((t) => t.id === stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("diabetes-ai-theme", t);
    document.body.classList.add("theme-transition");
    setTimeout(() => document.body.classList.remove("theme-transition"), 500);
  };

  // Apply data-theme to <html>
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
