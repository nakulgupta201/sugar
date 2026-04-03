"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { getHistory } from "@/lib/api";
import type { HistoryItem } from "@/types/prediction";
import { RISK_CONFIG } from "@/types/prediction";
import { Activity, Clock, LogIn, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await getHistory(50);
        setHistory(data);
      } catch (err: any) {
        toast.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, authLoading]);

  // Loading skeleton
  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 px-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 bg-[hsl(var(--muted))] w-64 rounded-md skeleton" />
          <div className="h-4 bg-[hsl(var(--muted))] w-48 rounded-md skeleton mb-8" />
          
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 bg-[hsl(var(--card))] rounded-xl skeleton shadow-xl" style={{ border: "1px solid hsl(var(--border))" }} />
          ))}
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center px-4">
        <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "hsl(var(--foreground))" }}>
          {t("history.title")}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mb-8 flex items-center gap-2">
           {t("history.loginPrompt")}
        </p>
        <Link href="/auth/login" className="btn-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2">
          <LogIn className="w-5 h-5" /> {t("nav.login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* Bio blobs */}
      <div className="blob blob-1 w-[500px] h-[500px] top-0 left-0 opacity-40 mix-blend-multiply filter blur-[100px]" />
      <div className="blob blob-2 w-[400px] h-[400px] bottom-0 right-0 opacity-30 mix-blend-multiply filter blur-[100px]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-10 px-2 sm:px-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 gradient-text border-b pb-4 inline-block" style={{ borderColor: 'transparent' }}>
            {t("history.title")}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">{t("history.subtitle")}</p>
        </div>

        {history.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl flex flex-col items-center justify-center">
            <Activity className="w-12 h-12 mb-4 opacity-50 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-xl font-bold mb-2 text-[hsl(var(--foreground))]">No History</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">{t("history.empty")}</p>
            <Link href="/predict" className="btn-primary px-6 py-3 rounded-xl font-bold">
              {t("nav.startAssessment")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((item, index) => {
                const date = item.created_at ? new Date(item.created_at + "Z") : new Date();
                const risk = item.risk_level ? RISK_CONFIG[item.risk_level as keyof typeof RISK_CONFIG] : RISK_CONFIG.High;
                const isPending = item.status === "pending" || item.status === "processing";

                return (
                  <motion.div
                    key={item.job_id}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group glass-card overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      borderLeft: `4px solid ${isPending ? "hsl(var(--muted-foreground))" : risk.color}`,
                    }}
                  >
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      
                      {/* Left: Date + ID */}
                      <div className="w-full sm:w-48 flex-shrink-0">
                        <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                          {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {item.job_id.split('-')[0]}
                        </p>
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 w-full flex items-center gap-6 justify-between sm:justify-start">
                        {isPending ? (
                           <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50 px-3 py-1.5 rounded-full">
                             <Loader2 className="w-3.5 h-3.5 animate-spin" />
                             Processing
                           </div>
                        ) : (
                          <>
                            <div>
                               <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-0.5">{t("history.risk")}</p>
                               <div className="flex items-center gap-1.5 font-bold" style={{ color: risk.color }}>
                                 {risk.emoji} {risk.label || `${item.risk_level} Risk`}
                               </div>
                            </div>
                            
                            <div className="hidden sm:block">
                               <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold mb-0.5">{t("history.probability")}</p>
                               <div className="font-bold text-lg text-[hsl(var(--foreground))] leading-none">
                                 {item.probability?.toFixed(1) ?? "--"}%
                               </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right: Action */}
                      <div className="flex-shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                        <button
                          disabled={isPending}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--primary))] transition-colors disabled:opacity-50"
                        >
                          {t("history.viewDetails")} <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
