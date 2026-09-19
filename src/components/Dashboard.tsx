"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { useNavigation } from "../lib/navigation";
import { useHideNumbers } from "../lib/useHideNumbers";
import {
  calcTargets,
  currentStreak,
  roundTotals,
  sumEntries,
} from "../lib/nutrition";
import {
  MEAL_META,
  MEAL_ORDER,
  fmt,
  ruDateLong,
  todayKey,
} from "../lib/utils";
import { Ring } from "./Ring";
import { MealGroup } from "./Meals";
import { Badge, Button, Card, EmptyState, Modal } from "./ui";
import { CheckinModal } from "./Checkin";
import { useQuickAdd } from "./quickadd";
import { useToast } from "./ui";
import {
  FlameIcon,
  TargetIcon,
  TrashIcon,
  ZapIcon,
} from "./icons";
import type { MealType } from "../lib/types";

const ACTIVITY_TYPES: Array<{ label: string; met: number }> = [
  { label: "Ходьба", met: 4 },
  { label: "Бег", met: 8.3 },
  { label: "Велосипед", met: 7 },
  { label: "Тренировка в зале", met: 6 },
  { label: "Плавание", met: 7 },
  { label: "Йога", met: 3 },
];

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const hideNumbers = useHideNumbers();
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = value > target;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-mut">{label}</span>
        <span className="font-medium">
          {hideNumbers ? (
            <span className="text-faint">•••</span>
          ) : (
            <>
              <span style={{ color }}>{fmt(value, 1)}</span>
              <span className="text-faint"> / {fmt(target)} г</span>
            </>
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-elev">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? "var(--color-bad)" : color }}
        />
      </div>
    </div>
  );
}

const ENERGY_EMOJIS = ["😴", "😐", "🙂", "😊", "⚡"];
const HUNGER_EMOJIS = ["🤢", "😌", "😐", "🍽️", "🐺"];
const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];

