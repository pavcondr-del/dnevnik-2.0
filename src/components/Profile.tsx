"use client";
import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import {
  ACTIVITY_META,
  GOAL_META,
  calcTargets,
} from "../lib/nutrition";
import type { Activity, Goal, Profile, Sex } from "../lib/types";
import { fmt, ruDate, todayKey } from "../lib/utils";
import { WeightLine } from "./Charts";
import {
  Badge,
  Button,
  Card,
  Segmented,
  useToast,
} from "./ui";
import {
  FlameIcon,
  InfoIcon,
  ScaleIcon,
  TargetIcon,
  TrashIcon,
} from "./icons";

export default function Profile() {
  const { state, saveProfile, addWeight, deleteWeightAt } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Profile>({ ...state.profile });

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const targets = useMemo(() => calcTargets(draft), [draft]);
  const savedTargets = useMemo(
    () => calcTargets(state.profile),
    [state.profile]
  );
  const changed = JSON.stringify(draft) !== JSON.stringify(state.profile);

  const save = () => {
    if (draft.age < 10 || draft.age > 100)
      return toast.push("Проверьте возраст", "err");
    if (draft.weightKg < 30 || draft.weightKg > 300)
      return toast.push("Проверьте вес", "err");
    if (draft.heightCm < 120 || draft.heightCm > 230)
      return toast.push("Проверьте рост", "err");
    // Валидация целевого веса: пустая строка или NaN не должны сохраняться как 0
    if (draft.targetWeightKg != null && (isNaN(draft.targetWeightKg) || draft.targetWeightKg <= 0)) {
      return toast.push("Целевой вес должен быть больше 0", "err");
    }

    saveProfile(draft);
    if (!state.weights.some((w) => w.date === todayKey())) {
      addWeight({ date: todayKey(), kg: draft.weightKg });
    }
    toast.push("Профиль сохранён");
  };

  const goalCards: { id: Goal; emoji: string; desc: string }[] = [
    { id: "lose", emoji: "📉", desc: GOAL_META.lose.hint },
    { id: "maintain", emoji: "⚖️", desc: GOAL_META.maintain.hint },
    { id: "gain", emoji: "💪", desc: GOAL_META.gain.hint },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">Профиль</h1>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Форма */}
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <h2 className="mb-4 font-semibold">Личные данные</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Имя</label>
                <input
                  className="input"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Как вас зовут?"
                />
              </div>
              <div>
                <label className="label">Пол</label>
                <Segmented<Sex>
                  value={draft.sex}
                  onChange={(v) => set("sex", v)}
                  options={[
                    { value: "male", label: "♂ Мужской" },
                    { value: "female", label: "♀ Женский" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="label">Возраст</label>
                  <input
                    type="number"
                    className="input"
                    value={draft.age}
                    onChange={(e) => set("age", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-faint">лет</p>
                </div>
                <div>
                  <label className="label">Рост</label>
                  <input
                    type="number"
                    className="input"
                    value={draft.heightCm}
                    onChange={(e) => set("heightCm", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-faint">см</p>
                </div>
                <div>
                  <label className="label">Вес</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={draft.weightKg}
                    onChange={(e) => set("weightKg", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-faint">кг</p>
                </div>
                <div>
                  <label className="label">Целевой вес</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={draft.targetWeightKg ?? ""}
                    onChange={(e) => set("targetWeightKg", Number(e.target.value))}
                    placeholder="—"
                  />
                  <p className="mt-1 text-[11px] text-faint">кг</p>
                </div>
              </div>
              <div>
                <label className="label">Уровень активности</label>
                <select
                  className="input"
                  value={draft.activity}
                  onChange={(e) => set("activity", e.target.value as Activity)}
                >
                  {ACTIVITY_META.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.hint}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* ИМТ */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <ScaleIcon size={18} /> Индекс массы тела (ИМТ)
            </h2>
            {(() => {
              const heightM = draft.heightCm / 100;
              const bmi = draft.weightKg / (heightM * heightM);
              const bmiRound = Math.round(bmi * 10) / 10;
              
              let category = "";
              let color = "";
              let bgColor = "";
              
              if (bmi < 18.5) {
                category = "Недостаточная масса";
                color = "text-mut";
                bgColor = "bg-elev";
              } else if (bmi < 25) {
                category = "Нормальная масса";
                color = "text-good";
                bgColor = "bg-good/10";
              } else if (bmi < 30) {
                category = "Избыточная масса";
                color = "text-warn";
                bgColor = "bg-warn/10";
              } else if (bmi < 35) {
                category = "Ожирение I степени";
                color = "text-bad";
                bgColor = "bg-bad/10";
              } else if (bmi < 40) {
                category = "Ожирение II степени";
                color = "text-bad";
                bgColor = "bg-bad/10";
              } else {
                category = "Ожирение III степени";
                color = "text-bad";
                bgColor = "bg-bad/10";
              }
              
              // Позиция маркера на шкале (от 15 до 40)
              const markerPosition = Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100);
              
              // Расчёт отклонения от нормы
              let weightStatus = "";
              let weightDiff = 0;
              let weightStatusColor = "";
              
              if (bmi >= 25) {
                weightStatus = "Ваш вес выше нормы на";
                weightDiff = Math.round(draft.weightKg - 24.9 * heightM * heightM);
                weightStatusColor = "text-warn";
              } else if (bmi < 18.5) {
                weightStatus = "Ваш вес ниже нормы на";
                weightDiff = Math.round(18.5 * heightM * heightM - draft.weightKg);
                weightStatusColor = "text-mut";
              } else {
                weightStatus = "Ваш вес в норме";
                weightDiff = 0;
                weightStatusColor = "text-good";
              }
              
              return (
                <div className="space-y-4">
                  <div className={`rounded-lg ${bgColor} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold">{bmiRound}</p>
                        <p className={`text-sm font-medium ${color}`}>{category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${weightStatusColor}`}>
                          {weightStatus}
                        </p>
                        {weightDiff > 0 && (
                          <p className={`text-2xl font-bold ${weightStatusColor}`}>
                            {weightDiff} кг
                          </p>
                        )}
                      </div>
                      <ScaleIcon size={48} className={color} />
                    </div>
                  </div>
                  
                  {/* Цветовая шкала */}
                  <div className="space-y-2">
                    <div className="relative h-8 rounded-lg overflow-hidden">
                      {/* Градиент шкалы */}
                      <div className="absolute inset-0 flex">
                        <div className="h-full flex-1 bg-mut/40"></div>
                        <div className="h-full flex-[1.3] bg-good/40"></div>
                        <div className="h-full flex-1 bg-warn/40"></div>
                        <div className="h-full flex-[1.5] bg-bad/40"></div>
                      </div>
                      {/* Маркер текущего ИМТ */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-black shadow-lg"
                        style={{ left: `${markerPosition}%` }}
                      >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
                      </div>
                    </div>
                    {/* Подписи шкалы */}
                    <div className="flex justify-between text-xs text-mut">
                      <span>15</span>
                      <span>18.5</span>
                      <span>25</span>
                      <span>30</span>
                      <span>40</span>
                    </div>
                  </div>
                  
                  {/* Легенда */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-mut/40"></div>
                      <span className="text-mut">Недостаточная масса (&lt; 18.5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-good/40"></div>
                      <span className="text-mut">Нормальная масса (18.5–24.9)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-warn/40"></div>
                      <span className="text-mut">Избыточная масса (25–29.9)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-bad/40"></div>
                      <span className="text-mut">Ожирение I/II/III степени (30+)</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-mut space-y-1 pt-2 border-t border-line">
                    <p><b>ИМТ</b> — это показатель соотношения веса и роста.</p>
                    <p>Формула: вес (кг) ÷ рост (м)²</p>
                    <p className="mt-2">
                      <b>Нормальный вес</b> для вашего роста:{" "}
                      <b className="text-good">
                        {Math.round(18.5 * heightM * heightM)}–{Math.round(24.9 * heightM * heightM)} кг
                      </b>
                    </p>
                  </div>
                </div>
              );
            })()}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Цель</h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {goalCards.map((g) => (
                <button
                  key={g.id}
                  onClick={() => set("goal", g.id)}
                  className={
                    "rounded-xl border p-3.5 text-left transition " +
                    (draft.goal === g.id
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-elev hover:border-accent-line/60")
                  }
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <p className="mt-1 text-sm font-semibold">
                    {GOAL_META[g.id].label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-faint">
                    {g.desc}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <div className="no-print">
            <Button size="lg" className="w-full" onClick={save} disabled={!changed}>
              {changed ? "Сохранить изменения" : "Данные сохранены ✓"}
            </Button>
          </div>
        </div>

        {/* Расчёт нормы */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <FlameIcon size={18} className="text-accent" /> Ваша норма
              {changed && <Badge color="warn">предпросмотр</Badge>}
            </h2>
            <div className="space-y-2.5 text-sm">
              <Row label="Базальный обмен (BMR)" value={`${fmt(targets.bmr)} ккал`} />
              <Row
                label={`Расход с активностью (TDEE)`}
                value={`${fmt(targets.tdee)} ккал`}
              />
              <div className="my-3 rounded-xl bg-accent-soft p-4 text-center">
                <p className="text-xs text-mut">Суточная цель с поправкой на цель</p>
                <p className="mt-0.5 text-4xl font-extrabold text-accent">
                  {fmt(targets.kcal)}
                </p>
                <p className="text-xs text-mut">ккал / день</p>
              </div>
              <MacroTarget
                label="Белки"
                grams={targets.protein}
                kcal={targets.protein * 4}
                color="var(--color-teal)"
              />
              <MacroTarget
                label="Жиры"
                grams={targets.fat}
                kcal={targets.fat * 9}
                color="var(--color-warn)"
              />
              <MacroTarget
                label="Углеводы"
                grams={targets.carbs}
                kcal={targets.carbs * 4}
                color="var(--color-accent)"
              />
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <InfoIcon size={15} className="text-mut" /> Как это считается?
            </h3>
            <p className="text-xs leading-relaxed text-mut">
              Формула <b>Миффлина — Сан-Жеора</b>: Сначала программа считает, сколько калорий нужно вашему телу для жизни — это зависит от веса, роста и возраста. Например, при весе 70 кг, росте 175 см и возрасте 30 лет — это около 1600 ккал. Потом добавляем калории за активность: если мало двигаетесь — чуть-чуть, если тренируетесь — побольше. Если цель похудеть — отнимаем 18%, набрать массу — добавляем 12%. Белки берём 1,5–1,9 г на каждый кг веса, жиры — 0,9 г на кг, а остаток калорий заполняем углеводами.
            </p>
            <div className="mt-3 rounded-lg bg-warn/10 p-3 text-xs leading-relaxed text-warn">
              <p className="mb-2 font-semibold">⚠️ Ограничения формулы</p>
              <p className="mb-2">
                Точность снижается при расчёте для пожилых, детей, беременных, тяжелобольных людей. Формула не учитывает индивидуальные особенности организма: состав тела, скорость метаболизма, особенности микробиома. При значительном избыточном весе или атлетическом телосложении погрешность также повышается.
              </p>
              <p className="mb-2">
                Формула используется в клинической и диетологической практике для подбора индивидуального рациона, оценки энергетических потребностей при снижении веса, у пациентов с ожирением, сахарным диабетом, метаболическим синдромом, а также в клинических условиях.
              </p>
              <p>
                <b>Если у вас есть физические ограничения</b>, для более точной оценки энергетических потребностей рекомендуется использовать формулу в сочетании с другими методами и при необходимости проконсультироваться с диетологом или другим квалифицированным специалистом.
              </p>
            </div>
          </Card>

          {/* История веса */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <ScaleIcon size={18} /> История веса
            </h2>
            {state.weights.length >= 2 ? (
              <WeightLine data={state.weights} height={130} />
            ) : (
              <p className="py-4 text-center text-xs text-mut">
                Отметьте вес в блоке «Статистика» — здесь появится график
              </p>
            )}
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto">
              {state.weights
                .slice()
                .reverse()
                .slice(0, 10)
                .map((w) => (
                  <li
                    key={w.date}
                    className="flex items-center justify-between rounded-lg bg-elev/60 px-3 py-1.5 text-sm"
                  >
                    <span className="capitalize text-mut">{ruDate(w.date)}</span>
                    <span className="flex items-center gap-2">
                      <b>{fmt(w.kg, 1)} кг</b>
                      <button
                        className="icon-btn h-7 w-7 hover:text-bad!"
                        onClick={() => deleteWeightAt(w.date)}
                        aria-label="Удалить"
                      >
                        <TrashIcon size={13} />
                      </button>
                    </span>
                  </li>
                ))}
            </ul>
          </Card>

          <Card className="flex items-center gap-3">
            <TargetIcon size={20} className="shrink-0 text-accent" />
            <p className="text-xs text-mut">
              Текущая цель: <b>{fmt(savedTargets.kcal)} ккал/день</b>.
              Напоминания о приёмах пищи можно настроить в разделе «Настройки».
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mut">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function MacroTarget({
  label,
  grams,
  kcal,
  color,
}: {
  label: string;
  grams: number;
  kcal: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
      <span className="flex-1 text-sm text-mut">{label}</span>
      <span className="text-sm">
        <b>{fmt(grams)} г</b>{" "}
        <span className="text-xs text-faint">({fmt(kcal)} ккал)</span>
      </span>
    </div>
  );
}
