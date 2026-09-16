"use client";
import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import {
  buildDayStats,
  calcTargets,
  currentStreak,
  roundTotals,
  sumEntries,
} from "../lib/nutrition";
import {
  MEAL_META,
  addDaysKey,
  downloadFile,
  fmt,
  toCSV,
  toMarkdown,
  todayKey,
  weekdayShort,
} from "../lib/utils";
import { generatePDFReport } from "../lib/pdfReport";
import { CalorieBars, MacroDonut, WeightLine } from "./Charts";
import { Badge, Button, Card, Segmented, useToast } from "./ui";
import { useHideNumbers } from "../lib/useHideNumbers";
import { ShareModal } from "./Share/ShareModal";
import {
  ChartIcon,
  DumbbellIcon,
  DownloadIcon,
  FlameIcon,
  PrinterIcon,
  ScaleIcon,
  ShareIcon,
  TargetIcon,
  UploadIcon,
} from "./icons";
import type { MealType } from "../lib/types";

function CorrelationsBlock() {
  const { state } = useStore();
  const targets = useMemo(() => calcTargets(state.profile), [state.profile]);
  const targetKcal = targets.kcal;
  
  // Собираем данные за последние 30 дней
  const last30Days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = addDaysKey(todayKey(), -i);
      const entries = state.entries.filter((e) => e.date === date);
      const totals = roundTotals(sumEntries(entries));
      const checkin = state.checkins.find((c) => c.date === date);
      result.push({ date, totals, checkin });
    }
    return result;
  }, [state.entries, state.checkins, state.profile]);

  // Фильтруем только дни с данными (есть и еда, и чек-ин)
  const daysWithData = last30Days.filter((d) => d.totals.kcal > 0 && d.checkin);
  
  // Если данных мало, показываем заглушку
  if (daysWithData.length < 10) {
    return (
      <p className="text-sm text-mut">
        Накапливаю данные… Нужно минимум 10 дней с отметками самочувствия и питания.
        Сейчас: {daysWithData.length} дней.
      </p>
    );
  }

  // Расчёт средних значений относительно целевой калорийности пользователя
  const daysWithDeficit = daysWithData.filter((d) => d.totals.kcal < targetKcal);
  const daysWithSurplus = daysWithData.filter((d) => d.totals.kcal >= targetKcal);
  
  const avgEnergyDeficit = daysWithDeficit.length > 0
    ? daysWithDeficit.reduce((sum, d) => sum + (d.checkin?.energy ?? 0), 0) / daysWithDeficit.length
    : 0;

  const avgEnergySurplus = daysWithSurplus.length > 0
    ? daysWithSurplus.reduce((sum, d) => sum + (d.checkin?.energy ?? 0), 0) / daysWithSurplus.length
    : 0;

  const daysWithSleep = daysWithData.filter((d) => d.checkin?.flags.includes("sleep_ok"));
  const daysWithoutSleep = daysWithData.filter((d) => !d.checkin?.flags.includes("sleep_ok"));
  
  const avgCaloriesWithSleep = daysWithSleep.length > 0
    ? daysWithSleep.reduce((sum, d) => sum + d.totals.kcal, 0) / daysWithSleep.length
    : 0;

  const avgCaloriesWithoutSleep = daysWithoutSleep.length > 0
    ? daysWithoutSleep.reduce((sum, d) => sum + d.totals.kcal, 0) / daysWithoutSleep.length
    : 0;

  const daysWithSport = daysWithData.filter((d) => d.checkin?.flags.includes("sport"));
  const daysWithoutSport = daysWithData.filter((d) => !d.checkin?.flags.includes("sport"));
  
  const avgCaloriesWithSport = daysWithSport.length > 0
    ? daysWithSport.reduce((sum, d) => sum + d.totals.kcal, 0) / daysWithSport.length
    : 0;

  const avgCaloriesWithoutSport = daysWithoutSport.length > 0
    ? daysWithoutSport.reduce((sum, d) => sum + d.totals.kcal, 0) / daysWithoutSport.length
    : 0;

  const stressDays = daysWithData.filter((d) => d.checkin?.flags.includes("stress"));
  const overeatCount = stressDays.filter((d) => d.totals.kcal > 2500).length;
  const overeatPercent = stressDays.length > 0 ? Math.round((overeatCount / stressDays.length) * 100) : 0;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-mut">Энергия при дефиците</span>
        <span className="font-semibold">{avgEnergyDeficit.toFixed(1)} / 5</span>
      </div>
      <div className="flex justify-between">
        <span className="text-mut">Энергия при профиците</span>
        <span className="font-semibold">{avgEnergySurplus.toFixed(1)} / 5</span>
      </div>
      <div className="flex justify-between">
        <span className="text-mut">Калории в дни со сном</span>
        <span className="font-semibold">{Math.round(avgCaloriesWithSleep)} ккал</span>
      </div>
      <div className="flex justify-between">
        <span className="text-mut">Калории в дни без сна</span>
        <span className="font-semibold">{Math.round(avgCaloriesWithoutSleep)} ккал</span>
      </div>
      <div className="flex justify-between">
        <span className="text-mut">Калории в дни со спортом</span>
        <span className="font-semibold">{Math.round(avgCaloriesWithSport)} ккал</span>
      </div>
      <div className="flex justify-between">
        <span className="text-mut">Калории в дни без спорта</span>
        <span className="font-semibold">{Math.round(avgCaloriesWithoutSport)} ккал</span>
      </div>
      <div className="flex justify-between">
        <span className="text-mut">Переедание в стрессовые дни</span>
        <span className="font-semibold">{overeatPercent}%</span>
      </div>
    </div>
  );
}

