"use client";
import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { Card, Button, EmptyState, useToast } from "./ui";
import { PlusIcon, TrashIcon, CheckIcon, CalendarIcon } from "./icons";
import { todayKey, addDaysKey } from "../lib/utils";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

export default function HabitTracker() {
  const { state, addHabit, deleteHabit, logHabit } = useStore();
  const toast = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("⭐");

  const emojiOptions = ["⭐", "💧", "🏃", "📚", "🧘", "💪", "🥗", "😴", "🎯", "✨"];

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toast.push("Введите название привычки", "err");
      return;
    }

    addHabit({
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      createdAt: todayKey(),
    });

    setNewHabitName("");
    setNewHabitEmoji("⭐");
    setShowAddForm(false);
    toast.push("Привычка добавлена");
  };

  const handleToggleHabit = (habitId: string, date: string) => {
    const existingLog = state.habitLogs.find(
      (log) => log.habitId === habitId && log.date === date
    );

    if (existingLog) {
      // Если запись есть, удаляем её (снимаем отметку)
      logHabit(habitId, date, false);
    } else {
      // Если записи нет, создаём её (ставим отметку)
      logHabit(habitId, date, true);
    }
  };

  // Получаем последние 7 дней
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(addDaysKey(todayKey(), -i));
    }
    return days;
  }, []);

  // Статистика по каждой привычке
  const getHabitStats = (habitId: string) => {
    const logs = state.habitLogs.filter((log) => log.habitId === habitId);
    const completedCount = logs.filter((log) => log.completed).length;
    
    // Подсчёт текущей серии
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const date = addDaysKey(todayKey(), -i);
      const log = logs.find((l) => l.date === date && l.completed);
      if (log) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Подсчёт лучшей серии
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedLogs = logs
      .filter((l) => l.completed)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    for (let i = 0; i < sortedLogs.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = sortedLogs[i - 1].date;
        const currDate = sortedLogs[i].date;
        const expectedDate = addDaysKey(prevDate, 1);
        
        if (currDate === expectedDate) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    return {
      completedCount,
      currentStreak,
      bestStreak,
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date(todayKey());
    const yesterday = new Date(addDaysKey(todayKey(), -1));
    
    if (dateStr === todayKey()) return "Сегодня";
    if (dateStr === addDaysKey(todayKey(), -1)) return "Вчера";
    
    return date.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Трекер привычек</h1>
          <p className="mt-1 text-sm text-mut">
            Отслеживайте ежедневные привычки и формируйте полезные ритуалы
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <PlusIcon size={16} /> Новая привычка
        </Button>
      </div>

      {/* Форма добавления привычки */}
      {showAddForm && (
        <Card>
          <h2 className="mb-3 font-semibold">Новая привычка</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Название</label>
              <input
                type="text"
                className="input"
                placeholder="Например: Пить воду, Делать зарядку..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddHabit();
                }}
              />
            </div>
            <div>
              <label className="label">Иконка</label>
              <div className="flex gap-2 flex-wrap">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewHabitEmoji(emoji)}
                    className={`w-10 h-10 rounded-lg border-2 transition ${
                      newHabitEmoji === emoji
                        ? "border-accent bg-accent/10"
                        : "border-line bg-elev hover:border-accent/50"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddHabit}>Добавить</Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Список привычек */}
      {state.habits.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Привычек пока нет"
          text="Создайте первую привычку и начните отслеживать её выполнение каждый день"
        />
      ) : (
        <div className="space-y-4">
          {state.habits.map((habit) => {
            const stats = getHabitStats(habit.id);
            
            return (
              <Card key={habit.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{habit.emoji}</span>
                    <div>
                      <h3 className="font-semibold">{habit.name}</h3>
                      <div className="flex gap-4 text-xs text-mut mt-1">
                        <span>Всего: {stats.completedCount} дн.</span>
                        <span>Серия: {stats.currentStreak} дн.</span>
                        <span>Лучшая: {stats.bestStreak} дн.</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Удалить привычку "${habit.name}"?`)) {
                        deleteHabit(habit.id);
                        toast.push("Привычка удалена");
                      }
                    }}
                    className="icon-btn hover:text-bad!"
                    aria-label="Удалить привычку"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>

                {/* Календарь последних 7 дней */}
                <div className="grid grid-cols-7 gap-2">
                  {last7Days.map((date) => {
                    const log = state.habitLogs.find(
                      (l) => l.habitId === habit.id && l.date === date
                    );
                    const isCompleted = log?.completed ?? false;
                    
                    return (
                      <button
                        key={date}
                        onClick={() => handleToggleHabit(habit.id, date)}
                        className={`aspect-square rounded-lg border-2 transition flex flex-col items-center justify-center gap-1 ${
                          isCompleted
                            ? "border-good bg-good/10"
                            : "border-line bg-elev hover:border-accent/50"
                        }`}
                      >
                        <span className="text-xs text-mut">{formatDate(date)}</span>
                        {isCompleted && (
                          <CheckIcon size={20} className="text-good" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
