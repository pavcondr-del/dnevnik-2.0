import type { AppState } from "../types";
import type { ShareOptions, ShareSnapshot } from "./shareTypes";
import { addDaysKey, todayKey } from "../utils";
import { calcTargets, roundTotals, sumEntries, currentStreak } from "../nutrition";
import type { MealType } from "../types";

export function resolvePeriod(opts: ShareOptions): { from: string; to: string } {
  const to = todayKey();
  let from: string;

  switch (opts.period) {
    case "week":
      from = addDaysKey(to, -6);
      break;
    case "twoWeeks":
      from = addDaysKey(to, -13);
      break;
    case "month":
      from = addDaysKey(to, -29);
      break;
    case "custom":
      from = opts.dateFrom;
      return { from, to: opts.dateTo };
  }

  return { from, to };
}

export function buildSnapshot(state: AppState, opts: ShareOptions): ShareSnapshot {
  const { from, to } = resolvePeriod(opts);
  const targets = calcTargets(state.profile);

  // Фильтрация данных по периоду
  const entries = state.entries.filter((e) => e.date >= from && e.date <= to);
  const weights = state.weights.filter((w) => w.date >= from && w.date <= to);
  const activities = state.activities.filter((a) => a.date >= from && a.date <= to);
  const checkins = state.checkins.filter((c) => c.date >= from && c.date <= to);
  const notes = state.notes.filter((n) => n.date >= from && n.date <= to);

  // Расчёт дней в периоде
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Вес
  const weightTrend = weights.map((w) => ({ date: w.date, kg: w.kg }));
  const weightStart = weights.length > 0 ? weights[0].kg : null;
  const weightEnd = weights.length > 0 ? weights[weights.length - 1].kg : null;
  const weightDelta = weightStart !== null && weightEnd !== null ? weightEnd - weightStart : null;
  const weightMin = weights.length > 0 ? Math.min(...weights.map((w) => w.kg)) : null;
  const weightMax = weights.length > 0 ? Math.max(...weights.map((w) => w.kg)) : null;

  // Калории по дням
  const caloriesSeries: { date: string; kcal: number; isToday: boolean }[] = [];
  const caloriesByDay: number[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDaysKey(from, i);
    const dayEntries = entries.filter((e) => e.date === date);
    const totals = roundTotals(sumEntries(dayEntries));
    caloriesSeries.push({
      date,
      kcal: totals.kcal,
      isToday: date === todayKey(),
    });
    if (totals.kcal > 0) {
      caloriesByDay.push(totals.kcal);
    }
  }

  const caloriesAvg = caloriesByDay.length > 0
    ? caloriesByDay.reduce((sum, k) => sum + k, 0) / caloriesByDay.length
    : 0;
  const caloriesMin = caloriesByDay.length > 0 ? Math.min(...caloriesByDay) : 0;
  const caloriesMax = caloriesByDay.length > 0 ? Math.max(...caloriesByDay) : 0;
  const inRangeDays = caloriesByDay.filter(
    (k) => k >= targets.kcal * 0.9 && k <= targets.kcal * 1.1
  ).length;

  // Макросы
  const proteinByDay: number[] = [];
  const fatByDay: number[] = [];
  const carbsByDay: number[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDaysKey(from, i);
    const dayEntries = entries.filter((e) => e.date === date);
    const totals = roundTotals(sumEntries(dayEntries));
    if (totals.kcal > 0) {
      proteinByDay.push(totals.protein);
      fatByDay.push(totals.fat);
      carbsByDay.push(totals.carbs);
    }
  }

  const proteinAvg = proteinByDay.length > 0
    ? proteinByDay.reduce((sum, p) => sum + p, 0) / proteinByDay.length
    : 0;
  const fatAvg = fatByDay.length > 0
    ? fatByDay.reduce((sum, f) => sum + f, 0) / fatByDay.length
    : 0;
  const carbsAvg = carbsByDay.length > 0
    ? carbsByDay.reduce((sum, c) => sum + c, 0) / carbsByDay.length
    : 0;

  const proteinDaysInNorm = proteinByDay.filter(
    (p) => p >= targets.protein * 0.9 && p <= targets.protein * 1.1
  ).length;
  const fatDaysInNorm = fatByDay.filter(
    (f) => f >= targets.fat * 0.9 && f <= targets.fat * 1.1
  ).length;
  const carbsDaysInNorm = carbsByDay.filter(
    (c) => c >= targets.carbs * 0.9 && c <= targets.carbs * 1.1
  ).length;

  // Активность
  const totalBurned = activities.reduce((sum, a) => sum + a.kcal, 0);
  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);

  const activityByType: Record<string, { minutes: number; kcal: number }> = {};
  activities.forEach((a) => {
    if (!activityByType[a.label]) {
      activityByType[a.label] = { minutes: 0, kcal: 0 };
    }
    activityByType[a.label].minutes += a.minutes;
    activityByType[a.label].kcal += a.kcal;
  });

  const topTypes = Object.entries(activityByType)
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);

  // Серия
  const currentStreakValue = currentStreak(entries);
  const loggingDays = new Set(entries.map((e) => e.date)).size;

  // Приёмы пищи
  const mealsData: Record<MealType, { totalKcal: number; count: number }> = {
    breakfast: { totalKcal: 0, count: 0 },
    lunch: { totalKcal: 0, count: 0 },
    dinner: { totalKcal: 0, count: 0 },
    snack: { totalKcal: 0, count: 0 },
    extra: { totalKcal: 0, count: 0 },
  };

  entries.forEach((e) => {
    mealsData[e.meal].totalKcal += e.kcal;
    mealsData[e.meal].count++;
  });

  const meals = {
    breakfast: {
      avgKcal: mealsData.breakfast.count > 0
        ? mealsData.breakfast.totalKcal / mealsData.breakfast.count
        : 0,
      count: mealsData.breakfast.count,
    },
    lunch: {
      avgKcal: mealsData.lunch.count > 0
        ? mealsData.lunch.totalKcal / mealsData.lunch.count
        : 0,
      count: mealsData.lunch.count,
    },
    dinner: {
      avgKcal: mealsData.dinner.count > 0
        ? mealsData.dinner.totalKcal / mealsData.dinner.count
        : 0,
      count: mealsData.dinner.count,
    },
    snack: {
      avgKcal: mealsData.snack.count > 0
        ? mealsData.snack.totalKcal / mealsData.snack.count
        : 0,
      count: mealsData.snack.count,
    },
    extra: {
      avgKcal: mealsData.extra.count > 0
        ? mealsData.extra.totalKcal / mealsData.extra.count
        : 0,
      count: mealsData.extra.count,
    },
  };

  // Топ продуктов
  const productCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.refId) {
      productCounts[e.refId] = (productCounts[e.refId] || 0) + 1;
    }
  });

  const topProducts = Object.entries(productCounts)
    .map(([refId, count]) => {
      const product = state.products.find((p) => p.id === refId);
      return { name: product?.name || "Неизвестный продукт", count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Категории
  const categoryKcal: Record<string, number> = {};
  let totalKcal = 0;

  entries.forEach((e) => {
    const product = state.products.find((p) => p.id === e.refId);
    if (product) {
      const category = product.category;
      categoryKcal[category] = (categoryKcal[category] || 0) + e.kcal;
      totalKcal += e.kcal;
    }
  });

  const categories = Object.entries(categoryKcal)
    .map(([name, kcal]) => ({
      name,
      percent: totalKcal > 0 ? (kcal / totalKcal) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  // Чек-ины
  let checkinsData: ShareSnapshot["checkins"];
  if (opts.includeCheckins && checkins.length > 0) {
    const avgEnergy = checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length;
    const avgHunger = checkins.reduce((sum, c) => sum + c.hunger, 0) / checkins.length;
    const avgMood = checkins.reduce((sum, c) => sum + c.mood, 0) / checkins.length;

    const flagsCount: Record<string, number> = {};
    checkins.forEach((c) => {
      c.flags.forEach((flag) => {
        flagsCount[flag] = (flagsCount[flag] || 0) + 1;
      });
    });

    checkinsData = { avgEnergy, avgHunger, avgMood, flagsCount };
  }

  // Заметки
  let notesData: ShareSnapshot["notes"];
  if (opts.includeNotes && notes.length > 0) {
    notesData = notes.map((n) => ({
      date: n.date,
      text: n.text,
      tags: n.tags,
    }));
  }

  // Профиль
  const profile = {
    name: opts.anonymize ? "Участник" : state.profile.name || "Участник",
    age: state.profile.age,
    sex: state.profile.sex,
    heightCm: state.profile.heightCm,
  };

  return {
    dateFrom: from,
    dateTo: to,
    days,
    profile,
    weight: {
      start: weightStart,
      end: weightEnd,
      deltaKg: weightDelta,
      min: weightMin,
      max: weightMax,
      trend: weightTrend,
    },
    calories: {
      target: targets.kcal,
      average: caloriesAvg,
      min: caloriesMin,
      max: caloriesMax,
      inRangeDays,
      totalDays: caloriesByDay.length,
      series: caloriesSeries,
    },
    macros: {
      protein: { avg: proteinAvg, target: targets.protein, daysInNorm: proteinDaysInNorm },
      fat: { avg: fatAvg, target: targets.fat, daysInNorm: fatDaysInNorm },
      carbs: { avg: carbsAvg, target: targets.carbs, daysInNorm: carbsDaysInNorm },
    },
    activity: {
      totalBurned,
      totalMinutes,
      topTypes,
    },
    streaks: {
      current: currentStreakValue,
      best: currentStreakValue, // Упрощение: используем текущую серию как лучшую
      loggingDays,
    },
    meals,
    topProducts,
    categories,
    checkins: checkinsData,
    notes: notesData,
  };
}
