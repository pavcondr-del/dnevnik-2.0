"use client";
import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import type { MealEntry, MealType } from "../lib/types";
import { MEAL_META, fmt, ruDateLong } from "../lib/utils";
import { Card, Button, EmptyState } from "./ui";
import { useQuickAdd } from "./quickadd";
import { ClockIcon, SearchIcon } from "./icons";

export default function MealHistory() {
  const { state } = useStore();
  const quick = useQuickAdd();
  const [selectedMeal, setSelectedMeal] = useState<MealType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Группируем записи по приёмам пищи
  const mealHistory = useMemo(() => {
    const grouped: Record<MealType, Array<{ date: string; entries: MealEntry[] }>> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      extra: [],
    };

    // Группируем по дате и типу приёма
    const byDateAndMeal: Record<string, Record<MealType, MealEntry[]>> = {};
    
    state.entries.forEach((entry) => {
      if (!byDateAndMeal[entry.date]) {
        byDateAndMeal[entry.date] = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
          extra: [],
        };
      }
      byDateAndMeal[entry.date][entry.meal].push(entry);
    });

    // Преобразуем в массивы для каждого типа приёма
    Object.entries(byDateAndMeal).forEach(([date, meals]) => {
      (Object.keys(meals) as MealType[]).forEach((meal) => {
        if (meals[meal].length > 0) {
          grouped[meal].push({ date, entries: meals[meal] });
        }
      });
    });

    // Сортируем по дате (новые сверху)
    Object.keys(grouped).forEach((meal) => {
      grouped[meal as MealType].sort((a, b) => b.date.localeCompare(a.date));
    });

    return grouped;
  }, [state.entries]);

  // Фильтрация по поисковому запросу
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return mealHistory;

    const query = searchQuery.toLowerCase();
    const filtered: typeof mealHistory = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      extra: [],
    };

    Object.entries(mealHistory).forEach(([meal, meals]) => {
      filtered[meal as MealType] = meals.filter((m) =>
        m.entries.some((e) => e.name.toLowerCase().includes(query))
      );
    });

    return filtered;
  }, [mealHistory, searchQuery]);

  const handleAddSimilar = (meal: MealType, entries: MealEntry[]) => {
    // Открываем модалку для первого продукта из предыдущего приёма
    if (entries.length > 0) {
      const firstEntry = entries[0];
      quick.open({
        meal,
        productId: firstEntry.refId,
      });
    }
  };

  const totalMeals = Object.values(filteredHistory).reduce(
    (sum, meals) => sum + meals.length,
    0
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Что я ел в прошлый раз?</h1>
        <p className="mt-1 text-sm text-mut">
          История приёмов пищи для быстрого повторения
        </p>
      </div>

      {/* Поиск */}
      <Card>
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mut"
          />
          <input
            type="text"
            className="input pl-10"
            placeholder="Поиск по названию продукта..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Фильтры по типу приёма */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMeal("all")}
          className={`chip ${selectedMeal === "all" ? "chip-active" : ""}`}
        >
          Все ({totalMeals})
        </button>
        {(["breakfast", "lunch", "dinner", "snack", "extra"] as MealType[]).map(
          (meal) => {
            const count = filteredHistory[meal].length;
            if (count === 0) return null;
            const meta = MEAL_META[meal];
            return (
              <button
                key={meal}
                onClick={() => setSelectedMeal(meal)}
                className={`chip ${selectedMeal === meal ? "chip-active" : ""}`}
              >
                {meta.emoji} {meta.label} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* История приёмов пищи */}
      {totalMeals === 0 ? (
        <EmptyState
          emoji="📋"
          title="История пуста"
          text={
            searchQuery
              ? "Ничего не найдено по вашему запросу"
              : "Начните вести дневник, чтобы увидеть историю приёмов пищи"
          }
        />
      ) : (
        <div className="space-y-4">
          {(["breakfast", "lunch", "dinner", "snack", "extra"] as MealType[])
            .filter((meal) => selectedMeal === "all" || selectedMeal === meal)
            .map((meal) => {
              const meals = filteredHistory[meal];
              if (meals.length === 0) return null;

              const meta = MEAL_META[meal];

              return (
                <div key={meal} className="space-y-3">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <span className="text-2xl">{meta.emoji}</span>
                    {meta.label}
                  </h2>

                  <div className="space-y-3">
                    {meals.slice(0, 10).map((mealData, idx) => {
                      const totalKcal = mealData.entries.reduce(
                        (sum, e) => sum + e.kcal,
                        0
                      );

                      return (
                        <Card key={`${meal}-${mealData.date}-${idx}`} className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-mut">
                              <ClockIcon size={14} />
                              <span>{ruDateLong(mealData.date)}</span>
                            </div>
                            <div className="text-sm font-semibold">
                              {fmt(totalKcal)} ккал
                            </div>
                          </div>

                          <div className="mb-3 space-y-1.5">
                            {mealData.entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between rounded-lg bg-elev/60 px-3 py-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {entry.name}
                                  </p>
                                  <p className="text-xs text-faint">
                                    {fmt(entry.grams)} г · {fmt(entry.kcal)} ккал
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAddSimilar(meal, mealData.entries)
                            }
                            className="w-full"
                          >
                            Повторить этот приём пищи
                          </Button>
                        </Card>
                      );
                    })}

                    {meals.length > 10 && (
                      <p className="text-center text-sm text-mut">
                        И ещё {meals.length - 10} записей...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
