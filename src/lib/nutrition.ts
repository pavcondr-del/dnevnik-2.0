import type {
  Activity,
  DayTargets,
  Goal,
  MealEntry,
  Profile,
  Totals,
} from "./types";

export const ACTIVITY_META: {
  id: Activity;
  label: string;
  factor: number;
  hint: string;
}[] = [
  { id: "sedentary", label: "Сидячий образ жизни", factor: 1.2, hint: "Мало движения, офисная работа" },
  { id: "light", label: "Слабая активность", factor: 1.375, hint: "Прогулки 1–3 раза в неделю" },
  { id: "moderate", label: "Умеренная активность", factor: 1.55, hint: "Тренировки 3–5 раз в неделю" },
  { id: "active", label: "Высокая активность", factor: 1.725, hint: "Тренировки 6–7 раз в неделю" },
  { id: "very", label: "Очень высокая", factor: 1.9, hint: "Тяжёлый труд / спорт 2 раза в день" },
];

export const GOAL_META: Record<
  Goal,
  { label: string; factor: number; hint: string; proteinPerKg: number }
> = {
  lose: { label: "Похудение", factor: 0.82, hint: "Умеренный дефицит ~18%", proteinPerKg: 1.9 },
  maintain: { label: "Поддержание веса", factor: 1, hint: "Баланс калорий", proteinPerKg: 1.5 },
  gain: { label: "Набор массы", factor: 1.12, hint: "Профицит ~12%", proteinPerKg: 1.8 },
};

/** Формула Миффлина — Сан-Жеора */
export function calcBMR(p: Pick<Profile, "sex" | "age" | "weightKg" | "heightCm">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

export function calcTargets(p: Profile): DayTargets {
  const bmr = calcBMR(p);
  const activityFactor =
    ACTIVITY_META.find((a) => a.id === p.activity)?.factor ?? 1.375;
  const tdee = Math.round(bmr * activityFactor);
  
  // Используем customDeficitPercent если задан, иначе стандартный factor
  const customFactor = p.goal === "lose" && p.customDeficitPercent != null
    ? 1 - p.customDeficitPercent / 100
    : GOAL_META[p.goal].factor;
  const kcal = Math.round(tdee * customFactor / 10) * 10;
  
  // Белки — по весу, жиры — 0.9 г/кг (минимум 45 г), углеводы — остаток калорий
  const protein = Math.round(p.weightKg * GOAL_META[p.goal].proteinPerKg);
  const fat = Math.max(45, Math.round(p.weightKg * 0.9));
  const carbs = Math.max(
    40,
    Math.round((kcal - protein * 4 - fat * 9) / 4)
  );
  
  return { bmr, tdee, kcal, protein, fat, carbs };
}

export function scaleNutrition(
  per100: { kcal: number; protein: number; fat: number; carbs: number },
  grams: number
): Totals {
  const k = grams / 100;
  return {
    kcal: per100.kcal * k,
    protein: per100.protein * k,
    fat: per100.fat * k,
    carbs: per100.carbs * k,
  };
}

export function emptyTotals(): Totals {
  return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
}

export function sumEntries(entries: MealEntry[]): Totals {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
      carbs: acc.carbs + e.carbs,
    }),
    emptyTotals()
  );
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function roundTotals(t: Totals): Totals {
  return {
    kcal: Math.round(t.kcal),
    protein: round1(t.protein),
    fat: round1(t.fat),
    carbs: round1(t.carbs),
  };
}

/** Серия дней с записями (заканчивается сегодня или вчера) */
export function currentStreak(entries: MealEntry[]): number {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  
  // Если сегодня нет записей — начинаем отсчёт со вчера
  if (!days.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  
  while (days.has(toKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  
  return streak;
}

function toKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface DayStat {
  date: string;
  totals: Totals;
  burned: number;
}

export function buildDayStats(
  entries: MealEntry[],
  activities: { date: string; kcal: number }[],
  days: number
): DayStat[] {
  const out: DayStat[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toKey(d);
    const dayEntries = entries.filter((e) => e.date === key);
    const burned = activities
      .filter((a) => a.date === key)
      .reduce((s, a) => s + a.kcal, 0);
    out.push({ date: key, totals: sumEntries(dayEntries), burned });
  }
  
  return out;
}

/** Сумма нутриентов рецепта */
export function recipeTotals(recipe: { ingredients: { kcal: number; protein: number; fat: number; carbs: number; grams: number }[] }): Totals & { grams: number } {
  return recipe.ingredients.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein: acc.protein + i.protein,
      fat: acc.fat + i.fat,
      carbs: acc.carbs + i.carbs,
      grams: acc.grams + i.grams,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, grams: 0 }
  );
}

/** Параметры для расчёта прогноза веса */
export interface ProjectionParams {
  currentWeightKg: number;
  targetWeightKg: number;
  tdee: number;
  dailyDeficit: number;
  extraBurnPerDay?: number;
}

/** Результат расчёта прогноза веса */
export interface ProjectionResult {
  daysToTarget: number;
  targetDate: Date;
  weeklyLossKg: number;
  dailyDeficit: number;
  isSafe: boolean;
  warning?: string;
}

/** Расчёт прогноза достижения целевого веса */
export function projectWeight(params: ProjectionParams): ProjectionResult {
  const { currentWeightKg, targetWeightKg, tdee, dailyDeficit, extraBurnPerDay = 0 } = params;
  
  const totalDeficit = dailyDeficit + extraBurnPerDay;
  const weeklyLossKg = (totalDeficit * 7) / 7700;
  const kgToLose = currentWeightKg - targetWeightKg;
  
  let daysToTarget: number;
  let isSafe: boolean;
  let warning: string | undefined;
  
  if (kgToLose <= 0) {
    daysToTarget = 0;
    isSafe = true;
  } else if (weeklyLossKg <= 0) {
    daysToTarget = Infinity;
    isSafe = true;
    warning = "Дефицит слишком мал — цель может быть недостижима";
  } else {
    daysToTarget = Math.ceil((kgToLose / weeklyLossKg) * 7);
    isSafe = dailyDeficit <= tdee * 0.25;
    
    if (!isSafe) {
      warning = "Дефицит слишком агрессивный. Риск потери мышц и срыва";
    } else if (dailyDeficit < 100) {
      warning = "Дефицит слишком мал — цель может быть недостижима";
    }
  }
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysToTarget);
  
  return {
    daysToTarget,
    targetDate,
    weeklyLossKg,
    dailyDeficit: totalDeficit,
    isSafe,
    warning,
  };
}
