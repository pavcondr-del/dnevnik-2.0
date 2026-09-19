import type { ShareSnapshot, ShareOptions } from "./shareTypes";
import { fmt, ruDate } from "../utils";

export function generateShareHtml(snap: ShareSnapshot, opts: ShareOptions): string {
  const dateFrom = ruDate(snap.dateFrom);
  const dateTo = ruDate(snap.dateTo);
  const generated = new Date().toLocaleDateString("ru-RU");
  const author = opts.anonymize ? "Участник" : (opts.authorName || snap.profile.name || "Участник");
  const comment = opts.comment || "";
  const htmlNote = opts.htmlNote || "";

  // SVG график веса
  const weightChartSvg = snap.weight.trend.length > 1 ? generateWeightChart(snap.weight.trend) : "";

  // SVG график калорий
  const caloriesChartSvg = snap.calories.series.length > 0 ? generateCaloriesChart(snap.calories) : "";

  // SVG БЖУ-пончик
  const macrosChartSvg = generateMacrosChart(snap.macros);

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Отчёт · ${dateFrom} – ${dateTo} · Гармония Рациона</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #121212;
    color: #e6e6e6;
    line-height: 1.6;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid #2a2a2a;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #ff6b6b;
    color: #121212;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 20px;
  }
  .app-name {
    font-size: 18px;
    color: #a0a0a0;
  }
  .meta {
    text-align: right;
    font-size: 14px;
    color: #a0a0a0;
  }
  .period {
    font-weight: 600;
    color: #e6e6e6;
  }
  h1 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .author {
    font-size: 18px;
    color: #a0a0a0;
  }
  section {
    margin-bottom: 40px;
  }
  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #2a2a2a;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  .summary-card {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
  }
  .summary-value {
    font-size: 32px;
    font-weight: 800;
    color: #ff6b6b;
    margin-bottom: 5px;
  }
  .summary-label {
    font-size: 14px;
    color: #a0a0a0;
  }
  .chart-container {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 12px;
    overflow-x: auto;
  }
  svg {
    width: 100%;
    height: auto;
  }
  .macros-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .macros-chart {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .macros-table {
    width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #2a2a2a;
  }
  th {
    color: #a0a0a0;
    font-weight: 600;
    font-size: 14px;
  }
  td {
    font-size: 16px;
  }
  .patterns-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .pattern-card {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 12px;
  }
  .pattern-card h3 {
    font-size: 18px;
    margin-bottom: 15px;
    color: #a0a0a0;
  }
  .pattern-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #2a2a2a;
  }
  .pattern-item:last-child {
    border-bottom: none;
  }
  footer {
    text-align: center;
    padding-top: 30px;
    border-top: 1px solid #2a2a2a;
    color: #a0a0a0;
    font-size: 14px;
  }
  .disclaimer {
    margin-top: 10px;
    font-size: 12px;
    font-style: italic;
  }
  @media (max-width: 600px) {
    .summary { grid-template-columns: 1fr; }
    .macros-grid { grid-template-columns: 1fr; }
    .patterns-grid { grid-template-columns: 1fr; }
    h1 { font-size: 28px; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="header-top">
      <div class="brand">
        <div class="logo">ГР</div>
        <span class="app-name">Гармония Рациона</span>
      </div>
      <div class="meta">
        <p class="period">${dateFrom} – ${dateTo}</p>
        <p class="generated">Сформирован ${generated}</p>
      </div>
    </div>
    <h1>Отчёт о питании</h1>
    <p class="author">${author}</p>
  </header>

  <section class="summary">
    <div class="summary-card">
      <div class="summary-value">${snap.weight.deltaKg !== null ? (snap.weight.deltaKg > 0 ? "+" : "") + fmt(snap.weight.deltaKg, 1) + " кг" : "—"}</div>
      <div class="summary-label">Изменение веса</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${fmt(snap.calories.average)} ккал</div>
      <div class="summary-label">Средние калории</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${fmt(snap.macros.protein.avg, 1)} г</div>
      <div class="summary-label">Средние белки</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${snap.streaks.current} дн.</div>
      <div class="summary-label">Текущая серия</div>
    </div>
  </section>

  ${snap.weight.trend.length > 1 ? `
  <section class="chart-weight">
    <h2>Динамика веса</h2>
    <div class="chart-container">
      ${weightChartSvg}
    </div>
  </section>
  ` : ""}

  ${snap.calories.series.length > 0 ? `
  <section class="chart-calories">
    <h2>Калории по дням</h2>
    <div class="chart-container">
      ${caloriesChartSvg}
    </div>
  </section>
  ` : ""}

  <section class="macros">
    <h2>Макронутриенты</h2>
    <div class="macros-grid">
      <div class="macros-chart">
        ${macrosChartSvg}
      </div>
      <div class="macros-table">
        <table>
          <thead>
            <tr>
              <th>Нутриент</th>
              <th>Среднее</th>
              <th>Цель</th>
              <th>Дней в норме</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Белки</td>
              <td>${fmt(snap.macros.protein.avg, 1)} г</td>
              <td>${fmt(snap.macros.protein.target)} г</td>
              <td>${snap.macros.protein.daysInNorm} из ${snap.calories.totalDays}</td>
            </tr>
            <tr>
              <td>Жиры</td>
              <td>${fmt(snap.macros.fat.avg, 1)} г</td>
              <td>${fmt(snap.macros.fat.target)} г</td>
              <td>${snap.macros.fat.daysInNorm} из ${snap.calories.totalDays}</td>
            </tr>
            <tr>
              <td>Углеводы</td>
              <td>${fmt(snap.macros.carbs.avg, 1)} г</td>
              <td>${fmt(snap.macros.carbs.target)} г</td>
              <td>${snap.macros.carbs.daysInNorm} из ${snap.calories.totalDays}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="patterns">
    <h2>Паттерны питания</h2>
    <div class="patterns-grid">
      <div class="pattern-card">
        <h3>Топ-10 продуктов</h3>
        ${snap.topProducts.length > 0 ? snap.topProducts.map((p) => `
          <div class="pattern-item">
            <span>${p.name}</span>
            <span>${p.count} раз</span>
          </div>
        `).join("") : "<p>Нет данных</p>"}
      </div>
      <div class="pattern-card">
        <h3>Категории продуктов</h3>
        ${snap.categories.slice(0, 5).map((c) => `
          <div class="pattern-item">
            <span>${c.name}</span>
            <span>${fmt(c.percent, 1)}%</span>
          </div>
        `).join("")}
      </div>
    </div>
  </section>

  ${snap.activity.totalMinutes > 0 ? `
  <section class="activity">
    <h2>Физическая активность</h2>
    <div class="summary">
      <div class="summary-card">
        <div class="summary-value">${fmt(snap.activity.totalMinutes)} мин</div>
        <div class="summary-label">Общее время</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${fmt(snap.activity.totalBurned)} ккал</div>
        <div class="summary-label">Сожжено</div>
      </div>
    </div>
    ${snap.activity.topTypes.length > 0 ? `
      <div class="pattern-card" style="margin-top: 20px;">
        <h3>Топ активности</h3>
        ${snap.activity.topTypes.map((a) => `
          <div class="pattern-item">
            <span>${a.label}</span>
            <span>${a.minutes} мин · ${a.kcal} ккал</span>
          </div>
        `).join("")}
      </div>
    ` : ""}
  </section>
  ` : ""}

  ${opts.includeCheckins && snap.checkins ? `
  <section class="checkins">
    <h2>Самочувствие</h2>
    <div class="summary">
      <div class="summary-card">
        <div class="summary-value">${fmt(snap.checkins.avgEnergy, 1)}/5</div>
        <div class="summary-label">Энергия</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${fmt(snap.checkins.avgHunger, 1)}/5</div>
        <div class="summary-label">Голод</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${fmt(snap.checkins.avgMood, 1)}/5</div>
        <div class="summary-label">Настроение</div>
      </div>
    </div>
  </section>
  ` : ""}

  ${snap.notes && snap.notes.length > 0 ? `
  <section class="notes">
    <h2>Заметки</h2>
    ${snap.notes.map((n) => `
      <div class="pattern-card" style="margin-bottom: 15px;">
        <div style="font-weight: 600; margin-bottom: 10px; color: #ff6b6b;">${ruDate(n.date)}</div>
        <div style="font-size: 18px; margin-bottom: 10px; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; line-height: 1.6;">${n.text}</div>
        ${n.tags.length > 0 ? `<div style="font-size: 14px; color: #a0a0a0; word-wrap: break-word; overflow-wrap: break-word;">Теги: ${n.tags.join(", ")}</div>` : ""}
      </div>
    `).join("")}
  </section>
  ` : ""}

  ${comment.length > 0 ? `
  <section class="comment">
    <h2>Комментарий к отчёту</h2>
    <div class="pattern-card">
      <div style="word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; line-height: 1.6;">${comment}</div>
    </div>
  </section>
  ` : ""}

  ${htmlNote.length > 0 ? `
  <section class="html-note">
    <h2>Заметка</h2>
    <div class="pattern-card">
      <div style="word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; line-height: 1.6; font-size: 18px;">${htmlNote}</div>
    </div>
  </section>
  ` : ""}

  <footer>
    <p>Сформирован приложением «Гармония Рациона» · ${generated}</p>
    <p class="disclaimer">Отчёт носит информационный характер.</p>
  </footer>
</div>
</body>
</html>`;
}

function generateWeightChart(trend: { date: string; kg: number }[]): string {
  const width = 680;
  const height = 200;
  const padding = 40;

  const minKg = Math.min(...trend.map((t) => t.kg));
  const maxKg = Math.max(...trend.map((t) => t.kg));
  const range = maxKg - minKg || 1;

  const points = trend.map((t, i) => {
    const x = padding + (i / (trend.length - 1)) * (width - padding * 2);
    const y = height - padding - ((t.kg - minKg) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  // Линия тренда
  const firstPoint = trend[0];
  const lastPoint = trend[trend.length - 1];
  const x1 = padding;
  const y1 = height - padding - ((firstPoint.kg - minKg) / range) * (height - padding * 2);
  const x2 = width - padding;
  const y2 = height - padding - ((lastPoint.kg - minKg) / range) * (height - padding * 2);

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <polyline points="${polyline}" fill="none" stroke="#ff6b6b" stroke-width="3" />
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#a0a0a0" stroke-width="2" stroke-dasharray="4 4" />
    ${trend.map((t, i) => {
      const x = padding + (i / (trend.length - 1)) * (width - padding * 2);
      const y = height - padding - ((t.kg - minKg) / range) * (height - padding * 2);
      return `<circle cx="${x}" cy="${y}" r="4" fill="#ff6b6b" />`;
    }).join("")}
  </svg>`;
}

function generateCaloriesChart(calories: { target: number; series: { date: string; kcal: number }[] }): string {
  const width = 680;
  const height = 200;
  const padding = 40;

  const maxKcal = Math.max(...calories.series.map((s) => s.kcal), calories.target);

  const bars = calories.series.map((s, i) => {
    const barWidth = (width - padding * 2) / calories.series.length - 2;
    const x = padding + (i / calories.series.length) * (width - padding * 2);
    const barHeight = (s.kcal / maxKcal) * (height - padding * 2);
    const y = height - padding - barHeight;

    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#ff6b6b" />`;
  }).join("");

  // Линия цели
  const targetY = height - padding - (calories.target / maxKcal) * (height - padding * 2);

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
    <line x1="${padding}" y1="${targetY}" x2="${width - padding}" y2="${targetY}" stroke="#ffb84d" stroke-width="2" stroke-dasharray="4 4" />
  </svg>`;
}

function generateMacrosChart(macros: { protein: { avg: number }; fat: { avg: number }; carbs: { avg: number } }): string {
  const total = macros.protein.avg + macros.fat.avg + macros.carbs.avg;
  if (total === 0) return "";

  const proteinPercent = (macros.protein.avg / total) * 100;
  const fatPercent = (macros.fat.avg / total) * 100;
  const carbsPercent = (macros.carbs.avg / total) * 100;

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  const proteinOffset = 0;
  const fatOffset = circumference * (proteinPercent / 100);
  const carbsOffset = circumference * ((proteinPercent + fatPercent) / 100);

  return `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="${radius}" fill="none" stroke="#ff6b6b" stroke-width="30"
      stroke-dasharray="${circumference * (proteinPercent / 100)} ${circumference}"
      stroke-dashoffset="${proteinOffset}" transform="rotate(-90 100 100)" />
    <circle cx="100" cy="100" r="${radius}" fill="none" stroke="#ffb84d" stroke-width="30"
      stroke-dasharray="${circumference * (fatPercent / 100)} ${circumference}"
      stroke-dashoffset="${fatOffset}" transform="rotate(-90 100 100)" />
    <circle cx="100" cy="100" r="${radius}" fill="none" stroke="#7bc67e" stroke-width="30"
      stroke-dasharray="${circumference * (carbsPercent / 100)} ${circumference}"
      stroke-dashoffset="${carbsOffset}" transform="rotate(-90 100 100)" />
  </svg>`;
}
