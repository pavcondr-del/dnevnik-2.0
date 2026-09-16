import html2pdf from "html2pdf.js";
import type { AppState } from "../lib/types";
import { ruDateLong, todayKey, fmt } from "../lib/utils";
import { calcTargets, roundTotals, sumEntries } from "../lib/nutrition";

export async function generatePDFReport(state: AppState, period: "7" | "30" = "7") {
  const days = period === "7" ? 7 : 30;
  const today = todayKey();
  const targets = calcTargets(state.profile);

  // Фильтрация данных за период
  const entries = state.entries.filter((e) => {
    const entryDate = new Date(e.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entryDate >= cutoff;
  });

  const activities = state.activities.filter((a) => {
    const actDate = new Date(a.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return actDate >= cutoff;
  });

  const weights = state.weights.filter((w) => {
    const weightDate = new Date(w.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return weightDate >= cutoff;
  });

  // Группировка по дням
  const dailyStats: { date: string; kcal: number; protein: number; fat: number; carbs: number; burned: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];

    const dayEntries = entries.filter((e) => e.date === dateKey);
    const dayActivities = activities.filter((a) => a.date === dateKey);

    const totals = roundTotals(sumEntries(dayEntries));
    const burned = dayActivities.reduce((sum, a) => sum + a.kcal, 0);

    dailyStats.unshift({
      date: dateKey,
      kcal: totals.kcal,
      protein: totals.protein,
      fat: totals.fat,
      carbs: totals.carbs,
      burned,
    });
  }

  // Средняя статистика
  const loggedDays = dailyStats.filter((d) => d.kcal > 0);
  const avgKcal = loggedDays.length > 0 ? loggedDays.reduce((sum, d) => sum + d.kcal, 0) / loggedDays.length : 0;
  const avgProtein = loggedDays.length > 0 ? loggedDays.reduce((sum, d) => sum + d.protein, 0) / loggedDays.length : 0;
  const avgFat = loggedDays.length > 0 ? loggedDays.reduce((sum, d) => sum + d.fat, 0) / loggedDays.length : 0;
  const avgCarbs = loggedDays.length > 0 ? loggedDays.reduce((sum, d) => sum + d.carbs, 0) / loggedDays.length : 0;
  const totalBurned = dailyStats.reduce((sum, d) => sum + d.burned, 0);

  // Создание HTML-контента для PDF
  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.color = "#333";
  element.style.fontSize = "12px";

  element.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 24px; margin-bottom: 10px; color: #1a1a1a;">Отчёт по питанию</h1>
      <p style="font-size: 14px; color: #666;">Период: последние ${days} дней</p>
      <p style="font-size: 14px; color: #666;">Дата создания: ${ruDateLong(today)}</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">Профиль</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <p><strong>Имя:</strong> ${state.profile.name || "Не указано"}</p>
          <p><strong>Возраст:</strong> ${state.profile.age} лет</p>
          <p><strong>Пол:</strong> ${state.profile.sex === "male" ? "Мужской" : "Женский"}</p>
          <p><strong>Рост:</strong> ${state.profile.heightCm} см</p>
          <p><strong>Вес:</strong> ${state.profile.weightKg} кг</p>
          <p><strong>Цель:</strong> ${state.profile.goal === "lose" ? "Снижение веса" : state.profile.goal === "gain" ? "Набор массы" : "Поддержание веса"}</p>
        </div>
        <div>
          <p><strong>Целевые показатели:</strong></p>
          <p>Калории: <strong>${targets.kcal} ккал/день</strong></p>
          <p>Белки: <strong>${targets.protein} г/день</strong></p>
          <p>Жиры: <strong>${targets.fat} г/день</strong></p>
          <p>Углеводы: <strong>${targets.carbs} г/день</strong></p>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">Средние показатели за период</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <p>Среднее потребление: <strong>${Math.round(avgKcal)} ккал/день</strong></p>
        <p>Белки: <strong>${Math.round(avgProtein)} г/день</strong></p>
        <p>Жиры: <strong>${Math.round(avgFat)} г/день</strong></p>
        <p>Углеводы: <strong>${Math.round(avgCarbs)} г/день</strong></p>
        <p>Всего сожжено: <strong>${Math.round(totalBurned)} ккал</strong></p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">Детальная статистика по дням</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Дата</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Калории</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Белки</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Жиры</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Углеводы</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Сожжено</th>
          </tr>
        </thead>
        <tbody>
          ${dailyStats.map((d, i) => `
            <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f9f9f9"};">
              <td style="border: 1px solid #ddd; padding: 8px;">${ruDateLong(d.date)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${d.kcal > 0 ? `${Math.round(d.kcal)} ккал` : "—"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${d.kcal > 0 ? `${Math.round(d.protein)} г` : "—"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${d.kcal > 0 ? `${Math.round(d.fat)} г` : "—"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${d.kcal > 0 ? `${Math.round(d.carbs)} г` : "—"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${d.burned > 0 ? `${Math.round(d.burned)} ккал` : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    ${weights.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">Динамика веса</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Дата</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Вес</th>
            </tr>
          </thead>
          <tbody>
            ${weights.map((w, i) => `
              <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f9f9f9"};">
                <td style="border: 1px solid #ddd; padding: 8px;">${ruDateLong(w.date)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${w.kg} кг</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${weights.length >= 2 ? `
          <p style="margin-top: 10px;"><strong>Изменение веса:</strong> ${(weights[weights.length - 1].kg - weights[0].kg) > 0 ? "+" : ""}${(weights[weights.length - 1].kg - weights[0].kg).toFixed(1)} кг</p>
        ` : ""}
      </div>
    ` : ""}

    ${activities.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">Физическая активность</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Дата</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Активность</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Длительность</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Сожжено</th>
            </tr>
          </thead>
          <tbody>
            ${activities.map((a, i) => `
              <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f9f9f9"};">
                <td style="border: 1px solid #ddd; padding: 8px;">${ruDateLong(a.date)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${a.label}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${a.minutes} мин</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${a.kcal} ккал</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 10px;">
      <p>Отчёт создан в приложении "Гармония Рациона"</p>
      <p>Не диета. Образ жизни.</p>
    </div>
  `;

  // Генерация PDF
  const opt: any = {
    margin: 10,
    filename: `otchet-pitaniya-${period}d-${today}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  await (html2pdf() as any).from(element).set(opt).save();
}
