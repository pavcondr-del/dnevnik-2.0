"use client";
import { useState } from "react";
import { useStore } from "../lib/store";
import { Button, Card } from "./ui";
import { DropIcon, ScaleIcon } from "./icons";

type CalcTab = "water" | "bmi";

export default function Calculators() {
  const [tab, setTab] = useState<CalcTab>("water");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Калькуляторы</h1>
        <p className="mt-1 text-sm text-mut">
          Полезные инструменты для контроля здоровья
        </p>
      </div>

      {/* Переключатель вкладок */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("water")}
          className={
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition " +
            (tab === "water"
              ? "border-teal bg-teal/10 text-teal"
              : "border-line bg-elev text-mut hover:text-txt")
          }
        >
          <DropIcon size={16} /> Вода
        </button>
        <button
          onClick={() => setTab("bmi")}
          className={
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition " +
            (tab === "bmi"
              ? "border-accent bg-accent-soft text-accent"
              : "border-line bg-elev text-mut hover:text-txt")
          }
        >
          <ScaleIcon size={16} /> ИМТ
        </button>
      </div>

      {tab === "water" && <WaterCalc />}
      {tab === "bmi" && <BMICalc />}
    </div>
  );
}

/* ==================== КАЛЬКУЛЯТОР ВОДЫ ==================== */

function WaterCalc() {
  const { state } = useStore();
  const [weight, setWeight] = useState(state.profile.weightKg || 70);
  const [activity, setActivity] = useState<"low" | "moderate" | "high">("moderate");
  const [calculated, setCalculated] = useState(false);

  const baseWater = weight * 30;
  const activityBonus = activity === "low" ? 0 : activity === "moderate" ? 500 : 1000;
  const totalWater = baseWater + activityBonus;
  const glasses = Math.round(totalWater / 200);

  return (
    <>
      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="calc-weight" className="label">Вес, кг</label>
            <input
              id="calc-weight"
              type="number"
              min={30}
              max={200}
              className="input"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="calc-activity" className="label">Уровень активности</label>
            <select
              id="calc-activity"
              className="input"
              value={activity}
              onChange={(e) => setActivity(e.target.value as any)}
            >
              <option value="low">Низкая (сидячая работа)</option>
              <option value="moderate">Умеренная (1-3 тренировки в неделю)</option>
              <option value="high">Высокая (ежедневные тренировки)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCalculated(true)}>Рассчитать норму воды</Button>
            <Button variant="outline" onClick={() => setCalculated(false)}>Сбросить</Button>
          </div>
        </div>
      </Card>

      {calculated && (
        <>
          <Card className="border-teal/30 bg-teal/5">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal/20 text-teal">
                <DropIcon size={28} />
              </div>
              <div>
                <p className="text-sm text-mut">Ваша норма воды в день</p>
                <p className="text-3xl font-bold text-teal">{totalWater} мл</p>
                <p className="text-sm text-mut">Это примерно {glasses} стакан(ов) по 200 мл</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">💡 Советы по употреблению</h2>
            <div className="space-y-3 text-sm text-mut">
              <div className="rounded-lg bg-elev p-3">
                <p className="font-medium text-txt">🌅 Утреннее правило</p>
                <p className="mt-1">Первый стакан (около 200 мл) лучше выпить сразу после сна. Это мягко разбудит организм и настроит на продуктивный день.</p>
              </div>
              <div className="rounded-lg bg-elev p-3">
                <p className="font-medium text-txt">💪 Забота в активные дни</p>
                <p className="mt-1">При нагрузках или в жару тело теряет больше влаги. Калькулятор бережно добавляет 300–700 мл, чтобы защитить ваши суставы и сердце.</p>
              </div>
              <div className="rounded-lg bg-elev p-3">
                <p className="font-medium text-txt">📊 Комфортный учёт</p>
                <p className="mt-1">Не нужно высчитывать миллилитры. Мы разделили всю норму на удобные стаканы по 200 мл — так отмечать прогресс гораздо проще.</p>
              </div>
            </div>
          </Card>

          <Card className="border-warn/30 bg-warn/5">
            <p className="text-xs leading-relaxed text-warn">
              <b>⚠️ Обратите внимание:</b> это общая норма для здорового взрослого человека. Если вы имеете особенности здоровья (например, заболевания почек или сердца), перед изменением питьевого режима обязательно проконсультируйтесь с врачом.
            </p>
          </Card>
        </>
      )}
    </>
  );
}

/* ==================== КАЛЬКУЛЯТОР ИМТ ==================== */

