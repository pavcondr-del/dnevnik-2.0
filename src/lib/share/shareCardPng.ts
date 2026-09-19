import type { ShareSnapshot, ShareOptions } from "./shareTypes";
import { fmt } from "../utils";

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

  // Фон: фото или сплошной цвет
  if (opts.cardPhoto) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = opts.cardPhoto!;
    });
    
    // Растягиваем фото на весь канвас с crop по центру
    const scale = Math.max(size.width / img.width, size.height / img.height);
    const x = (size.width - img.width * scale) / 2;
    const y = (size.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    // Полупрозрачный оверлей для читаемости текста
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, size.width, size.height);
  } else {
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, size.width, size.height);
  }

  // Градиент для sport
  if (opts.cardStyle === "sport" && !opts.cardPhoto) {
    const gradient = ctx.createLinearGradient(0, 0, 0, size.height);
    gradient.addColorStop(0, "#0e0e0e");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);
  }

  const padding = 60;
  let y = padding;

  // Шапка с логотипом
  ctx.fillStyle = style.text;
  ctx.font = "700 36px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Гармония Рациона", padding, y + 40);
  
  // Логотип "ГР" справа вверху
  ctx.textAlign = "right";
  const logoX = size.width - padding;
  const logoY = y + 25;
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(logoX, logoY, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#121212";
  ctx.font = "800 24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ГР", logoX, logoY + 9);
  
  y += 80;

  // Главный показатель (если включены макросы или стиль не noNumbers)
  if (opts.includeCardMacros && opts.cardStyle !== "noNumbers") {
    // Три метрики в ряд: Калории, Белки, Серия
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
  } else if (snap.weight.deltaKg !== null && opts.cardStyle !== "noNumbers") {
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

  // Мини-график (только для square и wide и если включены макросы)
  if (opts.includeCardMacros && (opts.cardSize === "square" || opts.cardSize === "wide") && snap.calories.series.length > 1) {
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

  // Заметка (если есть)
  if (opts.cardNote) {
    y += 30;
    const noteMaxWidth = size.width - padding * 2;
    const noteFontSize = 36; // Увеличенный размер шрифта
    ctx.fillStyle = style.text;
    ctx.font = `600 ${noteFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    
    // Разбивка текста на строки
    const words = opts.cardNote.split(" ");
    let line = "";
    const lines: string[] = [];
    
    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > noteMaxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    
    // Центрирование блока заметки по вертикали
    const noteBlockHeight = lines.length * (noteFontSize + 10);
    const availableHeight = size.height - y - 100;
    const startY = y + Math.max(0, (availableHeight - noteBlockHeight) / 2);
    
    lines.forEach((l, i) => {
      ctx.fillText(l, size.width / 2, startY + i * (noteFontSize + 10));
    });
  }

  // Конвертация в Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png", 0.95);
  });
}
