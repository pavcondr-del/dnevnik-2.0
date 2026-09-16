"use client";
import { useState } from "react";
import { useStore } from "../lib/store";
import { Button, Card, useToast } from "./ui";
import { TrendingDownIcon, TargetIcon } from "./icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ProjectionPoint {
  week: number;
  weight: number;
  date: string;
}

export default function WeightProjection() {
  const { state, saveProfile } = useStore();
  const toast = useToast();
  
  const [currentWeight, setCurrentWeight] = useState(state.profile.weightKg || 70);
  const [targetWeight, setTargetWeight] = useState(65);
  const [pace, setPace] = useState<"slow" | "moderate" | "fast">("moderate");
  const [calculated, setCalculated] = useState(false);

  // Расчёт дефицита калорий в зависимости от темпа
  const getWeeklyLoss = () => {
    switch (pace) {
      case "slow": return 0.25; // 0.25 кг в неделю
      case "moderate": return 0.5; // 0.5 кг в неделю
      case "fast": return 0.75; // 0.75 кг в неделю
    }
  };

  const weeklyLoss = getWeeklyLoss();
  const weightToLose = currentWeight - targetWeight;
  
  // Сброс calculated если вес цели достигнут или превышен
  if (weightToLose <= 0 && calculated) {
    setCalculated(false);
  }
  
  const weeksNeeded = weightToLose > 0 ? Math.ceil(weightToLose / weeklyLoss) : 0;
  
  // Расчёт калорийного дефицита
  // 1 кг жира ≈ 7700 ккал
  const dailyDeficit = Math.round((weeklyLoss * 7700) / 7);
  
  // Базовый TDEE (упрощённый расчёт)
  const bmr = state.profile.sex === "male"
    ? 10 * currentWeight + 6.25 * state.profile.heightCm - 5 * state.profile.age + 5
    : 10 * currentWeight + 6.25 * state.profile.heightCm - 5 * state.profile.age - 161;
  
  const activityMultiplier = 1.375; // лёгкая активность
  const tdee = Math.round(bmr * activityMultiplier);
  const targetCalories = tdee - dailyDeficit;

  // Генерация данных для графика
  const generateProjection = (): ProjectionPoint[] => {
    const points: ProjectionPoint[] = [];
    const startDate = new Date();
    
    for (let week = 0; week <= weeksNeeded; week++) {
      const weight = currentWeight - (week * weeklyLoss);
      const date = new Date(startDate);
      date.setDate(date.getDate() + week * 7);
      
      points.push({
        week,
        weight: Math.round(weight * 10) / 10,
        date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      });
    }
    
    return points;
  };

  const projectionData = calculated ? generateProjection() : [];
  
  // Дата достижения цели
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
  const targetDateStr = targetDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const saveToProfile = () => {
    saveProfile({
      ...state.profile,
      targetWeightKg: targetWeight,
    });
    toast.push("Целевой вес сохранён");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Прогноз снижения веса</h1>
        <p className="mt-1 text-sm text-mut">
          Рассчитайте, когда достигнете целевого веса
        </p>
      </div>

      {/* Форма */}
      <Card>
        <h2 className="mb-3 font-semibold">Ваши данные</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Текущий вес, кг</label>
            <input
              type="number"
              min={30}
              max={300}
              step="0.1"
              className="input"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">Целевой вес, кг</label>
            <input
              type="number"
              min={30}
              max={300}
              step="0.1"
              className="input"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">Темп снижения</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPace("slow")}
                className={`rounded-lg border p-3 text-sm transition ${
                  pace === "slow"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-elev text-mut hover:text-txt"
                }`}
              >
                <div className="font-semibold">Медленно</div>
                <div className="text-xs mt-1">0.25 кг/нед</div>
              </button>
              <button
                onClick={() => setPace("moderate")}
                className={`rounded-lg border p-3 text-sm transition ${
                  pace === "moderate"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-elev text-mut hover:text-txt"
                }`}
              >
                <div className="font-semibold">Умеренно</div>
                <div className="text-xs mt-1">0.5 кг/нед</div>
              </button>
              <button
                onClick={() => setPace("fast")}
                className={`rounded-lg border p-3 text-sm transition ${
                  pace === "fast"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-elev text-mut hover:text-txt"
                }`}
              >
                <div className="font-semibold">Быстро</div>
                <div className="text-xs mt-1">0.75 кг/нед</div>
              </button>
            </div>
          </div>

          <Button onClick={() => setCalculated(true)}>Рассчитать прогноз</Button>
        </div>
      </Card>

      {/* Результаты */}
      {calculated && weightToLose > 0 && (
        <>
          {/* Основная статистика */}
          <Card className="border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/20 text-accent">
                <TargetIcon size={24} />
              </div>
              <div>
                <p className="text-sm text-mut">Ориентировочная дата достижения цели</p>
                <p className="text-xl font-bold text-accent">{targetDateStr}</p>
                <p className="text-xs text-mut">
                  ~{weeksNeeded} недель · ~{weeklyLoss} кг в неделю
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-elev p-3 text-center">
                <p className="text-xs text-mut">Сейчас</p>
                <p className="text-lg font-bold">{currentWeight} кг</p>
              </div>
              <div className="rounded-lg bg-elev p-3 text-center">
                <p className="text-xs text-mut">Цель</p>
                <p className="text-lg font-bold text-accent">{targetWeight} кг</p>
              </div>
              <div className="rounded-lg bg-elev p-3 text-center">
                <p className="text-xs text-mut">Сбросить</p>
                <p className="text-lg font-bold text-bad">−{weightToLose} кг</p>
              </div>
            </div>
          </Card>

          {/* График */}
          <Card>
            <h2 className="mb-3 font-semibold">Ваш путь к цели</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis
                    dataKey="week"
                    stroke="var(--color-mut)"
                    tick={{ fontSize: 12 }}
                    label={{ value: "Недели", position: "bottom", offset: -5, style: { fontSize: 12, fill: "var(--color-mut)" } }}
                  />
                  <YAxis
                    stroke="var(--color-mut)"
                    tick={{ fontSize: 12 }}
                    domain={[targetWeight - 2, currentWeight + 2]}
                    label={{ value: "Вес (кг)", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "var(--color-mut)" } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-line)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} кг`, "Вес"]}
                    labelFormatter={(label) => `Неделя ${label}`}
                  />
                  <ReferenceLine
                    y={targetWeight}
                    stroke="var(--color-accent)"
                    strokeDasharray="5 5"
                    label={{ value: "Цель", position: "right", style: { fontSize: 11, fill: "var(--color-accent)" } }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-accent)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* План питания */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <TrendingDownIcon size={18} className="text-accent" />
              Ваш план питания
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center rounded-lg bg-elev p-3">
                <span className="text-sm text-mut">Норма для поддержания</span>
                <span className="font-semibold">{tdee} ккал/день</span>
              </div>
              <div className="flex justify-between items-center rounded-lg bg-elev p-3">
                <span className="text-sm text-mut">Дефицит</span>
                <span className="font-semibold text-bad">−{dailyDeficit} ккал/день</span>
              </div>
              <div className="flex justify-between items-center rounded-lg bg-accent/10 border border-accent/30 p-3">
                <span className="text-sm font-medium">Целевая калорийность</span>
                <span className="text-xl font-bold text-accent">{targetCalories} ккал/день</span>
              </div>
            </div>
            <Button onClick={saveToProfile} className="w-full mt-4">
              Сохранить целевой вес в профиль
            </Button>
          </Card>

          {/* Предупреждение */}
          <Card className="border-warn/30 bg-warn/5">
            <p className="text-xs leading-relaxed text-warn">
              <b>⚠️ Важно:</b> Это ориентировочный прогноз. Реальные результаты зависят от множества факторов: метаболизм, генетика, качество сна, уровень стресса, гормональный фон. Безопасный темп снижения веса — 0.5-1 кг в неделю. При быстром темпе рекомендуется консультация с врачом.
            </p>
          </Card>
        </>
      )}

      {calculated && weightToLose <= 0 && (
        <Card className="border-good/30 bg-good/5">
          <p className="text-sm text-good">
            ✓ Ваш текущий вес уже меньше или равен целевому. Отличная работа!
          </p>
        </Card>
      )}
    </div>
  );
}