function BMICalc() {
  const { state } = useStore();
  const [height, setHeight] = useState(state.profile.heightCm || 175);
  const [weight, setWeight] = useState(state.profile.weightKg || 70);
  const [calculated, setCalculated] = useState(false);

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Недостаточная масса", color: "text-blue", bg: "bg-blue/10", border: "border-blue/30" };
    if (bmi < 25) return { label: "Нормальная масса", color: "text-good", bg: "bg-good/10", border: "border-good/30" };
    if (bmi < 30) return { label: "Избыточная масса", color: "text-warn", bg: "bg-warn/10", border: "border-warn/30" };
    if (bmi < 35) return { label: "Ожирение I степени", color: "text-bad", bg: "bg-bad/10", border: "border-bad/30" };
    if (bmi < 40) return { label: "Ожирение II степени", color: "text-bad", bg: "bg-bad/10", border: "border-bad/30" };
    return { label: "Ожирение III степени", color: "text-bad", bg: "bg-bad/10", border: "border-bad/30" };
  };

  const category = getBMICategory(bmi);

  // Нормальный вес для данного роста
  const normalWeightMin = 18.5 * heightM * heightM;
  const normalWeightMax = 24.9 * heightM * heightM;

  return (
    <>
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bmi-height" className="label">Рост, см</label>
              <input
                id="bmi-height"
                type="number"
                min={100}
                max={250}
                className="input"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="bmi-weight" className="label">Вес, кг</label>
              <input
                id="bmi-weight"
                type="number"
                min={30}
                max={300}
                step="0.1"
                className="input"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCalculated(true)}>Рассчитать ИМТ</Button>
            <Button variant="outline" onClick={() => setCalculated(false)}>Сбросить</Button>
          </div>
        </div>
      </Card>

      {calculated && (
        <>
          {/* Результат ИМТ */}
          <Card className={`${category.border} ${category.bg}`}>
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-elev text-2xl font-bold">
                {Math.round(bmi * 10) / 10}
              </div>
              <div>
                <p className="text-sm text-mut">Ваш индекс массы тела</p>
                <p className={`text-xl font-bold ${category.color}`}>{category.label}</p>
              </div>
            </div>

            {/* Визуальная шкала ИМТ */}
            <div className="mt-4">
              <div className="relative h-4 overflow-hidden rounded-full">
                <div className="absolute inset-0 flex">
                  <div className="h-full flex-1 bg-blue/40" title="< 18.5"></div>
                  <div className="h-full flex-1 bg-good/40" title="18.5 - 24.9"></div>
                  <div className="h-full flex-1 bg-warn/40" title="25 - 29.9"></div>
                  <div className="h-full flex-1 bg-bad/40" title="30+"></div>
                </div>
                {/* Маркер позиции */}
                <div
                  className="absolute top-0 h-4 w-1 bg-txt"
                  style={{
                    left: `${Math.min(Math.max((bmi - 15) / 30 * 100, 0), 100)}%`,
                  }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-faint">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>45</span>
              </div>
            </div>
          </Card>

          {/* Нормальный вес */}
          <Card>
            <h2 className="mb-2 font-semibold">⚖️ Нормальный вес для вашего роста</h2>
            <p className="text-sm text-mut">
              При росте <b>{height} см</b> нормальный вес составляет от{" "}
              <b className="text-good">{Math.round(normalWeightMin)} кг</b> до{" "}
              <b className="text-good">{Math.round(normalWeightMax)} кг</b>.
            </p>
            {bmi >= 25 && (
              <p className="mt-2 text-sm text-warn">
                Ваш вес выше нормы на <b>{Math.round(weight - normalWeightMax)} кг</b>.
              </p>
            )}
            {bmi < 18.5 && (
              <p className="mt-2 text-sm text-blue">
                Ваш вес ниже нормы на <b>{Math.round(normalWeightMin - weight)} кг</b>.
              </p>
            )}
          </Card>

          {/* Таблица ИМТ */}
          <Card>
            <h2 className="mb-3 font-semibold">📋 Значения индекса массы тела</h2>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-elev">
                    <th className="px-3 py-2 text-left font-medium">ИМТ, кг/м²</th>
                    <th className="px-3 py-2 text-left font-medium">Масса тела</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2 text-blue">&lt; 18,5</td>
                    <td className="px-3 py-2">Недостаточная</td>
                  </tr>
                  <tr className="border-t border-line bg-good/5">
                    <td className="px-3 py-2 text-good">18,5 – 24,9</td>
                    <td className="px-3 py-2 font-medium text-good">Нормальная ✓</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2 text-warn">25,0 – 29,9</td>
                    <td className="px-3 py-2">Избыточная</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2 text-bad">30,0 – 34,9</td>
                    <td className="px-3 py-2">Ожирение I степени</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2 text-bad">35,0 – 39,9</td>
                    <td className="px-3 py-2">Ожирение II степени</td>
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-3 py-2 text-bad">40,0 и выше</td>
                    <td className="px-3 py-2">Ожирение III степени</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-warn/30 bg-warn/5">
            <p className="text-xs leading-relaxed text-warn">
              <b>⚠️ Важно:</b> ИМТ — ориентировочный показатель. Он не учитывает состав тела (мышцы тяжелее жира), возраст, пол и другие факторы. Спортсмены с развитой мускулатурой могут иметь высокий ИМТ при нормальном здоровье. Для точной оценки проконсультируйтесь со специалистом.
            </p>
          </Card>
        </>
      )}
    </>
  );
}
