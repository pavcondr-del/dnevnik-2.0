"use client";
import { useMemo } from "react";
import { useStore } from "../lib/store";
import { CHALLENGES } from "../lib/seed";
import { buildDayStats, calcTargets, currentStreak } from "../lib/nutrition";
import { addDaysKey, clamp, shareText, todayKey } from "../lib/utils";
import { Badge, Button, Card, useToast } from "./ui";
import { CheckIcon, FlameIcon, ShareIcon, TrophyIcon } from "./icons";

// Система уровней
const LEVELS = [
  { level: 0, name: "Новичок", minStreak: 0, maxStreak: 7, emoji: "🌱", color: "#888" },
  { level: 1, name: "Любитель", minStreak: 8, maxStreak: 21, emoji: "⭐", color: "#3b82f6" },
  { level: 2, name: "Профи", minStreak: 22, maxStreak: 60, emoji: "🔥", color: "#f59e0b" },
  { level: 3, name: "Мастер", minStreak: 61, maxStreak: 100, emoji: "💎", color: "#8b5cf6" },
  { level: 4, name: "Легенда", minStreak: 101, maxStreak: 199, emoji: "👑", color: "#ec4899" },
  { level: 5, name: "Бог дисциплины", minStreak: 200, maxStreak: 364, emoji: "🏆", color: "#10b981" },
  { level: 6, name: "Бессмертный", minStreak: 365, maxStreak: 99999, emoji: "⚡", color: "#f97316" },
];

function getUserLevel(streak: number) {
  return LEVELS.find((l) => streak >= l.minStreak && streak <= l.maxStreak) || LEVELS[0];
}

