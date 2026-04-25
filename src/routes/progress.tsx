import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Cigarette, Euro, Flame, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  cigsAvoided,
  currentStreak,
  daysBetween,
  loadLogs,
  loadPlan,
  loadTimes,
  loadUnlocked,
  moneySaved,
  type SmokingLogs,
  type SmokingTimes,
  type UserPlan,
} from "@/lib/storage";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your progress — SmokeFree" },
      { name: "description", content: "See cigarettes avoided, money saved, streaks, and achievements." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [logs, setLogs] = useState<SmokingLogs>({});
  const [times, setTimes] = useState<SmokingTimes>({});
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = loadPlan();
    if (!p) {
      navigate({ to: "/onboarding" });
      return;
    }
    setPlan(p);
    setLogs(loadLogs());
    setTimes(loadTimes());
    setUnlocked(loadUnlocked());
  }, [navigate]);

  const earnedIds = useMemo(() => {
    if (!plan) return new Set<string>();
    const live = evaluateAchievements(plan, logs, times);
    Object.keys(unlocked).forEach((id) => live.add(id));
    return live;
  }, [plan, logs, times, unlocked]);

  if (!plan) return null;

  const daysSince = Math.max(0, daysBetween(new Date(plan.startDate), new Date()));
  const avoided = cigsAvoided(plan, logs);
  const money = moneySaved(plan, logs);
  const streak = currentStreak(plan, logs);

  const stats = [
    { icon: Calendar, label: t("progress.statDaysIn"), value: String(daysSince + 1) },
    { icon: Flame, label: t("progress.statStreak"), value: String(streak) },
    { icon: Cigarette, label: t("progress.statAvoided"), value: String(avoided) },
    { icon: Euro, label: t("progress.statSaved"), value: `€${money.toFixed(2)}` },
  ];

  return (
    <div className="px-6 pt-12">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("progress.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("progress.subtitle")}</p>

      {/* Stat grid */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-gradient-card p-4 shadow-soft"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quit date countdown */}
      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs uppercase tracking-wide text-primary">{t("progress.quitDate")}</p>
        <p className="mt-1 text-lg font-medium text-foreground">
          {new Date(plan.quitDate).toLocaleDateString(i18n.language, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("progress.daysToGo", { count: Math.max(0, daysBetween(new Date(), new Date(plan.quitDate))) })}
        </p>
      </div>

      {/* Achievements */}
      <div className="mt-10 mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("progress.achievements")}</h2>
        <span className="text-xs text-muted-foreground">
          {earnedIds.size} / {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a, i) => {
          const got = earnedIds.has(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`flex flex-col gap-2 rounded-2xl border p-3 transition-all ${
                got
                  ? "border-primary/30 bg-gradient-card shadow-soft"
                  : "border-border bg-card/40 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-2xl ${got ? "" : "grayscale"}`}>{a.emoji}</span>
                {got ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <p className={`text-sm font-medium leading-tight ${got ? "text-foreground" : "text-muted-foreground"}`}>
                {a.title}
              </p>
              <p className="text-[11px] leading-snug text-muted-foreground">{a.description}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="pb-6" />

    </div>
  );
}
