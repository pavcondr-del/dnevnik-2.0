"use client";
import { useState } from "react";
import { useStore } from "../lib/store";
import { Button, Card } from "./ui";
import { FlameIcon, PlusIcon, TrashIcon } from "./icons";

interface Activity {
  name: string;
  met: number;
  category: string;
}

const ACTIVITIES: Activity[] = [
  // Спорт - Бег и ходьба
  { name: "Бег трусцой", met: 7, category: "Спорт" },
  { name: "Бег 8 км/ч", met: 8.3, category: "Спорт" },
  { name: "Бег 10 км/ч", met: 10, category: "Спорт" },
  { name: "Бег 15 км/ч", met: 12.5, category: "Спорт" },
  { name: "Быстрая ходьба", met: 5, category: "Спорт" },
  { name: "Ходьба 5 км/ч", met: 3.5, category: "Спорт" },
  { name: "Ходьба 6 км/ч", met: 4, category: "Спорт" },
  { name: "Скандинавская ходьба", met: 4.5, category: "Спорт" },
  
  // Спорт - Велосипед
  { name: "Велосипед спокойная езда (<10 км/ч)", met: 4, category: "Спорт" },
  { name: "Велосипед 20 км/ч", met: 8, category: "Спорт" },
  { name: "Велосипед 25 км/ч", met: 10, category: "Спорт" },
  { name: "Велотренажер (средняя активность)", met: 7, category: "Спорт" },
  { name: "Велотренажер (высокая активность)", met: 10.5, category: "Спорт" },
  { name: "Спиннинг / сайкл", met: 9, category: "Спорт" },
  
  // Спорт - Зал и силовые
  { name: "Силовая тренировка в зале", met: 6, category: "Спорт" },
  { name: "Кроссфит", met: 8, category: "Спорт" },
  { name: "Функциональный тренинг", met: 7, category: "Спорт" },
  { name: "TRX / петли", met: 6.5, category: "Спорт" },
  { name: "Калистеника / воркаут", met: 7, category: "Спорт" },
  { name: "Подъем тяжестей", met: 5, category: "Спорт" },
  { name: "Тренировка с гирями", met: 8, category: "Спорт" },
  
  // Спорт - Групповые занятия
  { name: "Аэробика лёгкая", met: 5, category: "Спорт" },
  { name: "Аэробика интенсивная", met: 7.5, category: "Спорт" },
  { name: "Зумба / танцевальный фитнес", met: 7, category: "Спорт" },
  { name: "Пилатес", met: 3.5, category: "Спорт" },
  { name: "Йога хатха", met: 2.5, category: "Спорт" },
  { name: "Йога динамическая", met: 4, category: "Спорт" },
  { name: "Йога hot / бикрам", met: 6, category: "Спорт" },
  
  // Спорт - Единоборства
  { name: "Бокс", met: 7.5, category: "Спорт" },
  { name: "ММА / смешанные единоборства", met: 9, category: "Спорт" },
  { name: "Восточные единоборства", met: 5.5, category: "Спорт" },
  { name: "Борьба", met: 6, category: "Спорт" },
  
  // Спорт - Игровые
  { name: "Футбол", met: 7, category: "Спорт" },
  { name: "Баскетбол", met: 6.5, category: "Спорт" },
  { name: "Волейбол", met: 4, category: "Спорт" },
  { name: "Теннис (большой)", met: 7, category: "Спорт" },
  { name: "Бадминтон", met: 5.5, category: "Спорт" },
  { name: "Настольный теннис", met: 4, category: "Спорт" },
  
  // Спорт - Водные виды
  { name: "Плавание кроль", met: 8, category: "Спорт" },
  { name: "Плавание брасс", met: 7, category: "Спорт" },
  { name: "Плавание на спине", met: 6, category: "Спорт" },
  { name: "Акваэробика", met: 5.5, category: "Спорт" },
  { name: "Водное поло", met: 10, category: "Спорт" },
  
  // Спорт - Зимние виды
  { name: "Катание на лыжах", met: 7, category: "Спорт" },
  { name: "Катание на сноуборде", met: 5.5, category: "Спорт" },
  { name: "Катание на коньках", met: 7, category: "Спорт" },
  { name: "Катание на роликах", met: 6, category: "Спорт" },
  
  // Дом и быт
  { name: "Уборка дома", met: 3.5, category: "Дом и быт" },
  { name: "Мытьё окон", met: 3.5, category: "Дом и быт" },
  { name: "Готовка", met: 2.5, category: "Дом и быт" },
  { name: "Стирка и глажка", met: 2.3, category: "Дом и быт" },
  { name: "Работа в саду", met: 5, category: "Дом и быт" },
  { name: "Копание земли", met: 5.5, category: "Дом и быт" },
  { name: "Стрижка газона", met: 5.5, category: "Дом и быт" },
  { name: "Переноска тяжестей", met: 6, category: "Дом и быт" },
  
  // Работа
  { name: "Сидячая работа (офис)", met: 1.5, category: "Работа" },
  { name: "Стоячая работа (продавец)", met: 2.5, category: "Работа" },
  { name: "Работа с лёгкими нагрузками", met: 3, category: "Работа" },
  { name: "Работа с умеренными нагрузками", met: 4, category: "Работа" },
  { name: "Тяжёлый физический труд", met: 6.5, category: "Работа" },
  { name: "Строительные работы", met: 5, category: "Работа" },
  
  // Отдых
  { name: "Сон", met: 0.9, category: "Отдых" },
  { name: "Отдых сидя (чтение, ТВ)", met: 1.3, category: "Отдых" },
  { name: "Стояние", met: 1.8, category: "Отдых" },
  { name: "Медленная прогулка", met: 2.5, category: "Отдых" },
  { name: "Рыбалка", met: 2.5, category: "Отдых" },
  { name: "Боулинг", met: 3, category: "Отдых" },
  { name: "Гольф", met: 3.5, category: "Отдых" },
];

