"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { enqueuePrediction, pollPrediction } from "@/lib/api";
import type { PredictRequest, PredictResult } from "@/types/prediction";
import { useI18n } from "@/components/providers/I18nProvider";
import toast from "react-hot-toast";
import {
  User, Heart, Activity,
  Mail, ChevronRight, ChevronLeft, Loader2,
  AlertCircle, Info, Stethoscope
} from "lucide-react";

// ──── Form Schema ────────────────────────────────────────────────────────────
const schema = z
  .object({
    gender:              z.enum(["male", "female", "other"]),
    age:                 z.coerce.number().min(1).max(120),
    hypertension:        z.union([z.literal(0), z.literal(1)]),
    heart_disease:       z.union([z.literal(0), z.literal(1)]),
    smoking_history:     z.enum(["never", "former", "current", "ever", "not_current", "no_info"]),
    bmi:                 z.coerce.number().min(10).max(70),
    HbA1c_level:         z.coerce.number().min(3.5).max(15),
    blood_glucose_level: z.coerce.number().min(50).max(400),
    send_email:          z.boolean(),
    email:               z.string().optional(),
  })
  .refine(
    (d) => !d.send_email || (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)),
    { message: "Valid email required", path: ["email"] }
  );

type FormValues = z.infer<typeof schema>;

// ──── Component ───────────────────────────────────────────────────────────────
interface PredictFormProps {
  onResult: (r: PredictResult) => void;
}