export default function Statistics() {
  const { state } = useStore();
  const hideNumbers = useHideNumbers();
  const toast = useToast();
  const [range, setRange] = useState<"1" | "7" | "30" | "custom">("7");
  const [shareOpen, setShareOpen] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState(todayKey());
  const [customDateTo, setCustomDateTo] = useState(todayKey());
  
  const days = range === "1" ? 1 : range === "7" ? 7 : range === "30" ? 30 : 
    (() => {
      const from = new Date(customDateFrom + "T00:00:00");
      const to = new Date(customDateTo + "T00:00:00");
      const diff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diff);
    })();

  const targets = useMemo(
    () => calcTargets(state.profile),
    [state.profile]
  );

  const stats = useMemo(() => {
    if (range === "custom") {
      // Для произвольного периода фильтруем данные по датам
      const result = [];
      const startDate = new Date(customDateFrom);
      const endDate = new Date(customDateTo);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0];
        const dayEntries = state.entries.filter((e) => e.date === dateKey);
        const dayActivities = state.activities.filter((a) => a.date === dateKey);
        
        const totals = roundTotals(sumEntries(dayEntries));
        const burned = dayActivities.reduce((sum, a) => sum + a.kcal, 0);
        
        result.push({ date: dateKey, totals, burned });
      }
      
      return result;
    }
    return buildDayStats(state.entries, state.activities, days);
  }, [state.entries, state.activities, days, range, customDateFrom, customDateTo]);

  const logged = stats.filter((d) => d.totals.kcal > 0);

  // Среднее потребление (только потреблённые калории, без активности)
  const avgKcal = logged.length
    ? logged.reduce((s, d) => s + d.totals.kcal, 0) / logged.length
    : 0;
  const avgProtein = logged.length
    ? logged.reduce((s, d) => s + d.totals.protein, 0) / logged.length
    : 0;
  const avgFat = logged.length
    ? logged.reduce((s, d) => s + d.totals.fat, 0) / logged.length
    : 0;
  const avgCarbs = logged.length
    ? logged.reduce((s, d) => s + d.totals.carbs, 0) / logged.length
    : 0;

  const onTarget = logged.filter(
    (d) =>
      d.totals.kcal >= targets.kcal * 0.9 && d.totals.kcal <= targets.kcal * 1.1
  ).length;
  const adherence = logged.length
    ? Math.round((onTarget / logged.length) * 100)
    : 0;

  const totalBurned = stats.reduce((s, d) => s + d.burned, 0);
  const streak = currentStreak(state.entries);

  const bars = stats.map((d, i) => ({
    label:
      days === 7
        ? weekdayShort(d.date)
        : i % 5 === 0 || i === days - 1
          ? String(Number(d.date.slice(8)))
          : "",
    value: Math.round(d.totals.kcal),
    burned: Math.round(d.burned),
    isToday: d.date === todayKey(),
  }));

  const exportEntries = () => {
    const rows: (string | number)[][] = [
      ["Дата", "Приём пищи", "Время", "Продукт/блюдо", "Вес, г", "Калории", "Белки", "Жиры", "Углеводы"],
      ...state.entries
        .slice()
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map((e) => [
          e.date,
          MEAL_META[e.meal as MealType].label,
          e.time,
          e.name,
          e.grams,
          Math.round(e.kcal),
          e.protein,
          e.fat,
          e.carbs,
        ]),
    ];
    downloadFile(`dnevnik-${todayKey()}.csv`, toCSV(rows), "text/csv;charset=utf-8");
    toast.push("CSV дневника выгружен");
  };

  const exportWeights = () => {
    const rows: (string | number)[][] = [
      ["Дата", "Вес, кг"],
      ...state.weights.map((w) => [w.date, w.kg]),
    ];
    downloadFile(`ves-${todayKey()}.csv`, toCSV(rows), "text/csv;charset=utf-8");
  };

  const exportActivities = () => {
    const rows: (string | number)[][] = [
      ["Дата", "Активность", "Минуты", "Сожжено ккал"],
      ...state.activities.map((a) => [a.date, a.label, a.minutes, a.kcal]),
    ];
    downloadFile(`aktivnost-${todayKey()}.csv`, toCSV(rows), "text/csv;charset=utf-8");
  };

  const exportBackup = () => {
    downloadFile(
      `kaloriyka-backup-${todayKey()}.json`,
      JSON.stringify(state, null, 2),
      "application/json;charset=utf-8"
    );
    toast.push("Резервная копия сохранена");
  };

  const exportMarkdown = () => {
    const entries = state.entries
      .slice()
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((e) => ({
        date: e.date,
        meal: e.meal,
        time: e.time,
        name: e.name,
        grams: e.grams,
        kcal: e.kcal,
        protein: e.protein,
        fat: e.fat,
        carbs: e.carbs,
      }));

    const notes = state.notes.map((n) => ({
      date: n.date,
      text: n.text,
    }));

    const markdown = toMarkdown(entries, notes);
    downloadFile(
      `dnevnik-${todayKey()}.md`,
      markdown,
      "text/markdown;charset=utf-8"
    );
    toast.push("Markdown дневника выгружен");
  };

  const exportPDF = async () => {
    try {
      const pdfRange = range === "1" ? "7" : range === "custom" ? "30" : range;
      await generatePDFReport(state, pdfRange);
      toast.push("PDF-отчёт сгенерирован");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.push("Ошибка при генерации PDF", "err");
    }
  };

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Статистика</h1>
        <div className="flex flex-col gap-2">
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "1", label: "День" },
              { value: "7", label: "Неделя" },
              { value: "30", label: "Месяц" },
              { value: "custom", label: "Свой" },
            ]}
            className="w-80"
          />
          {range === "custom" && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                className="input"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
              />
              <span className="text-mut">—</span>
              <input
                type="date"
                className="input"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Баланс калорий для режима "День" */}
      {range === "1" && logged.length > 0 && (
        <Card className="bg-gradient-to-br from-accent/5 to-transparent">
          <h2 className="mb-4 font-semibold">Баланс калорий за сегодня</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">{fmt(logged[0].totals.kcal)}</div>
              <div className="text-xs text-mut mt-1">Потреблено</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal">{fmt(logged[0].burned)}</div>
              <div className="text-xs text-mut mt-1">Сожжено</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warn">{fmt(targets.kcal)}</div>
              <div className="text-xs text-mut mt-1">Цель</div>
            </div>
          </div>
          <div className="border-t border-line pt-4">
            {(() => {
              const netKcal = logged[0].totals.kcal - logged[0].burned;
              const balance = netKcal - targets.kcal;
              
              if (balance < 0) {
                return (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warn">
                      Недоели {fmt(Math.abs(balance))} ккал
                    </div>
                    <div className="text-xs text-mut mt-1">
                      Чистое потребление: {fmt(netKcal)} ккал (потреблено − сожжено)
                    </div>
                  </div>
                );
              } else if (balance > 0) {
                return (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bad">
                      Переели {fmt(balance)} ккал
                    </div>
                    <div className="text-xs text-mut mt-1">
                      Чистое потребление: {fmt(netKcal)} ккал (потреблено − сожжено)
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-good">
                      Точно в цели!
                    </div>
                    <div className="text-xs text-mut mt-1">
                      Чистое потребление: {fmt(netKcal)} ккал (потреблено − сожжено)
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </Card>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<FlameIcon size={18} />}
          value={`${fmt(avgKcal)}`}
          label={`среднее потребление ккал/день`}
          color="text-accent"
        />
        <StatTile
          icon={<TargetIcon size={18} />}
          value={`${fmt(targets.kcal)}`}
          label="ваша цель ккал/день"
          color="text-warn"
        />
        <StatTile
          icon={<ChartIcon size={18} />}
          value={`${streak}`}
          label="серия дней"
          color="text-good"
        />
        <StatTile
          icon={<DumbbellIcon size={18} />}
          value={`${fmt(totalBurned)}`}
          label="сожжено ккал за период"
          color="text-teal"
        />
      </div>
      
      {/* Пояснение к среднему потреблению */}
      {logged.length > 0 && range !== "1" && (
        <Card className="bg-elev/50">
          <p className="text-xs text-mut">
            <b>Среднее потребление</b> ({fmt(avgKcal)} ккал/день) — это среднее количество потреблённых калорий за день в выбранном периоде.
            {avgKcal < targets.kcal ? (
              <span className="text-warn"> Вы в среднем недоедаете {fmt(targets.kcal - avgKcal)} ккал от цели ({fmt(targets.kcal)} ккал).</span>
            ) : avgKcal > targets.kcal ? (
              <span className="text-bad"> Вы в среднем переедаете {fmt(avgKcal - targets.kcal)} ккал от цели ({fmt(targets.kcal)} ккал).</span>
            ) : (
              <span className="text-good"> Вы точно в своей цели!</span>
            )}
            <br />
            <b>Сожжено ккал</b> ({fmt(totalBurned)}) — это общая активность за весь период, показывается отдельно.
          </p>
        </Card>
      )}

      {/* График калорий */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Калории по дням</h2>
          <Badge color="warn">цель {fmt(targets.kcal)}</Badge>
        </div>
        <div className="mb-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: "var(--color-accent)" }}></div>
            <span className="text-mut">Получено</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: "var(--color-bad)" }}></div>
            <span className="text-mut">Сожжено</span>
          </div>
        </div>
        {logged.length > 0 ? (
          <CalorieBars data={bars} target={targets.kcal} />
        ) : (
          <p className="py-10 text-center text-sm text-mut">
            Нет данных за период. Добавьте записи в дневник.
          </p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Макронутриенты */}
        <Card>
          <h2 className="mb-2 font-semibold">Среднее распределение БЖУ</h2>
          <p className="mb-4 text-xs text-mut">
            Среднее количество белков, жиров и углеводов, которые вы потребляли в день за выбранный период.
            <br />
            <span className="text-faint">Цель: Б {targets.protein}г · Ж {targets.fat}г · У {targets.carbs}г</span>
          </p>
          {logged.length > 0 ? (
            <MacroDonut
              protein={avgProtein}
              fat={avgFat}
              carbs={avgCarbs}
            />
          ) : (
            <p className="py-10 text-center text-sm text-mut">Нет данных</p>
          )}
        </Card>

        {/* Вес */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <ScaleIcon size={18} /> Динамика веса
            </h2>
          </div>
          <WeightLogInline />
          <div className="mt-4">
            <WeightLine data={state.weights} />
          </div>
        </Card>
      </div>

      {/* Экспорт данных */}
      <Card className="no-print">
        <h2 className="mb-1 font-semibold">Экспорт данных</h2>
        <p className="mb-4 text-sm text-mut">
          Файлы скачиваются локально на устройство — сервер не требуется.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportEntries}>
            <DownloadIcon size={15} /> CSV дневника
          </Button>
          <Button variant="outline" size="sm" onClick={exportMarkdown}>
            <DownloadIcon size={15} /> Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <DownloadIcon size={15} /> PDF отчёт
          </Button>
          <Button variant="outline" size="sm" onClick={exportWeights}>
            <DownloadIcon size={15} /> CSV веса
          </Button>
          <Button variant="outline" size="sm" onClick={exportActivities}>
            <DownloadIcon size={15} /> CSV активности
          </Button>
          <Button variant="outline" size="sm" onClick={exportBackup}>
            <UploadIcon size={15} /> JSON-копия
          </Button>
          <Button variant="soft" size="sm" onClick={() => setShareOpen(true)}>
            <ShareIcon size={15} /> Поделиться результатом
          </Button>
          <Button variant="soft" size="sm" onClick={() => window.print()}>
            <PrinterIcon size={15} /> Печать
          </Button>
        </div>
      </Card>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Паттерны */}
      <Card className="no-print">
        <h2 className="mb-1 font-semibold">Паттерны</h2>
        <CorrelationsBlock />
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Card className="p-4!">
      <span className={`mb-2 inline-flex ${color}`}>{icon}</span>
      <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
      <p className="text-[11px] leading-tight text-mut">{label}</p>
    </Card>
  );
}

function WeightLogInline() {
  const { state, addWeight } = useStore();
  const toast = useToast();
  const [kg, setKg] = useState(String(state.profile.weightKg));
  const latest = state.weights[state.weights.length - 1];

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-elev p-3">
      <div className="w-28">
        <label className="label">Вес, кг</label>
        <input
          type="number"
          step="0.1"
          className="input"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
        />
      </div>
      <Button
        onClick={() => {
          const n = Number(kg.replace(",", "."));
          if (!n || n < 20 || n > 400) {
            toast.push("Введите корректный вес", "err");
            return;
          }
          addWeight({ date: todayKey(), kg: Math.round(n * 10) / 10 });
          toast.push("Вес записан");
        }}
      >
        Записать
      </Button>
      <p className="ml-auto text-xs text-mut">
        {latest
          ? `Последнее: ${fmt(latest.kg, 1)} кг`
          : "Отметьте вес сегодня"}
      </p>
    </div>
  );
}
