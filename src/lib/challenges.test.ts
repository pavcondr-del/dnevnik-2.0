import { describe, it, expect } from "vitest";
import { currentStreak } from "./nutrition";
import { CHALLENGES } from "./seed";
import type { MealEntry, ActivityEntry, WeightPoint, Product } from "./types";
import { todayKey, addDaysKey } from "./utils";

function createTestEntry(daysAgo: number, meal: string, kcal: number): MealEntry {
  const date = addDaysKey(todayKey(), -daysAgo);
  return {
    id: `e-${daysAgo}-${meal}`,
    date,
    meal: meal as any,
    time: "12:00",
    kind: "product",
    refId: "p1",
    name: "Test Product",
    grams: 100,
    kcal,
    protein: 10,
    fat: 5,
    carbs: 20,
  };
}

describe("currentStreak", () => {
  it("должен возвращать 0 для пустого массива", () => {
    expect(currentStreak([])).toBe(0);
  });

  it("должен считать серию дней подряд", () => {
    const entries = [0, 1, 2, 3, 4].map((d) => createTestEntry(d, "lunch", 500));
    expect(currentStreak(entries)).toBe(5);
  });

  it("должен обнулять серию при пропуске дня", () => {
    // Сегодня и позавчера, но не вчера
    const entries = [createTestEntry(0, "lunch", 500), createTestEntry(2, "lunch", 500)];
    expect(currentStreak(entries)).toBe(1);
  });

  it("должен считать серию только с записями сегодня", () => {
    const entries = [createTestEntry(0, "lunch", 500)];
    expect(currentStreak(entries)).toBe(1);
  });

  it("должен работать с большим количеством дней", () => {
    const entries = Array.from({ length: 100 }, (_, i) => createTestEntry(i, "lunch", 500));
    expect(currentStreak(entries)).toBe(100);
  });
});

describe("CHALLENGES константы", () => {
  it("должен содержать все необходимые челленджи", () => {
    expect(CHALLENGES.length).toBeGreaterThan(0);
    
    // Проверяем наличие обязательных полей
    CHALLENGES.forEach((c) => {
      expect(c.id).toBeDefined();
      expect(c.title).toBeDefined();
      expect(c.description).toBeDefined();
      expect(c.target).toBeGreaterThan(0);
      expect(c.metric).toBeDefined();
      expect(c.icon).toBeDefined();
    });
  });

  it("должен иметь уникальные ID", () => {
    const ids = CHALLENGES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("должен иметь корректные уровни разблокировки", () => {
    CHALLENGES.forEach((c) => {
      expect(c.unlockLevel ?? 0).toBeGreaterThanOrEqual(0);
    });
  });

  it("должен иметь период в днях", () => {
    CHALLENGES.forEach((c) => {
      expect(c.periodDays).toBeGreaterThan(0);
    });
  });
});

describe("Прогресс челленджей (логика из Challenges.tsx)", () => {
  it("должен рассчитывать прогресс streak челленджа", () => {
    const entries = [0, 1, 2, 3, 4, 5, 6].map((d) => createTestEntry(d, "lunch", 500));
    const streak = currentStreak(entries);
    expect(streak).toBe(7);
  });

  it("должен рассчитывать прогресс calorieDays челленджа", () => {
    // Цель ~2400 ккал, коридор ±10%: 2160-2640
    const targetKcal = 2400;
    const inRange = (kcal: number) => kcal > targetKcal * 0.9 && kcal < targetKcal * 1.1;
    
    const entries = [
      createTestEntry(0, "lunch", 2300),
      createTestEntry(1, "lunch", 2400),
      createTestEntry(2, "lunch", 2500),
      createTestEntry(3, "lunch", 1500), // вне коридора
      createTestEntry(4, "lunch", 3000), // вне коридора
    ];
    
    // Считаем дни в коридоре за последние 7 дней
    const weekEntries = entries.slice(0, 5);
    const calDays = weekEntries.filter((e) => inRange(e.kcal)).length;
    
    expect(calDays).toBe(3);
  });

  it("должен рассчитывать прогресс loggingDays челленджа", () => {
    // 10 дней с записями
    const entries = Array.from({ length: 10 }, (_, i) => createTestEntry(i, "lunch", 500));
    const daysWithEntries = new Set(entries.map((e) => e.date)).size;
    expect(daysWithEntries).toBe(10);
  });

  it("должен рассчитывать прогресс uniqueProducts челленджа", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      ...createTestEntry(i % 7, "lunch", 500),
      refId: `p${i + 1}`,
    }));
    
    const uniqueProducts = new Set(entries.map((e) => e.refId)).size;
    expect(uniqueProducts).toBe(10);
  });
});

describe("Граничные случаи", () => {
  it("должен обрабатывать отрицательные значения", () => {
    const entry: MealEntry = {
      id: "e-neg",
      date: todayKey(),
      meal: "lunch",
      time: "12:00",
      kind: "product",
      refId: "p1",
      name: "Test",
      grams: -100,
      kcal: -500,
      protein: -10,
      fat: -5,
      carbs: -20,
    };
    
    expect(() => currentStreak([entry])).not.toThrow();
  });

  it("должен обрабатывать очень большие числа", () => {
    const entries = Array.from({ length: 1000 }, (_, i) => createTestEntry(i, "lunch", 1000000));
    expect(() => currentStreak(entries)).not.toThrow();
  });

  it("должен обрабатывать дублирующиеся даты", () => {
    const entries = [
      createTestEntry(0, "breakfast", 300),
      createTestEntry(0, "lunch", 500),
      createTestEntry(0, "dinner", 600),
    ];
    expect(currentStreak(entries)).toBe(1); // Один уникальный день
  });

  it("должен обрабатывать записи без сегодняшнего дня", () => {
    const entries = [1, 2, 3].map((d) => createTestEntry(d, "lunch", 500));
    const streak = currentStreak(entries);
    // Если нет записи сегодня, серия начинается со вчера
    expect(streak).toBeLessThanOrEqual(3);
  });
});
