// localStorage-backed state for SmokeFree

export type UserPlan = {
  startDate: string; // ISO date (yyyy-mm-dd)
  quitDate: string; // ISO date
  initialDailyCount: number;
  packPrice: number; // EUR per pack
  cigsPerPack: number;
};

export type SmokingLogs = Record<string, number>; // dateKey -> count smoked
export type SmokingTimes = Record<string, string[]>; // dateKey -> ISO timestamps of each smoke
export type UnlockedAchievements = Record<string, string>; // achievementId -> ISO unlock date

const PLAN_KEY = "smokefree:plan";
const LOG_KEY = "smokefree:logs";
const TIMES_KEY = "smokefree:times";
const ACH_KEY = "smokefree:achievements";

export function loadPlan(): UserPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as UserPlan) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: UserPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function clearAll() {
  localStorage.removeItem(PLAN_KEY);
  localStorage.removeItem(LOG_KEY);
  localStorage.removeItem(TIMES_KEY);
  localStorage.removeItem(ACH_KEY);
}

export function loadLogs(): SmokingLogs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as SmokingLogs) : {};
  } catch {
    return {};
  }
}

export function saveLogs(logs: SmokingLogs) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

export function loadTimes(): SmokingTimes {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TIMES_KEY);
    return raw ? (JSON.parse(raw) as SmokingTimes) : {};
  } catch {
    return {};
  }
}

export function saveTimes(times: SmokingTimes) {
  localStorage.setItem(TIMES_KEY, JSON.stringify(times));
}

export function loadUnlocked(): UnlockedAchievements {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACH_KEY);
    return raw ? (JSON.parse(raw) as UnlockedAchievements) : {};
  } catch {
    return {};
  }
}

export function saveUnlocked(u: UnlockedAchievements) {
  localStorage.setItem(ACH_KEY, JSON.stringify(u));
}

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = 1000 * 60 * 60 * 24;
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((b0 - a0) / ms);
}

/** Return the daily allowed cigarette count for a given date based on a linear week-by-week reduction plan. */
export function dailyLimitFor(plan: UserPlan, d: Date = new Date()): number {
  const start = new Date(plan.startDate);
  const quit = new Date(plan.quitDate);
  const totalDays = Math.max(1, daysBetween(start, quit));
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  const elapsedDays = Math.max(0, daysBetween(start, d));
  if (elapsedDays >= totalDays) return 0;

  const currentWeek = Math.floor(elapsedDays / 7); // 0-indexed
  const ratio = 1 - currentWeek / totalWeeks;
  const limit = Math.max(0, Math.round(plan.initialDailyCount * ratio));
  return limit;
}

export function weeklyPlan(plan: UserPlan): { week: number; dailyLimit: number }[] {
  const start = new Date(plan.startDate);
  const quit = new Date(plan.quitDate);
  const totalDays = Math.max(1, daysBetween(start, quit));
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  const out: { week: number; dailyLimit: number }[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const ratio = 1 - w / totalWeeks;
    out.push({ week: w + 1, dailyLimit: Math.max(0, Math.round(plan.initialDailyCount * ratio)) });
  }
  out.push({ week: totalWeeks + 1, dailyLimit: 0 });
  return out;
}

export function totalSmokedSinceStart(plan: UserPlan, logs: SmokingLogs): number {
  const start = new Date(plan.startDate);
  const today = new Date();
  let total = 0;
  for (let i = 0; i <= daysBetween(start, today); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    total += logs[dateKey(d)] ?? 0;
  }
  return total;
}

export function cigsAvoided(plan: UserPlan, logs: SmokingLogs): number {
  const start = new Date(plan.startDate);
  const today = new Date();
  const days = daysBetween(start, today) + 1;
  const wouldHaveSmoked = days * plan.initialDailyCount;
  const actuallySmoked = totalSmokedSinceStart(plan, logs);
  return Math.max(0, wouldHaveSmoked - actuallySmoked);
}

export function moneySaved(plan: UserPlan, logs: SmokingLogs): number {
  const pricePerCig = plan.packPrice / Math.max(1, plan.cigsPerPack);
  return cigsAvoided(plan, logs) * pricePerCig;
}

export function currentStreak(plan: UserPlan, logs: SmokingLogs): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d < new Date(plan.startDate)) break;
    const limit = dailyLimitFor(plan, d);
    const smoked = logs[dateKey(d)] ?? 0;
    if (smoked <= limit) streak++;
    else break;
  }
  return streak;
}
