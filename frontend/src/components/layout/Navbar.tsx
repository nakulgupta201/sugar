"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { THEMES, useTheme } from "@/components/providers/ThemeProvider";
import { LANGUAGES, useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Activity, Menu, X, ChevronDown, User as UserIcon, LogOut } from "lucide-react";
import { clsx } from "clsx";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  
  const currentTheme = THEMES.find((t) => t.id === theme);
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  const NAV_LINKS = [
    { href: "/",        label: t("nav.home") },
    { href: "/predict", label: t("nav.predict") },
    { href: "/about",   label: t("nav.about") },
  ];

  if (user) {
    NAV_LINKS.push({ href: "/history", label: t("nav.history") });
  }

  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: "hsl(var(--card) / 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))" }}
          >
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">DiabetesAI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === link.href
                  ? "text-[hsl(var(--primary))] bg-[hsl(var(--accent))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* Lang Switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => { setLangOpen(!langOpen); setThemeOpen(false); setAuthOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all text-[hsl(var(--muted-foreground))]"
            >
              <span>{currentLang?.flag}</span>
              <span className="font-medium">{currentLang?.code.toUpperCase()}</span>
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden shadow-2xl z-50 bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors",
                        lang === l.code
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-medium"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span> {l.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => { setThemeOpen(!themeOpen); setLangOpen(false); setAuthOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              <span>{currentTheme?.icon}</span>
            </button>

            <AnimatePresence>
              {themeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-2xl z-50 bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                >
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setThemeOpen(false); }}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                        theme === t.id
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-medium"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                      )}
                    >
                      <span className="text-base">{t.icon}</span> {t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auth Switcher */}
          <div className="relative hidden sm:block">
            {user ? (
               <button
                 onClick={() => { setAuthOpen(!authOpen); setLangOpen(false); setThemeOpen(false); }}
                 className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[hsl(var(--muted))]"
               >
                 <UserIcon className="w-4 h-4" />
               </button>
            ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-[hsl(var(--muted))]"
                >
                  {t("nav.login")}
                </Link>
            )}

            <AnimatePresence>
              {authOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-2xl z-50 bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                >
                  <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-mono truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setAuthOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--muted))] transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> {t("nav.logout")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/predict"
            className="hidden lg:flex btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {t("nav.startAssessment")}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-[hsl(var(--muted-foreground))]"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]"
          >
            <div className="px-4 pb-4 pt-2 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "block px-4 py-2.5 rounded-lg text-sm font-medium",
                    pathname === link.href
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--accent))]"
                      : "text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {!user && (
                 <Link
                   href="/auth/login"
                   onClick={() => setMenuOpen(false)}
                   className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))]"
                 >
                   {t("nav.login")}
                 </Link>
              )}

              {user && (
                 <button
                   onClick={() => { logout(); setMenuOpen(false); }}
                   className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--destructive))]"
                 >
                   <LogOut className="w-4 h-4" /> {t("nav.logout")}
                 </button>
              )}

              <Link
                href="/predict"
                onClick={() => setMenuOpen(false)}
                className="block btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold text-center mt-2"
              >
                {t("nav.startAssessment")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