export default function Challenges() {
  const { state, joinChallenge, leaveChallenge } = useStore();
  const toast = useToast();
  const targets = useMemo(() => calcTargets(state.profile), [state.profile]);
  
  const currentStreakValue = currentStreak(state.entries);
  const userLevel = getUserLevel(currentStreakValue);

  const progress = useMemo(() => {
    const map = new Map<string, number>();
    map.set("c-streak", currentStreak(state.entries));

    const week = buildDayStats(state.entries, state.activities, 7);
    const month = buildDayStats(state.entries, state.activities, 30);
    
    const calDays = week.filter(
      (d) =>
        d.totals.kcal > targets.kcal * 0.9 &&
        d.totals.kcal < targets.kcal * 1.1
    ).length;
    map.set("c-cal", calDays);

    const protDays = week.filter(
      (d) => d.totals.kcal > 0 && d.totals.protein >= targets.protein
    ).length;
    map.set("c-protein", protDays);

    map.set("c-log", month.filter((d) => d.totals.kcal > 0).length);

    // Уникальные продукты за неделю
    const weekEntries = state.entries.filter((e) => {
      const entryDate = new Date(e.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });
    const uniqueProducts = new Set(weekEntries.map((e) => e.refId)).size;
    map.set("c-explorer", uniqueProducts);

    // Стабильность веса - 7 дней подряд в пределах 1 кг от цели
    const target = state.profile.targetWeightKg ?? state.profile.weightKg;
    const weightByDate = new Map(state.weights.map((w) => [w.date, w.kg]));
    let stableWeightDays = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDaysKey(todayKey(), -i);
      const kg = weightByDate.get(day);
      if (kg != null && Math.abs(kg - target) <= 1) stableWeightDays++;
      else break;
    }
    map.set("c-stability", stableWeightDays);

    // Марафонец - 50 км за месяц (упрощённо: 10000 шагов = 7 км)
    const monthActivities = state.activities.filter((a) => {
      const actDate = new Date(a.date);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return actDate >= monthAgo;
    });
    const totalKm = monthActivities.reduce((sum, a) => {
      // Примерно: ходьба 5 км/ч = 80 шагов/мин, бег 10 км/ч = 160 шагов/мин
      const avgStepsPerKm = 1300;
      return sum + (a.minutes * 100) / avgStepsPerKm;
    }, 0);
    map.set("c-marathon", Math.round(totalKm));

    // Белковый воин - 100г белка 7 дней подряд
    const protein100Days = week.filter(
      (d) => d.totals.protein >= 100
    ).length;
    map.set("c-protein-warrior", protein100Days);

    // Без сахара - 7 дней без сладкого (упрощённо: дни без перекусов)
    const noSugarDays = week.filter((d) => {
      const dayEntries = state.entries.filter((e) => e.date === d.date);
      if (dayEntries.length === 0) return false; // Пустой день не считается
      const snacks = dayEntries.filter((e) => e.meal === "snack");
      return snacks.length === 0;
    }).length;
    map.set("c-no-sugar", noSugarDays);

    // Овощной чемпион - реальные дни с овощами
    const veggieDays = month.filter((d) => {
      const dayEntries = state.entries.filter((e) => e.date === d.date);
      return dayEntries.some((e) => {
        const prod = state.products.find((p) => p.id === e.refId);
        return prod?.category === "Овощи и грибы";
      });
    }).length;
    map.set("c-veggie-champ", veggieDays);

    // Дефицит-мастер - 10 дней в дефиците
    const deficitDays = month.filter(
      (d) => d.totals.kcal > 0 && d.totals.kcal < targets.kcal * 0.9
    ).length;
    map.set("c-deficit-master", deficitDays);

    // Железная воля - 14 дней без превышения
    const noOvereatDays = month.filter(
      (d) => d.totals.kcal > 0 && d.totals.kcal <= targets.kcal
    ).length;
    map.set("c-iron-will", noOvereatDays);

    // Золотая середина - 7 дней в норме БЖУ
    const balancedMacroDays = week.filter((d) => {
      const proteinOk = d.totals.protein >= targets.protein * 0.9 && d.totals.protein <= targets.protein * 1.1;
      const fatOk = d.totals.fat >= targets.fat * 0.9 && d.totals.fat <= targets.fat * 1.1;
      const carbsOk = d.totals.carbs >= targets.carbs * 0.9 && d.totals.carbs <= targets.carbs * 1.1;
      return proteinOk && fatOk && carbsOk;
    }).length;
    map.set("c-golden-middle", balancedMacroDays);

    // Ночной дожор - 7 дней без еды после 17:00 (пустой день не считается)
    const noLateEatDays = week.filter((d) => {
      const dayEntries = state.entries.filter((e) => e.date === d.date);
      if (dayEntries.length === 0) return false;
      return !dayEntries.some((e) => parseInt(e.time.split(":")[0]) >= 17);
    }).length;
    map.set("c-night-eater", noLateEatDays);

    // Разгрузочный день - 4 дня с <800 ккал за месяц
    const fastDays = month.filter(
      (d) => d.totals.kcal > 0 && d.totals.kcal < 800
    ).length;
    map.set("c-fast-day", fastDays);

    // Читмил-контроль - не более 2 читмилов за месяц
    const cheatDays = month.filter(
      (d) => d.totals.kcal > targets.kcal * 1.2
    ).length;
    // Если читмилов <= 2, челлендж выполнен (прогресс = 2), иначе 0
    map.set("c-cheat-control", cheatDays <= 2 ? 2 : 0);

    return map;
  }, [state.entries, state.activities, state.weights, targets]);

  const joined = state.joinedChallenges;
  const completedCount = CHALLENGES.filter((c) => {
    const isJoined = joined.includes(c.id);
    const unlockLevel = c.unlockLevel ?? 0;
    const isLocked = userLevel.level < unlockLevel;
    const isCompleted = (progress.get(c.id) ?? 0) >= c.target;
    return isJoined && !isLocked && isCompleted;
  }).length;

  const share = async (title: string, current: number, target: number) => {
    await shareText(
      "Достижение — Гармония Рациона",
      `🏆 Я прохожу челлендж «${title}» в приложении «Гармония Рациона»: ${current} из ${target}! Присоединяйся!`
    );
    toast.push("Ссылка скопирована — поделитесь с друзьями");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">Челленджи</h1>

      {/* Уровень пользователя */}
      <Card className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/30">
        <div className="flex items-center gap-4">
          <div 
            className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
            style={{ backgroundColor: `${userLevel.color}20` }}
          >
            {userLevel.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold" style={{ color: userLevel.color }}>
                {userLevel.name}
              </h2>
              <Badge color="accent">Уровень {userLevel.level}</Badge>
            </div>
            <p className="text-sm text-mut mt-1">
              Серия: <b className="text-txt">{currentStreakValue}</b> дней
              {userLevel.level < LEVELS.length - 1 && (
                <>
                  {" "}· До следующего уровня: <b className="text-accent">
                    {LEVELS[userLevel.level + 1].minStreak - currentStreakValue}
                  </b> дней
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-accent-soft to-transparent">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-3xl">
          🏆
        </span>
        <div className="flex-1">
          <h2 className="font-semibold">Соревнуйтесь и побеждайте</h2>
          <p className="text-sm text-mut">
            Прогресс считается автоматически по вашему дневнику. Присоединено
            челленджей: {joined.length} · завершено: {completedCount}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FlameIcon size={18} className="text-accent" />
          <b>{progress.get("c-streak") ?? 0}</b>
          <span className="text-mut">дн. серия</span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {CHALLENGES.map((c) => {
          const isJoined = joined.includes(c.id);
          const unlockLevel = c.unlockLevel ?? 0;
          const isLocked = userLevel.level < unlockLevel;
          // Заблокированные челленджи не показывают прогресс
          const current = isLocked ? 0 : clamp(progress.get(c.id) ?? 0, 0, c.target);
          const pct = Math.round((current / c.target) * 100);
          const done = !isLocked && current >= c.target;

          return (
            <Card
              key={c.id}
              className={
                isLocked 
                  ? "opacity-50 border-line" 
                  : done 
                  ? "border-good/40 bg-good/5" 
                  : ""
              }
            >
              <div className="flex items-start gap-3">
                <span
                  className={
                    "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl " +
                    (isLocked ? "bg-elev" : done ? "bg-good/15" : "bg-elev")
                  }
                >
                  {isLocked ? "🔒" : done ? <TrophyIcon size={24} className="text-good" /> : c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{c.title}</h3>
                    {isLocked && (
                      <Badge color="default">
                        🔒 Уровень {unlockLevel}
                      </Badge>
                    )}
                    {done && !isLocked && <Badge color="good">Выполнено!</Badge>}
                    {isJoined && !done && !isLocked && <Badge color="accent">в процессе</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-mut">
                    {isLocked 
                      ? `Откроется на уровне ${unlockLevel} (${LEVELS[unlockLevel]?.name || "???"})`
                      : c.description}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-mut">
                    {current} / {c.target}{" "}
                    {c.metric === "streak" || c.metric === "loggingDays" || c.metric === "stableWeightDays" || c.metric === "protein100Days" || c.metric === "noSugarDays" || c.metric === "veggieDays" || c.metric === "deficitDays" || c.metric === "noOvereatDays" || c.metric === "balancedMacroDays" || c.metric === "noLateEatDays" || c.metric === "fastDays"
                      ? "дней"
                      : c.metric === "uniqueProducts"
                      ? "продуктов"
                      : c.metric === "distanceKm"
                      ? "км"
                      : c.metric === "cheatMeals"
                      ? "читмилов"
                      : ""}
                  </span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-elev">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: done
                        ? "var(--color-good)"
                        : "var(--color-accent)",
                    }}
                  />
                </div>
              </div>

              {!isLocked && (
                <div className="mt-4 flex gap-2">
                  {!isJoined ? (
                    <Button size="sm" onClick={() => joinChallenge(c.id)}>
                      Участвовать
                    </Button>
                  ) : (
                    <>
                      {done && (
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => share(c.title, c.target, c.target)}
                        >
                          <ShareIcon size={14} /> Поделиться
                        </Button>
                      )}
                      <Button
                        size="sm"
                      variant="ghost"
                      onClick={() => leaveChallenge(c.id)}
                    >
                      {done ? (
                        <>
                          <CheckIcon size={14} /> Выйти
                        </>
                      ) : (
                        "Покинуть"
                      )}
                    </Button>
                  </>
                )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
