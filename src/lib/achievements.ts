import {
  cigsAvoided,
  currentStreak,
  dailyLimitFor,
  dateKey,
  daysBetween,
  moneySaved,
  type SmokingLogs,
  type SmokingTimes,
  type UserPlan,
} from "./storage";

export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  category: "time" | "streak" | "money" | "milestone" | "behavior";
};

export const ACHIEVEMENTS: Achievement[] = [
  // Time-of-day
  { id: "early_bird", emoji: "🌅", title: "Early bird", description: "Smoked your first cigarette after 12pm.", category: "time" },
  { id: "night_owl_win", emoji: "🌙", title: "Night owl win", description: "Did not smoke after 9pm.", category: "time" },
  { id: "hydration_hero", emoji: "💧", title: "Hydration hero", description: "Smoke-free morning — no cigarettes before 10am.", category: "time" },
  { id: "waited_it_out", emoji: "⏰", title: "Waited it out", description: "Went 4+ hours without smoking during the day.", category: "time" },
  // Days on app
  { id: "first_week", emoji: "📅", title: "First week done", description: "Completed 7 days on the app.", category: "milestone" },
  { id: "two_weeks", emoji: "📅", title: "Two weeks strong", description: "Completed 14 days on the app.", category: "milestone" },
  { id: "one_month", emoji: "📅", title: "One month warrior", description: "Completed 30 days on the app.", category: "milestone" },
  // Money
  { id: "first_euro", emoji: "💰", title: "First euro saved", description: "Saved at least €1.", category: "money" },
  { id: "ten_euros", emoji: "💰", title: "Ten euros saved", description: "Saved at least €10.", category: "money" },
  { id: "fifty_euros", emoji: "💰", title: "Fifty euros saved", description: "Saved at least €50.", category: "money" },
  { id: "hundred_euros", emoji: "💰", title: "Hundred euros saved", description: "Saved at least €100.", category: "money" },
  // Behavior
  { id: "beat_yesterday", emoji: "📉", title: "Beat yesterday", description: "Smoked fewer cigarettes than the previous day.", category: "behavior" },
  // Streaks
  { id: "streak_5", emoji: "🔥", title: "5 day streak", description: "5 consecutive days under daily limit.", category: "streak" },
  { id: "streak_10", emoji: "🔥", title: "10 day streak", description: "10 consecutive days under daily limit.", category: "streak" },
  { id: "streak_30", emoji: "🔥", title: "30 day streak", description: "30 consecutive days under daily limit.", category: "streak" },
  // Behavior cont.
  { id: "craving_crusher", emoji: "😤", title: "Craving crusher", description: "Stayed under half your original daily limit for the first time.", category: "behavior" },
  { id: "smoke_free_after_month", emoji: "🎂", title: "One month smoke-free day", description: "First smoke-free day after 30 days on the app.", category: "milestone" },
  { id: "step_by_step", emoji: "🚶", title: "Step by step", description: "Reduced by at least 1 cigarette every week for 3 weeks in a row.", category: "behavior" },
  { id: "mind_over_matter", emoji: "🧠", title: "Mind over matter", description: "Smoked 0 cigarettes on a weekend day.", category: "behavior" },
  { id: "consistency_king", emoji: "🏅", title: "Consistency king", description: "Stayed within daily limit for 5 out of 7 days in a week.", category: "streak" },
];

function getHour(iso: string): number {
  return new Date(iso).getHours();
}

function daysOnApp(plan: UserPlan): number {
  return daysBetween(new Date(plan.startDate), new Date()) + 1;
}

function maxGapHoursToday(times: string[]): number {
  if (times.length < 2) return 0;
  const sorted = [...times].sort();
  let maxMs = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime();
    if (gap > maxMs) maxMs = gap;
  }
  return maxMs / (1000 * 60 * 60);
}