function CheckinCard({ date, onOpen }: { date: string; onOpen: () => void }) {
  const { state } = useStore();
  const checkin = state.checkins.find((c) => c.date === date);

  if (!checkin) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Самочувствие сегодня</h2>
            <p className="text-sm text-mut mt-0.5">Отметьте, как вы себя чувствуете</p>
          </div>
          <Button size="sm" onClick={onOpen}>
            Отметить
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Самочувствие сегодня</h2>
          <div className="flex gap-4 mt-2">
            <div className="text-center">
              <div className="text-2xl">{ENERGY_EMOJIS[checkin.energy - 1]}</div>
              <div className="text-xs text-mut mt-0.5">Энергия</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{HUNGER_EMOJIS[checkin.hunger - 1]}</div>
              <div className="text-xs text-mut mt-0.5">Голод</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{MOOD_EMOJIS[checkin.mood - 1]}</div>
              <div className="text-xs text-mut mt-0.5">Настроение</div>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpen}>
          Изменить
        </Button>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { state, addActivity, deleteActivity } = useStore();
  const { navigate } = useNavigation();
  const hideNumbers = useHideNumbers();
  const quick = useQuickAdd();
  const toast = useToast();
  
  // Состояние для текущего времени с обновлением каждую секунду
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  const date = todayKey();

  const targets = useMemo(() => calcTargets(state.profile), [state.profile]);
  const dayEntries = state.entries.filter((e) => e.date === date);
  const totals = roundTotals(sumEntries(dayEntries));

  const dayActivities = state.activities.filter((a) => a.date === date);
  const burned = dayActivities.reduce((s, a) => s + a.kcal, 0);
  const streak = currentStreak(state.entries);
  const remaining = targets.kcal + burned - totals.kcal;

  const [actLabel, setActLabel] = useState(ACTIVITY_TYPES[0].label);
  const [actMinutes, setActMinutes] = useState("30");
  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customMet, setCustomMet] = useState("");
  const [checkinOpen, setCheckinOpen] = useState(false);

  const addAct = () => {
    if (actLabel === "Другое") {
      setCustomOpen(true);
      return;
    }
    const min = Number(actMinutes);
    if (!min || min <= 0) return;
    const type = ACTIVITY_TYPES.find((t) => t.label === actLabel)!;
    const kcal = Math.round((type.met * state.profile.weightKg * min) / 60);
    addActivity({ date, label: type.label, minutes: min, kcal });
    toast.push(`Добавлено ${kcal} сожжённых ккал`);
    setActMinutes("30");
  };

  const addCustomAct = () => {
    const min = Number(actMinutes);
    const met = Number(customMet.replace(",", "."));
    if (!customLabel.trim() || !min || min <= 0 || !met || met <= 0) {
      toast.push("Заполните название и MET", "err");
      return;
    }
    const kcal = Math.round((met * state.profile.weightKg * min) / 60);
    addActivity({ date, label: customLabel.trim(), minutes: min, kcal });
    toast.push(`Добавлено ${kcal} сожжённых ккал`);
    setActMinutes("30");
    setCustomOpen(false);
    setCustomLabel("");
    setCustomMet("");
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="space-y-5">
      {/* Шапка */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm capitalize text-mut">
            {ruDateLong(date)} · {currentTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold sm:text-3xl">
            {greeting}
            {state.profile.name ? `, ${state.profile.name}` : ""} 👋
          </h1>
        </div>
        {streak > 0 && (
          <Badge color="accent" className="px-3 py-1.5 text-sm">
            <FlameIcon size={15} /> {streak} дн. подряд
          </Badge>
        )}
      </div>

      {!state.profile.name && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-accent-line/50 bg-accent-soft">
          <div className="flex items-center gap-3">
            <TargetIcon size={22} className="shrink-0 text-accent" />
            <p className="text-sm">
              Заполните профиль — это займёт минуту, а норма калорий станет точнее.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("profile")}>
            Заполнить
          </Button>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Кольцо калорий */}
        <Card className="flex flex-col items-center">
          <div className="mb-1 flex w-full items-center justify-between">
            <h2 className="font-semibold">Калории сегодня</h2>
            {!hideNumbers && <Badge>цель {fmt(targets.kcal)}</Badge>}
          </div>
          <Ring value={totals.kcal} target={targets.kcal} size={190} stroke={16}>
            <span className="text-4xl font-extrabold tracking-tight">
              {hideNumbers ? "•••" : fmt(totals.kcal)}
            </span>
            <span className="mt-0.5 text-xs text-mut">потреблено ккал</span>
            {!hideNumbers && (
              <span
                className={
                  "mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                  (remaining >= 0 ? "bg-good/15 text-good" : "bg-bad/15 text-bad")
                }
              >
                {remaining >= 0
                  ? `осталось ${fmt(remaining)}`
                  : `превышение ${fmt(Math.abs(remaining))}`}
              </span>
            )}
          </Ring>
          <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-elev py-2">
              <p className="font-bold text-warn">🔥 {hideNumbers ? "•••" : fmt(targets.kcal)}</p>
              <p className="text-faint">норма</p>
            </div>
            <div className="rounded-lg bg-elev py-2">
              <p className="font-bold text-teal">⚡ {hideNumbers ? "•••" : fmt(burned)}</p>
              <p className="text-faint">сожжено</p>
            </div>
          </div>
        </Card>

        {/* Макронутриенты */}
        <Card>
          <h2 className="mb-4 font-semibold">Белки, жиры, углеводы</h2>
          <div className="space-y-4">
            <MacroBar
              label="Белки"
              value={totals.protein}
              target={targets.protein}
              color="var(--color-teal)"
            />
            <MacroBar
              label="Жиры"
              value={totals.fat}
              target={targets.fat}
              color="var(--color-warn)"
            />
            <MacroBar
              label="Углеводы"
              value={totals.carbs}
              target={targets.carbs}
              color="var(--color-accent)"
            />
          </div>
          <div className="mt-5 rounded-xl bg-elev p-3 text-xs leading-relaxed text-mut">
            Расчёт по формуле <b>Миффлина — Сан-Жеора</b> с поправкой на
            активность и цель. Подробнее — в разделе «Профиль».
          </div>
        </Card>

        {/* Активность */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <ZapIcon size={18} className="text-teal" /> Активность
            </h2>
            <Badge color="teal">−{fmt(burned)} ккал</Badge>
          </div>
          {dayActivities.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {dayActivities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg bg-elev/60 px-3 py-2 text-sm"
                >
                  <span className="flex-1">
                    {a.label}{" "}
                    <span className="text-xs text-faint">{a.minutes} мин</span>
                  </span>
                  <span className="font-medium text-teal">−{a.kcal}</span>
                  <button
                    className="icon-btn h-7 w-7 hover:text-bad!"
                    onClick={() => deleteActivity(a.id)}
                    aria-label="Удалить"
                  >
                    <TrashIcon size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2">
            <select
              className="input"
              value={actLabel}
              onChange={(e) => setActLabel(e.target.value)}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.label}>{t.label}</option>
              ))}
              <option>Другое</option>
            </select>
            <div className="flex gap-2">
              <label htmlFor="act-minutes" className="sr-only">Минуты активности</label>
              <input
                id="act-minutes"
                type="number"
                min={1}
                className="input flex-1"
                placeholder="Минуты"
                value={actMinutes}
                onChange={(e) => setActMinutes(e.target.value)}
              />
              <Button onClick={addAct}>ОК</Button>
            </div>
            <p className="text-[11px] text-faint">
              Расход оценивается по MET и вашему весу ({fmt(state.profile.weightKg, 1)} кг)
            </p>
          </div>
        </Card>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {MEAL_ORDER.map((m: MealType) => (
          <button
            key={m}
            onClick={() => quick.open({ date, meal: m })}
            className="card flex flex-col items-center gap-1.5 p-3.5 transition hover:border-accent-line active:scale-[0.97]"
          >
            <span className="text-2xl">{MEAL_META[m].emoji}</span>
            <span className="text-xs font-medium text-mut">
              {MEAL_META[m].label}
            </span>
          </button>
        ))}
      </div>

      {/* Модальное окно для пользовательской активности */}
      <Modal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Своя активность"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>
              Отмена
            </Button>
            <Button onClick={addCustomAct}>Добавить</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="custom-activity-label" className="label">Название активности</label>
            <input
              id="custom-activity-label"
              className="input"
              placeholder="Например: Танцы, Йога, Бокс..."
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="custom-activity-met" className="label">MET (интенсивность)</label>
            <input
              id="custom-activity-met"
              type="number"
              min={0.1}
              step={0.1}
              className="input"
              placeholder="Например: 5.0"
              value={customMet}
              onChange={(e) => setCustomMet(e.target.value)}
            />
            <p className="mt-1.5 text-[11px] text-faint">
              MET — метаболический эквивалент. Примеры: лёгкая активность — 2-3, средняя — 4-6, интенсивная — 7-10
            </p>
          </div>
        </div>
      </Modal>

      {/* Самочувствие */}
      <CheckinCard date={date} onOpen={() => setCheckinOpen(true)} />

      {/* Приёмы пищи */}
      {dayEntries.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="Сегодня ещё нет записей"
          text="Начните с первого приёма пищи — нажмите на карточку приёма выше или кнопку «+»."
          action={
            <Button onClick={() => quick.open({ date })} size="lg">
              Добавить первую еду
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {MEAL_ORDER.map((m) => (
            <MealGroup key={m} date={date} meal={m} entries={dayEntries.filter((e) => e.meal === m)} />
          ))}
        </div>
      )}

      <CheckinModal
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        initialDate={date}
      />
    </div>
  );
}
