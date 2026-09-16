import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { calcTargets, projectWeight } from "../lib/nutrition";
import { Card, Button, ConfirmModal, useToast } from "./ui";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CalendarIcon } from "./icons";

export default function Simulator() {
  const { state, saveProfile } = useStore();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Текущие параметры
  const currentWeight = state.profile.weightKg;
  const targetWeight = state.profile.targetWeightKg ?? (currentWeight - 5);
  const targets = calcTargets(state.profile);
  const currentDeficit = targets.tdee - targets.kcal;

  // Состояние слайдеров
  const [deficit, setDeficit] = useState(currentDeficit);
  const [activityMinutes, setActivityMinutes] = useState(0);
  const [noEveningSnacks, setNoEveningSnacks] = useState(false);
  const [reduce100, setReduce100] = useState(false);

  // Расчёт дополнительного сжигания от активности (MET=4 для ходьбы)
  const extraBurn = useMemo(() => {
    if (activityMinutes === 0) return 0;
    return Math.round((4 * currentWeight * activityMinutes) / 60);
  }, [activityMinutes, currentWeight]);

  // Расчёт среднего вечернего перекуса
  const eveningSnackAvg = useMemo(() => {
    const last14Days = state.entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        const daysAgo = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 14 && e.meal === "snack";
      })
      .filter((e) => {
        const hour = parseInt(e.time.split(":")[0]);
        return hour >= 18;
      });
    
    if (last14Days.length === 0) return 0;
    const total = last14Days.reduce((sum, e) => sum + e.kcal, 0);
    return Math.round(total / 14);
  }, [state.entries]);

  // Итоговый дефицит с валидацией
  const totalDeficit = useMemo(() => {
    let total = deficit;
    if (noEveningSnacks) total += eveningSnackAvg;
    if (reduce100) total += 100;
    return total + extraBurn;
  }, [deficit, noEveningSnacks, eveningSnackAvg, reduce100, extraBurn]);

  // Валидация: дефицит не должен превышать TDEE * 0.25 (безопасный предел)
  const maxSafeDeficit = Math.round(targets.tdee * 0.25);
  const validatedTotalDeficit = Math.min(totalDeficit, maxSafeDeficit);

  // Прогноз с использованием валидированного дефицита
  const projection = useMemo(() => {
    return projectWeight({
      currentWeightKg: currentWeight,
      targetWeightKg: targetWeight,
      tdee: targets.tdee,
      dailyDeficit: deficit,
      extraBurnPerDay: validatedTotalDeficit - deficit,
    });
  }, [currentWeight, targetWeight, targets.tdee, deficit, validatedTotalDeficit]);

  // Данные для графика
  const chartData = useMemo(() => {
    const data = [];
    const weeks = Math.min(Math.ceil(projection.daysToTarget / 7), 52);
    
    for (let i = 0; i <= weeks; i++) {
      const weight = currentWeight - (projection.weeklyLossKg * i);
      const date = new Date();
      date.setDate(date.getDate() + i * 7);
      data.push({
        week: i,
        weight: Math.max(weight, targetWeight),
        date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      });
    }
    
    return data;
  }, [currentWeight, targetWeight, projection]);

  const handleApply = () => {
    const deficitPercent = Math.round((validatedTotalDeficit / targets.tdee) * 100);
    saveProfile({
      ...state.profile,
      targetWeightKg: targetWeight,
      customDeficitPercent: deficitPercent,
    });
    toast.push("Норма обновлена");
    setConfirmOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getColor = () => {
    if (!projection.isSafe) return "var(--color-bad)";
    if (projection.warning) return "var(--color-warn)";
    return "var(--color-good)";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Симулятор прогноза</h1>
        <p className="mt-1 text-sm text-mut">
          Поиграйте с параметрами и посмотрите, как изменится дата достижения цели
        </p>
      </div>

      {/* Текущие параметры */}
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Текущие параметры</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-xs text-mut">Текущий вес</div>
            <div className="text-lg font-bold">{currentWeight} кг</div>
          </div>
          <div>
            <div className="text-xs text-mut">Целевой вес</div>
            <div className="text-lg font-bold">{targetWeight} кг</div>
          </div>
          <div>
            <div className="text-xs text-mut">TDEE</div>
            <div className="text-lg font-bold">{targets.tdee} ккал</div>
          </div>
          <div>
            <div className="text-xs text-mut">Норма</div>
            <div className="text-lg font-bold">{targets.kcal} ккал</div>
          </div>
        </div>
      </Card>

      {/* Слайдеры */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Настройки</h2>
        
        <div className="space-y-5">
          {/* Дефицит калорий */}
          <div>
            <label className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Дефицит калорий</span>
              <span className="text-sm font-bold text-accent">{deficit} ккал/день</span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={deficit}
              onChange={(e) => setDeficit(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-mut">
              <span>0</span>
              <span>1000</span>
            </div>
          </div>

          {/* Дополнительная активность */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Дополнительная активность (ходьба)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[0, 15, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => setActivityMinutes(min)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    activityMinutes === min
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line bg-elev hover:border-accent/50"
                  }`}
                >
                  {min === 0 ? "—" : `${min} мин`}
                </button>
              ))}
            </div>
            {extraBurn > 0 && (
              <div className="mt-2 text-xs text-mut">
                +{extraBurn} ккал сжигается
              </div>
            )}
          </div>

          {/* Чекбоксы */}
          <div className="space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={noEveningSnacks}
                onChange={(e) => setNoEveningSnacks(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Убрать перекусы после 18:00</div>
                {eveningSnackAvg > 0 && (
                  <div className="text-xs text-mut">
                    Средний вечерний перекус: {eveningSnackAvg} ккал
                  </div>
                )}
                {eveningSnackAvg === 0 && (
                  <div className="text-xs text-mut">
                    Нет данных о вечерних перекусах
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={reduce100}
                onChange={(e) => setReduce100(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Снизить калории на 100</div>
                <div className="text-xs text-mut">
                  Дополнительное снижение на 100 ккал/день
                </div>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Результат */}
      <div className="rounded-2xl border-2 p-5" style={{ borderColor: getColor(), backgroundColor: "var(--color-card)" }}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: getColor() + "20" }}>
            <CalendarIcon size={24} style={{ color: getColor() }} />
          </div>
          <div className="flex-1">
            <div className="text-sm text-mut">Дата достижения цели</div>
            <div className="text-2xl font-bold" style={{ color: getColor() }}>
              {projection.daysToTarget === 0
                ? "Цель достигнута!"
                : projection.daysToTarget === Infinity
                ? "Недостижимо"
                : formatDate(projection.targetDate)}
            </div>
            {projection.daysToTarget > 0 && projection.daysToTarget !== Infinity && (
              <div className="mt-1 text-sm text-mut">
                ~{Math.ceil(projection.daysToTarget / 7)} недель · ~{projection.weeklyLossKg.toFixed(1)} кг в неделю
              </div>
            )}
            {projection.warning && (
              <div className="mt-3 rounded-lg bg-warn/10 p-3 text-sm text-warn">
                ⚠️ {projection.warning}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* График */}
      {projection.daysToTarget > 0 && projection.daysToTarget !== Infinity && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Прогноз веса</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  formatter={(value: number) => [`${value.toFixed(1)} кг`, "Вес"]}
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
      )}

      {/* Кнопка применить */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Применить к профилю</div>
            <div className="text-sm text-mut">
              Обновить норму калорий на {targets.tdee - validatedTotalDeficit} ккал/день
            </div>
          </div>
          <Button onClick={() => setConfirmOpen(true)}>Применить</Button>
        </div>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleApply}
        title="Применить настройки?"
        text={`Обновить норму калорий в профиле на ${targets.tdee - validatedTotalDeficit} ккал/день?`}
      />
    </div>
  );
}
