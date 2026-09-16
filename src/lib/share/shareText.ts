import type { ShareSnapshot } from "./shareTypes";
import { fmt, ruDate } from "../utils";

export function generateShareText(snap: ShareSnapshot): string {
  const lines: string[] = [];

  // Заголовок
  const dateFrom = ruDate(snap.dateFrom);
  const dateTo = ruDate(snap.dateTo);
  lines.push(`📊 Отчёт за ${dateFrom} – ${dateTo}`);
  lines.push("");

  // Вес
  if (snap.weight.start !== null && snap.weight.end !== null && snap.weight.deltaKg !== null) {
    const delta = snap.weight.deltaKg;
    const sign = delta > 0 ? "+" : "";
    lines.push(`⚖️ Вес: ${fmt(snap.weight.start, 1)} → ${fmt(snap.weight.end, 1)} кг (${sign}${fmt(delta, 1)})`);
  }

  // Калории
  const kcalPercent = snap.calories.target > 0
    ? Math.round((snap.calories.average / snap.calories.target) * 100)
    : 0;
  lines.push(`🍽 Калории: ${fmt(snap.calories.average)} / ${fmt(snap.calories.target)} (${kcalPercent}%)`);

  // Белки
  lines.push(`💪 Белки: ${fmt(snap.macros.protein.avg, 1)} / ${fmt(snap.macros.protein.target)} г`);

  // Активность
  if (snap.activity.totalMinutes > 0) {
    const hours = Math.floor(snap.activity.totalMinutes / 60);
    const minutes = snap.activity.totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
    lines.push(`🏃 Активность: ${timeStr}, −${fmt(snap.activity.totalBurned)} ккал`);
  }

  // Серия
  if (snap.streaks.current > 0) {
    lines.push(`🔥 Серия: ${snap.streaks.current} ${snap.streaks.current === 1 ? "день" : snap.streaks.current < 5 ? "дня" : "дней"}`);
  }

  // В цели
  if (snap.calories.totalDays > 0) {
    lines.push(`✅ В цели: ${snap.calories.inRangeDays} из ${snap.calories.totalDays} дней`);
  }

  // Чек-ины
  if (snap.checkins) {
    lines.push(`🌙 Энергия: ${fmt(snap.checkins.avgEnergy, 1)}/5 · Настроение: ${fmt(snap.checkins.avgMood, 1)}/5`);
  }

  // Заметки
  if (snap.notes && snap.notes.length > 0) {
    lines.push("");
    lines.push("💭 Комментарий:");
    const lastNote = snap.notes[snap.notes.length - 1];
    const noteText = lastNote.text.length > 200
      ? lastNote.text.substring(0, 200) + "..."
      : lastNote.text;
    lines.push(noteText);
  }

  // Ограничение длины
  let result = lines.join("\n");
  if (result.length > 800) {
    // Обрезаем заметки
    const withoutNotes = lines.slice(0, -2).join("\n");
    if (withoutNotes.length < 800) {
      result = withoutNotes;
    } else {
      result = withoutNotes.substring(0, 800);
    }
  }

  return result;
}