/** Compute the set of currently-earned achievement IDs based on all data. */
export function evaluateAchievements(
  plan: UserPlan,
  logs: SmokingLogs,
  times: SmokingTimes,
): Set<string> {
  const earned = new Set<string>();
  const start = new Date(plan.startDate);
  const today = new Date();
  const todayKey = dateKey(today);
  const totalDays = daysOnApp(plan);

  // Build day-by-day data from start to today
  const allDays: { d: Date; key: string; count: number; times: string[] }[] = [];
  for (let i = 0; i <= daysBetween(start, today); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dateKey(d);
    allDays.push({ d, key: k, count: logs[k] ?? 0, times: times[k] ?? [] });
  }

  // 🌅 Early bird — first smoke after 12pm on any day
  if (allDays.some((day) => day.times.length > 0 && getHour([...day.times].sort()[0]) >= 12)) {
    earned.add("early_bird");
  }

  // 🌙 Night owl win — any past full day with no smoke after 21:00 (must have at least one smoke earlier OR be smoke-free? require any full past day)
  if (
    allDays.some(
      (day) =>
        day.key !== todayKey &&
        !day.times.some((t) => getHour(t) >= 21),
    )
  ) {
    earned.add("night_owl_win");
  }

  // 💧 Hydration hero — any past day with no cigarettes before 10am
  if (
    allDays.some(
      (day) =>
        day.key !== todayKey &&
        !day.times.some((t) => getHour(t) < 10) &&
        day.times.length >= 0, // any day counts (including smoke-free)
    )
  ) {
    earned.add("hydration_hero");
  }

  // ⏰ Waited it out — 4+ hour gap during waking hours (any day)
  if (allDays.some((day) => maxGapHoursToday(day.times) >= 4)) {
    earned.add("waited_it_out");
  }

  // 📅 days on app
  if (totalDays >= 7) earned.add("first_week");
  if (totalDays >= 14) earned.add("two_weeks");
  if (totalDays >= 30) earned.add("one_month");

  // 💰 money
  const saved = moneySaved(plan, logs);
  if (saved >= 1) earned.add("first_euro");
  if (saved >= 10) earned.add("ten_euros");
  if (saved >= 50) earned.add("fifty_euros");
  if (saved >= 100) earned.add("hundred_euros");

  // Need cigsAvoided > 0 hint? Already handled via moneySaved.
  void cigsAvoided;

  // 📉 Beat yesterday — any pair of consecutive days where today < yesterday (and yesterday > 0)
  for (let i = 1; i < allDays.length; i++) {
    if (allDays[i - 1].count > 0 && allDays[i].count < allDays[i - 1].count) {
      earned.add("beat_yesterday");
      break;
    }
  }

  // 🔥 Streaks — best historical streak under limit
  let best = 0;
  let cur = 0;
  for (const day of allDays) {
    const limit = dailyLimitFor(plan, day.d);
    if (day.count <= limit) {
      cur++;
      if (cur > best) best = cur;
    } else cur = 0;
  }
  // Also check current streak (live)
  best = Math.max(best, currentStreak(plan, logs));
  if (best >= 5) earned.add("streak_5");
  if (best >= 10) earned.add("streak_10");
  if (best >= 30) earned.add("streak_30");

  // 😤 Craving crusher — under half of initial on any day with at least one log day passed
  const half = plan.initialDailyCount / 2;
  if (allDays.some((day) => day.count < half && day.key !== todayKey)) {
    earned.add("craving_crusher");
  }

  // 🎂 First smoke-free day after 30 days
  if (
    allDays.some((day, idx) => {
      const dayIndex = idx + 1; // 1-based day on app
      return dayIndex >= 30 && day.count === 0 && day.key !== todayKey;
    })
  ) {
    earned.add("smoke_free_after_month");
  }

  // 🚶 Step by step — reduced by ≥1 cig every week for 3 weeks
  // Compute weekly averages (full weeks only)
  const weeks: number[] = [];
  for (let i = 0; i + 7 <= allDays.length; i += 7) {
    const slice = allDays.slice(i, i + 7);
    const avg = slice.reduce((s, x) => s + x.count, 0) / 7;
    weeks.push(avg);
  }
  let runs = 0;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] <= weeks[i - 1] - 1) {
      runs++;
      if (runs >= 3) {
        earned.add("step_by_step");
        break;
      }
    } else runs = 0;
  }

  // 🧠 Mind over matter — 0 cigs on a weekend day (Sat/Sun)
  if (
    allDays.some((day) => {
      const dow = day.d.getDay();
      const isWeekend = dow === 0 || dow === 6;
      return isWeekend && day.count === 0 && day.key !== todayKey;
    })
  ) {
    earned.add("mind_over_matter");
  }

  // 🏅 Consistency king — within limit for 5 of any 7 consecutive days
  for (let i = 0; i + 7 <= allDays.length; i++) {
    let within = 0;
    for (let j = 0; j < 7; j++) {
      const day = allDays[i + j];
      const limit = dailyLimitFor(plan, day.d);
      if (day.count <= limit) within++;
    }
    if (within >= 5) {
      earned.add("consistency_king");
      break;
    }
  }

  return earned;
}
