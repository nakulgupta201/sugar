"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function AuthPage() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(data.email, data.password);
        toast.success("Successfully logged in");
      } else {
        await register(data.email, data.password);
        toast.success("Account created successfully");
      }
      setTimeout(() => router.push("/history"), 500);
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 px-4 pb-20 flex items-center justify-center relative overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* Background Orbs */}
      <div className="blob blob-1 w-96 h-96 top-20 right-20 opacity-30 mix-blend-screen filter blur-[100px]" />
      <div className="blob blob-2 w-80 h-80 bottom-20 left-20 opacity-20 mix-blend-multiply filter blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="glass-card w-full max-w-md p-8 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-foreground, var(--primary))))" }}>
            {isLogin ? <LogIn className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>
            {isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}
          </h1>
          <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("auth.email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: "hsl(var(--primary))" }} />
              <input
                type="email"
                placeholder="you@example.com"
                className="form-input pl-10 h-12 text-sm"
                {...formRegister("email")}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1 mt-1 text-xs text-[hsl(var(--destructive))]">
                <AlertCircle className="w-3 h-3" /> {String(errors.email.message)}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("auth.password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: "hsl(var(--primary))" }} />
              <input
                type="password"
                placeholder="••••••••"
                className="form-input pl-10 h-12 text-sm"
                {...formRegister("password")}
              />
            </div>
            {errors.password && (
              <p className="flex items-center gap-1 mt-1 text-xs text-[hsl(var(--destructive))]">
                <AlertCircle className="w-3 h-3" /> {String(errors.password.message)}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-12 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {isLogin ? t("auth.loggingIn") : t("auth.registering")}…</>
            ) : (
              <>{isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />} {isLogin ? t("auth.loginBtn") : t("auth.registerBtn")}</>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold transition-colors focus:outline-none focus:underline"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {isLogin ? t("auth.switchToRegister") : t("auth.switchToLogin")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
