import type { ShareSnapshot, ShareOptions } from "./shareTypes";
import { fmt, ruDate } from "../utils";

interface StyleConfig {
  bg: string;
  text: string;
  textSecondary: string;
  accent: string;
  positive: string;
  negative: string;
}

const STYLES: Record<string, StyleConfig> = {
  minimal: {
    bg: "#121212",
    text: "#e6e6e6",
    textSecondary: "#a0a0a0",
    accent: "#ff6b6b",
    positive: "#7bc67e",
    negative: "#ff6b6b",
  },
  sport: {
    bg: "#0e0e0e",
    text: "#ffffff",
    textSecondary: "#b0b0b0",
    accent: "#ffb84d",
    positive: "#4ade80",
    negative: "#ef4444",
  },
  warm: {
    bg: "#1a1410",
    text: "#f0e6d2",
    textSecondary: "#b8a890",
    accent: "#e67700",
    positive: "#84cc16",
    negative: "#dc2626",
  },
  noNumbers: {
    bg: "#121212",
    text: "#e6e6e6",
    textSecondary: "#a0a0a0",
    accent: "#ff6b6b",
    positive: "#7bc67e",
    negative: "#ff6b6b",
  },
};

const SIZES: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1200, height: 630 },
};

export async function generateShareCard(
  snap: ShareSnapshot,
  opts: ShareOptions
): Promise<Blob> {
  const style = STYLES[opts.cardStyle];
  const size = SIZES[opts.cardSize];
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d")!;

  // Дождаться загрузки шрифтов
  await document.fonts.ready;

  // Фон
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, size.width, size.height);

  // Градиент для sport
  if (opts.cardStyle === "sport") {
    const gradient = ctx.createLinearGradient(0, 0, 0, size.height);
    gradient.addColorStop(0, "#0e0e0e");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);
  }

  const padding = 60;
  let y = padding;

  // Шапка: монограмма + название
  ctx.fillStyle = style.accent;
  ctx.beginPath();
  ctx.arc(padding + 30, y + 30, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = style.bg;
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ГР", padding + 30, y + 42);

  ctx.fillStyle = style.textSecondary;
  ctx.font = "400 20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Гармония Рациона", padding + 80, y + 38);

  y += 100;

  // Период
  ctx.fillStyle = style.text;
  ctx.font = "600 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${ruDate(snap.dateFrom)} – ${ruDate(snap.dateTo)}`,
    size.width / 2,
    y
  );

  y += 80;

  // Главный показатель
  if (snap.weight.deltaKg !== null && opts.cardStyle !== "noNumbers") {
    const delta = snap.weight.deltaKg;
    const sign = delta > 0 ? "+" : "";
    const color = delta < 0 ? style.positive : style.negative;

    ctx.fillStyle = color;
    ctx.font = "800 120px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${sign}${fmt(delta, 1)} кг`, size.width / 2, y + 100);

    y += 150;
  } else if (opts.cardStyle !== "noNumbers") {
    // Средние калории
    ctx.fillStyle = style.accent;
    ctx.font = "800 100px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${fmt(snap.calories.average)} ккал`, size.width / 2, y + 80);

    y += 130;
  }

  // Три метрики в ряд
  if (opts.cardStyle !== "noNumbers") {
    const metrics = [
      { label: "Калории", value: `${fmt(snap.calories.average)} ккал` },
      { label: "Белки", value: `${fmt(snap.macros.protein.avg, 1)} г` },
      { label: "Серия", value: `${snap.streaks.current} дн.` },
    ];

    const metricWidth = (size.width - padding * 2) / 3;

    metrics.forEach((metric, i) => {
      const x = padding + metricWidth * i + metricWidth / 2;

      ctx.fillStyle = style.accent;
      ctx.font = "700 48px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(metric.value, x, y + 50);

      ctx.fillStyle = style.textSecondary;
      ctx.font = "400 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(metric.label, x, y + 85);
    });

    y += 130;
  }

  // Мини-график (только для square и wide)
  if ((opts.cardSize === "square" || opts.cardSize === "wide") && snap.calories.series.length > 1) {
    const chartHeight = 150;
    const chartWidth = size.width - padding * 2;
    const maxKcal = Math.max(...snap.calories.series.map((s) => s.kcal));

    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();

    snap.calories.series.forEach((point, i) => {
      const x = padding + (chartWidth / (snap.calories.series.length - 1)) * i;
      const yPoint = y + chartHeight - (point.kcal / maxKcal) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, yPoint);
      } else {
        ctx.lineTo(x, yPoint);
      }
    });

    ctx.stroke();
    y += chartHeight + 50;
  }

  // Футер
  ctx.fillStyle = style.textSecondary;
  ctx.font = "400 20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Гармония Рациона", size.width / 2, size.height - 80);
  ctx.fillText(new Date().toLocaleDateString("ru-RU"), size.width / 2, size.height - 50);

  // Конвертация в Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png", 0.95);
  });
}
