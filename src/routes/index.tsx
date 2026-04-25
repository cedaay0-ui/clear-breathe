import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cigarette, AlertTriangle, Sparkles, Minus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  dailyLimitFor,
  dateKey,
  loadLogs,
  loadPlan,
  loadTimes,
  loadUnlocked,
  saveLogs,
  saveTimes,
  saveUnlocked,
  type SmokingLogs,
  type SmokingTimes,
  type UserPlan,
} from "@/lib/storage";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmokeFree — Today" },
      { name: "description", content: "Track today's cigarettes and stay within your reducing daily limit." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [logs, setLogs] = useState<SmokingLogs>({});
  const [tick, setTick] = useState(0); // re-render trigger

  useEffect(() => {
    const p = loadPlan();
    if (!p) {
      navigate({ to: "/onboarding" });
      return;
    }
    setPlan(p);
    const l = loadLogs();
    setLogs(l);
    // Passive re-evaluation for time-based / streak / money achievements
    const before = loadUnlocked();
    const earned = evaluateAchievements(p, l, loadTimes());
    const now = new Date().toISOString();
    const updated = { ...before };
    const newly: string[] = [];
    earned.forEach((id) => {
      if (!updated[id]) {
        updated[id] = now;
        newly.push(id);
      }
    });
    if (newly.length > 0) {
      saveUnlocked(updated);
      newly.forEach((id) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) {
          toast.success(`${a.emoji} ${t(`achievements.${a.id}.title`)}`, {
            description: t(`achievements.${a.id}.desc`),
          });
        }
      });
    }
  }, [navigate, tick, t]);

  const today = useMemo(() => dateKey(), []);
  const limit = plan ? dailyLimitFor(plan) : 0;
  const smoked = logs[today] ?? 0;
  const remaining = Math.max(0, limit - smoked);
  const pct = limit === 0 ? (smoked > 0 ? 100 : 0) : Math.min(100, (smoked / limit) * 100);
  const overLimit = smoked > limit;
  const nearLimit = !overLimit && limit > 0 && smoked >= Math.ceil(limit * 0.8);

  const checkAchievements = (nextLogs: SmokingLogs, nextTimes: SmokingTimes) => {
    if (!plan) return;
    const before = loadUnlocked();
    const earned = evaluateAchievements(plan, nextLogs, nextTimes);
    const now = new Date().toISOString();
    const updated = { ...before };
    const newlyUnlocked: string[] = [];
    earned.forEach((id) => {
      if (!updated[id]) {
        updated[id] = now;
        newlyUnlocked.push(id);
      }
    });
    if (newlyUnlocked.length > 0) {
      saveUnlocked(updated);
      newlyUnlocked.forEach((id) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) {
          toast.success(`${a.emoji} ${t(`achievements.${a.id}.title`)}`, {
            description: t(`achievements.${a.id}.desc`),
          });
        }
      });
    }
  };

  const tap = () => {
    if (!plan) return;
    const next = { ...logs, [today]: (logs[today] ?? 0) + 1 };
    setLogs(next);
    saveLogs(next);

    const times = loadTimes();
    const nextTimes: SmokingTimes = {
      ...times,
      [today]: [...(times[today] ?? []), new Date().toISOString()],
    };
    saveTimes(nextTimes);

    const newSmoked = next[today];
    if (limit === 0) {
      toast.warning("You've reached your quit day — try to skip this one.", {
        description: "Drink water, take 10 deep breaths.",
      });
    } else if (newSmoked === limit) {
      toast("You've hit today's limit", {
        description: "Try to make this your last for today.",
      });
    } else if (newSmoked > limit) {
      toast.error("Over your daily limit", {
        description: `You're ${newSmoked - limit} over. Tomorrow is a fresh start.`,
      });
    }

    checkAchievements(next, nextTimes);
  };

  const undo = () => {
    if (!plan || smoked === 0) return;
    const next = { ...logs, [today]: smoked - 1 };
    setLogs(next);
    saveLogs(next);

    const times = loadTimes();
    const todayTimes = [...(times[today] ?? [])];
    todayTimes.pop();
    const nextTimes: SmokingTimes = { ...times, [today]: todayTimes };
    saveTimes(nextTimes);
  };

  if (!plan) return null;

  return (
    <div className="flex min-h-screen flex-col px-6 pt-12">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Today's limit</p>
        <div className="mt-1 flex items-baseline gap-2">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">
            {smoked}
            <span className="text-muted-foreground/60"> / {limit}</span>
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className={`h-full rounded-full ${
            overLimit
              ? "bg-destructive"
              : nearLimit
                ? "bg-warning"
                : "bg-gradient-primary"
          }`}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{remaining} left today</span>
        <span>{Math.round(pct)}%</span>
      </div>

      {/* Warning */}
      {(nearLimit || overLimit) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${
            overLimit
              ? "border-destructive/40 bg-destructive/10 text-destructive-foreground"
              : "border-warning/40 bg-warning/10"
          }`}
        >
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${overLimit ? "text-destructive" : "text-warning"}`} />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {overLimit ? "Over your daily limit" : "Close to your limit"}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {overLimit
                ? "It happens. Aim to stay within tomorrow's target."
                : `Only ${remaining} cigarette${remaining === 1 ? "" : "s"} left for today.`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tap button */}
      <div className="my-12 flex flex-1 flex-col items-center justify-center">
        <p className="mb-6 text-sm text-muted-foreground">Tap when you smoke one</p>
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-full ${overLimit ? "" : "animate-pulse-ring"}`}
            aria-hidden
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.03 }}
            onClick={tap}
            aria-label="Log a cigarette"
            className={`relative z-10 flex h-44 w-44 items-center justify-center rounded-full shadow-glow transition-colors ${
              overLimit
                ? "bg-destructive/90"
                : "bg-gradient-primary"
            }`}
          >
            <Cigarette className="h-16 w-16 text-primary-foreground" strokeWidth={1.5} />
          </motion.button>
        </div>

        {smoked > 0 && (
          <Button
            onClick={undo}
            variant="ghost"
            size="sm"
            className="mt-8 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Minus className="h-4 w-4" />
            Undo last
          </Button>
        )}
      </div>

      {/* Encouragement */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-card/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">You're on day {Math.max(1, daysSinceStart(plan))}</p>
          <p className="text-muted-foreground">Every skipped cigarette is a small win.</p>
        </div>
      </div>
    </div>
  );
}

function daysSinceStart(plan: UserPlan): number {
  const start = new Date(plan.startDate);
  const today = new Date();
  const ms = 1000 * 60 * 60 * 24;
  return (
    Math.floor(
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
        new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) /
        ms,
    ) + 1
  );
}
