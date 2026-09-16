import type { MealType, Units } from "./types";

export const cn = (
  ...parts: Array<string | false | null | undefined>
): string => parts.filter(Boolean).join(" ");

export const uid = (prefix = "id"): string =>
  prefix +
  Math.random().toString(36).slice(2, 8) +
  Date.now().toString(36).slice(-4);

const pad = (n: number) => String(n).padStart(2, "0");

export const toKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayKey = (): string => toKey(new Date());

export const addDaysKey = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toKey(date);
};

export const parseKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const WEEKDAYS = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];

export const ruDate = (key: string): string => {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const ruDateLong = (key: string): string => {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const weekdayShort = (key: string): string => {
  const names = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  return names[parseKey(key).getDay()];
};

export const nowTime = (): string => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const MEAL_META: Record<
  MealType,
  { label: string; emoji: string; defaultTime: string }
> = {
  breakfast: { label: "Завтрак", emoji: "🌅", defaultTime: "08:00" },
  lunch: { label: "Обед", emoji: "🍲", defaultTime: "13:00" },
  dinner: { label: "Ужин", emoji: "🌙", defaultTime: "19:00" },
  snack: { label: "Перекус", emoji: "🍎", defaultTime: "16:00" },
  extra: { label: "Дополнительно", emoji: "🍽️", defaultTime: "21:00" },
};

export const MEAL_ORDER: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "extra",
];

export const fmt = (n: number, digits = 0): string => {
  const v = Math.round(n * 10 ** digits) / 10 ** digits;
  return v.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/* ---------- Единицы измерения ---------- */
export const OZ_G = 28.3495;
export const DEFAULT_CUP_G = 250;

export const UNIT_LABEL: Record<Units, string> = {
  g: "г",
  oz: "унция",
  cup: "чашка",
};

export function gramsFromDisplay(
  value: number,
  units: Units,
  cupG = DEFAULT_CUP_G
): number {
  if (units === "oz") return value * OZ_G;
  if (units === "cup") return value * cupG;
  return value;
}

export function displayFromGrams(
  grams: number,
  units: Units,
  cupG = DEFAULT_CUP_G
): number {
  if (units === "oz") return grams / OZ_G;
  if (units === "cup") return grams / cupG;
  return grams;
}

/* ---------- Экспорт ---------- */
export function downloadFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
): void {
  // Добавляем BOM только для CSV (для корректного отображения в Excel)
  // JSON не должен содержать BOM
  const prefix = mime.includes("json") ? "" : "\uFEFF";
  const blob = new Blob([prefix + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCSV(rows: Array<Array<string | number>>): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell).replace(/"/g, '""');
          return /[;\n"]/.test(s) ? `"${s}"` : s;
        })
        .join(";")
    )
    .join("\n");
}

export function toMarkdown(
  entries: Array<{
    date: string;
    meal: MealType;
    time: string;
    name: string;
    grams: number;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  }>,
  notes?: Array<{ date: string; text: string }>
): string {
  // Группируем записи по дате
  const grouped = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Группируем заметки по дате
  const notesByDate = notes?.reduce((acc, note) => {
    if (!acc[note.date]) acc[note.date] = [];
    acc[note.date].push(note);
    return acc;
  }, {} as Record<string, typeof notes>) || {};

  const dates = Object.keys(grouped).sort();
  const lines: string[] = [];

  lines.push("# Дневник питания\n");
  lines.push(`Экспортировано: ${new Date().toLocaleString("ru-RU")}\n`);
  lines.push("---\n");

  for (const date of dates) {
    const dayEntries = grouped[date];
    const dayNotes = notesByDate[date] || [];

    // Заголовок дня
    lines.push(`## ${ruDateLong(date)}\n`);

    // Группируем по приёмам пищи
    const byMeal = dayEntries.reduce((acc, entry) => {
      if (!acc[entry.meal]) acc[entry.meal] = [];
      acc[entry.meal].push(entry);
      return acc;
    }, {} as Record<MealType, typeof dayEntries>);

    let totalKcal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    // Выводим приёмы пищи в порядке MEAL_ORDER
    for (const meal of MEAL_ORDER) {
      const mealEntries = byMeal[meal];
      if (!mealEntries || mealEntries.length === 0) continue;

      const meta = MEAL_META[meal];
      lines.push(`### ${meta.emoji} ${meta.label}\n`);
      lines.push("| Время | Продукт | Вес | Ккал | Б | Ж | У |");
      lines.push("|-------|---------|-----|------|---|---|---|");

      for (const entry of mealEntries) {
        lines.push(
          `| ${entry.time} | ${entry.name} | ${fmt(entry.grams)} г | ${fmt(entry.kcal)} | ${fmt(entry.protein, 1)} | ${fmt(entry.fat, 1)} | ${fmt(entry.carbs, 1)} |`
        );
        totalKcal += entry.kcal;
        totalProtein += entry.protein;
        totalFat += entry.fat;
        totalCarbs += entry.carbs;
      }
      lines.push("");
    }

    // Итоги за день
    lines.push("**Итого за день:**\n");
    lines.push(`- Калории: **${fmt(totalKcal)}** ккал`);
    lines.push(`- Белки: **${fmt(totalProtein, 1)}** г`);
    lines.push(`- Жиры: **${fmt(totalFat, 1)}** г`);
    lines.push(`- Углеводы: **${fmt(totalCarbs, 1)}** г\n`);

    // Заметки за день
    if (dayNotes.length > 0) {
      lines.push("**Заметки:**\n");
      for (const note of dayNotes) {
        lines.push(`> ${note.text}\n`);
      }
    }

    lines.push("---\n");
  }

  return lines.join("\n");
}

/* ---------- Изображения ---------- */
export async function compressImage(
  file: File,
  maxSize = 900,
  quality = 0.7
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/* ---------- Поделиться ---------- */
export async function shareText(title: string, text: string): Promise<void> {
  const nav = navigator as Navigator & {
    share?: (data: { title?: string; text?: string }) => Promise<void>;
  };
  
  if (nav.share) {
    try {
      await nav.share({ title, text });
      return;
    } catch {
      /* пользователь отменил — копируем */
    }
  }
  
  await navigator.clipboard.writeText(text);
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));