export function PredictForm({ onResult }: PredictFormProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  const STEPS = [
    {
      id: "personal", title: t("predict.step1Title"), icon: User, desc: t("predict.step1Desc"), fields: ["gender", "age"],
    },
    {
      id: "conditions", title: t("predict.step2Title"), icon: Heart, desc: t("predict.step2Desc"), fields: ["hypertension", "heart_disease", "smoking_history"],
    },
    {
      id: "measurements", title: t("predict.step3Title"), icon: Activity, desc: t("predict.step3Desc"), fields: ["bmi", "HbA1c_level", "blood_glucose_level"],
    },
    {
      id: "report", title: t("predict.step4Title"), icon: Mail, desc: t("predict.step4Desc"), fields: ["send_email", "email"],
    },
  ];

  const {
    register, control, handleSubmit, watch, trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "male", age: 30, hypertension: 0, heart_disease: 0,
      smoking_history: "never", bmi: 22.5, HbA1c_level: 5.5,
      blood_glucose_level: 90, send_email: false, email: "",
    },
  });

  const sendEmail = watch("send_email");

  // ──── Polling Logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;

    let intervalId: NodeJS.Timeout;
    
    const poll = async () => {
      try {
        const res = await pollPrediction(jobId);
        setPollingStatus(res.status);
        
        if (res.status === "completed") {
          clearInterval(intervalId);
          setLoading(false);
          setJobId(null);
          toast.success("Prediction complete!");
          onResult(res);
        } else if (res.status === "failed") {
          clearInterval(intervalId);
          setLoading(false);
          setJobId(null);
          toast.error(res.error_message || t("errors.predictionFailed"));
        }
      } catch (err: any) {
        clearInterval(intervalId);
        setLoading(false);
        setJobId(null);
        toast.error(err.message || t("errors.networkError"));
      }
    };

    intervalId = setInterval(poll, 1500);
    // Initial check just in case it's fast
    poll();

    return () => clearInterval(intervalId);
  }, [jobId, onResult, t]);

  const nextStep = async () => {
    const fields = STEPS[step].fields as (keyof FormValues)[];
    const valid = await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setPollingStatus("pending");
    try {
      const body: PredictRequest = {
        ...data,
        email: data.send_email ? data.email : undefined,
      };
      // Enqueue job immediately returns 202
      const accepted = await enqueuePrediction(body);
      setJobId(accepted.job_id); // triggers useEffect polling
    } catch (err: any) {
      toast.error(err.message ?? t("errors.predictionFailed"));
      setLoading(false);
    }
  };

  const progress = (step / (STEPS.length - 1)) * 100;

  // ──── Helpers ─────────────────────────────────────────────────────────────
  function Tooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className="w-4 h-4 inline-flex opacity-50 hover:opacity-100 transition-opacity"
        >
          <Info className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
        </button>
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg text-xs z-50 shadow-xl"
              style={{ background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function Label({ children, tooltip, htmlFor }: { children: React.ReactNode; tooltip?: string; htmlFor?: string }) {
    return (
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>
        {children}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
    );
  }

  function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: "hsl(var(--destructive))" }}><AlertCircle className="w-3 h-3" /> {msg}</p>;
  }

  function ToggleGroup({ options, value, onChange, id }: any) {
    return (
      <div className="flex gap-2 flex-wrap" id={id}>
        {options.map((opt: any) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: value === opt.value ? "hsl(var(--primary))" : "hsl(var(--muted))",
              color: value === opt.value ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              border: `1px solid ${value === opt.value ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
              transform: value === opt.value ? "scale(1.02)" : "scale(1)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  // ──── Render Loading Slate ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass-card p-12 text-center" style={{ maxWidth: "640px", margin: "0 auto" }}>
         <motion.div
           animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
           style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.5))", boxShadow: "0 0 40px hsl(var(--primary)/0.3)" }}
         >
           <Stethoscope className="w-10 h-10 text-white" />
         </motion.div>
         <h2 className="text-2xl font-bold mb-2 gradient-text">{t("predict.queuedTitle")}</h2>
         <p className="text-[hsl(var(--muted-foreground))] mb-8">{t("predict.queuedSubtitle")}</p>
         
         <div className="flex flex-col items-center gap-2">
           <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))]" />
           <p className="text-sm font-mono tracking-wider font-semibold" style={{ color: "hsl(var(--primary))" }}>
              {t("predict.queuedStatus", { status: (pollingStatus || "Initiating").toUpperCase() })}
           </p>
         </div>
      </div>
    );
  }

  // ──── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="glass-card p-0 overflow-hidden" style={{ maxWidth: "640px", margin: "0 auto" }}>
      {/* ── Progress Header ── */}
      <div className="px-6 pt-6 pb-4" style={{ background: "hsl(var(--card))", borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("predict.stepOf", { step: step + 1, total: STEPS.length })}
            </h2>
            <h3 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
              {STEPS[step].title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{STEPS[step].desc}</p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />; })()}
          </div>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <motion.div
            animate={{ width: `${progress + 100 / (STEPS.length - 1)}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent-foreground, var(--primary))))" }}
          />
        </div>

        <div className="flex justify-between mt-3 px-[4.5%]">
           {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i <= step ? "hsl(var(--primary))" : "hsl(var(--border))", transform: i === step ? "scale(1.5)" : "scale(1)" }}
              />
              <span className="text-[0.65rem] hidden sm:block" style={{ color: i <= step ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                {s.title}
              </span>
            </div>
           ))}
        </div>
      </div>

      {/* ── Form Body ── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* STEP 0 */}
              {step === 0 && (
                <>
                  <div>
                    <Label htmlFor="gender">{t("predict.gender")}</Label>
                    <Controller
                      name="gender" control={control}
                      render={({ field }) => (
                        <ToggleGroup id="gender" options={[{ label: t("predict.male"), value: "male" }, { label: t("predict.female"), value: "female" }, { label: t("predict.other"), value: "other" }]} value={field.value} onChange={field.onChange} />
                      )}
                    />
                    <FieldError msg={errors.gender?.message} />
                  </div>
                  <div>
                    <Label htmlFor="age" tooltip={t("predict.ageTooltip")}>{t("predict.age")}</Label>
                    <input id="age" type="number" step="1" className="form-input" placeholder="e.g. 45" {...register("age", { valueAsNumber: true })} />
                    <FieldError msg={errors.age?.message} />
                  </div>
                </>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <div>
                    <Label tooltip={t("predict.hypertensionTooltip")}>{t("predict.hypertension")}</Label>
                    <Controller
                      name="hypertension" control={control}
                      render={({ field }) => <ToggleGroup id="hypertension" options={[{ label: t("predict.no"), value: 0 }, { label: t("predict.yes"), value: 1 }]} value={field.value} onChange={field.onChange} />}
                    />
                    <FieldError msg={errors.hypertension?.message} />
                  </div>
                  <div>
                    <Label tooltip={t("predict.heartDiseaseTooltip")}>{t("predict.heartDisease")}</Label>
                    <Controller
                      name="heart_disease" control={control}
                      render={({ field }) => <ToggleGroup id="heart_disease" options={[{ label: t("predict.no"), value: 0 }, { label: t("predict.yes"), value: 1 }]} value={field.value} onChange={field.onChange} />}
                    />
                    <FieldError msg={errors.heart_disease?.message} />
                  </div>
                  <div>
                    <Label htmlFor="smoking_history">{t("predict.smokingHistory")}</Label>
                    <select id="smoking_history" className="form-input" {...register("smoking_history")}>
                      <option value="never">{t("predict.smokingNever")}</option>
                      <option value="former">{t("predict.smokingFormer")}</option>
                      <option value="current">{t("predict.smokingCurrent")}</option>
                      <option value="ever">{t("predict.smokingEver")}</option>
                      <option value="not_current">{t("predict.smokingNotCurrent")}</option>
                      <option value="no_info">{t("predict.smokingNoInfo")}</option>
                    </select>
                    <FieldError msg={errors.smoking_history?.message} />
                  </div>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <div>
                    <Label htmlFor="bmi" tooltip={t("predict.bmiTooltip")}>{t("predict.bmi")}</Label>
                    <input id="bmi" type="number" step="0.1" className="form-input" {...register("bmi", { valueAsNumber: true })} />
                    <FieldError msg={errors.bmi?.message} />
                  </div>
                  <div>
                    <Label htmlFor="HbA1c_level" tooltip={t("predict.hba1cTooltip")}>{t("predict.hba1c")}</Label>
                    <input id="HbA1c_level" type="number" step="0.1" className="form-input" {...register("HbA1c_level", { valueAsNumber: true })} />
                    <FieldError msg={errors.HbA1c_level?.message} />
                  </div>
                  <div>
                    <Label htmlFor="blood_glucose_level" tooltip={t("predict.glucoseTooltip")}>{t("predict.glucose")}</Label>
                    <input id="blood_glucose_level" type="number" step="1" className="form-input" {...register("blood_glucose_level", { valueAsNumber: true })} />
                    <FieldError msg={errors.blood_glucose_level?.message} />
                  </div>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <div>
                    <Label>{t("predict.sendEmail")}</Label>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{t("predict.emailDesc")}</p>
                    <Controller
                      name="send_email" control={control}
                      render={({ field }) => <ToggleGroup id="send_email" options={[{ label: t("predict.sendEmailNo"), value: false }, { label: t("predict.sendEmailYes"), value: true }]} value={field.value} onChange={field.onChange} />}
                    />
                  </div>
                  <AnimatePresence>
                    {sendEmail && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <Label htmlFor="email">{t("predict.emailAddress")}</Label>
                        <input id="email" type="email" className="form-input" placeholder={t("predict.emailPlaceholder")} {...register("email")} />
                        <FieldError msg={errors.email?.message} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="mt-6 p-4 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
                     <p className="text-xs text-[hsl(var(--muted-foreground))]">
                       {t("predict.disclaimer")}
                     </p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer / Actions ── */}
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 font-medium text-sm rounded-lg transition-colors hover:bg-[hsl(var(--muted))] disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: "hsl(var(--foreground))" }}
          >
            <ChevronLeft className="w-4 h-4" /> {t("predict.back")}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary flex items-center gap-1 px-5 py-2 rounded-lg font-bold text-sm"
            >
              {t("predict.next")} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t("predict.analyzing")}</>
              ) : (
                <><Activity className="w-4 h-4" /> {t("predict.submit")}</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