interface ActivityEntry {
  id: string;
  name: string;
  met: number;
  minutes: number;
  kcal: number;
}

export default function CalorieCalculator() {
  const { state } = useStore();
  const [weight, setWeight] = useState(state.profile.weightKg || 70);
  const [selectedCategory, setSelectedCategory] = useState("Спорт");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  const categories = Array.from(new Set(ACTIVITIES.map((a) => a.category)));
  const filteredActivities = ACTIVITIES.filter((a) => a.category === selectedCategory);

  const addActivity = () => {
    if (!selectedActivity || minutes <= 0) return;
    const kcal = Math.round((selectedActivity.met * weight * minutes) / 60);
    setEntries([
      ...entries,
      {
        id: Date.now().toString(),
        name: selectedActivity.name,
        met: selectedActivity.met,
        minutes,
        kcal,
      },
    ]);
    setSelectedActivity(null);
    setMinutes(30);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const totalKcal = entries.reduce((sum, e) => sum + e.kcal, 0);
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Расход калорий</h1>
        <p className="mt-1 text-sm text-mut">
          Рассчитайте, сколько калорий вы сжигаете при разных активностях
        </p>
      </div>

      {/* Форма добавления */}
      <Card>
        <h2 className="mb-3 font-semibold">Добавить активность</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Ваш вес, кг</label>
            <input
              type="number"
              min={30}
              max={200}
              className="input"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">Категория</label>
            <select
              className="input"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedActivity(null);
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Активность</label>
            <select
              className="input"
              value={selectedActivity?.name || ""}
              onChange={(e) => {
                const activity = ACTIVITIES.find((a) => a.name === e.target.value);
                setSelectedActivity(activity || null);
              }}
            >
              <option value="">Выберите активность…</option>
              {filteredActivities.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} (MET: {a.met})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Время, минуты</label>
            <input
              type="number"
              min={1}
              max={600}
              className="input"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </div>

          <Button onClick={addActivity} disabled={!selectedActivity}>
            <PlusIcon size={16} /> Добавить
          </Button>
        </div>
      </Card>

      {/* Список активностей */}
      {entries.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold">Ваши активности</h2>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg bg-elev/60 p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-mut">
                    MET: {entry.met} · {entry.minutes} мин
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-teal">−{entry.kcal} ккал</p>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="icon-btn h-8 w-8 hover:text-bad!"
                  aria-label="Удалить"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Итого */}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-teal/10 p-4">
            <div>
              <p className="text-sm text-mut">Итого за день</p>
              <p className="text-xs text-mut">{totalMinutes} минут активности</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-teal">−{totalKcal} ккал</p>
            </div>
          </div>
        </Card>
      )}

      {/* Информация о MET */}
      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <FlameIcon size={18} className="text-accent" /> Как считается расход?
        </h2>
        <p className="text-sm text-mut">
          Расчёт основан на <b>MET</b> (метаболический эквивалент) — научном показателе интенсивности активности.
        </p>
        <div className="mt-3 rounded-lg bg-elev p-3 text-xs">
          <p className="font-medium text-txt mb-1">Формула:</p>
          <p className="text-mut">
            Калории = MET × вес (кг) × время (часы)
          </p>
          <p className="text-mut mt-2">
            Например: Бег (MET 8) × 70 кг × 0.5 часа = 280 ккал
          </p>
        </div>
        <div className="mt-3 text-xs text-mut">
          <p className="font-medium text-txt mb-1">Примеры MET:</p>
          <ul className="space-y-0.5">
            <li>• Лёгкая активность (ходьба, йога): 2-4 MET</li>
            <li>• Средняя активность (бег трусцой, велосипед): 5-7 MET</li>
            <li>• Интенсивная активность (бег, кроссфит): 8-12 MET</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
