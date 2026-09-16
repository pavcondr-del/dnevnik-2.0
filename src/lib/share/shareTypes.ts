export type ShareFormat = "card" | "text" | "html";
export type SharePeriod = "week" | "twoWeeks" | "month" | "custom";
export type ShareCardStyle = "minimal" | "sport" | "warm" | "noNumbers";
export type ShareCardSize = "square" | "story" | "wide";

export interface ShareOptions {
  format: ShareFormat;
  period: SharePeriod;
  dateFrom: string;
  dateTo: string;
  includeNotes: boolean;
  includeCheckins: boolean;
  includeWeight: boolean;
  includeMacros: boolean;
  authorName?: string;
  cardStyle: ShareCardStyle;
  cardSize: ShareCardSize;
  anonymize: boolean;
  comment?: string;
}

export interface ShareSnapshot {
  dateFrom: string;
  dateTo: string;
  days: number;
  profile: {
    name?: string;
    age?: number;
    sex?: "male" | "female";
    heightCm?: number;
  };
  weight: {
    start: number | null;
    end: number | null;
    deltaKg: number | null;
    min: number | null;
    max: number | null;
    trend: { date: string; kg: number }[];
  };
  calories: {
    target: number;
    average: number;
    min: number;
    max: number;
    inRangeDays: number;
    totalDays: number;
    series: { date: string; kcal: number; isToday: boolean }[];
  };
  macros: {
    protein: { avg: number; target: number; daysInNorm: number };
    fat: { avg: number; target: number; daysInNorm: number };
    carbs: { avg: number; target: number; daysInNorm: number };
  };
  activity: {
    totalBurned: number;
    totalMinutes: number;
    topTypes: { label: string; minutes: number; kcal: number }[];
  };
  streaks: {
    current: number;
    best: number;
    loggingDays: number;
  };
  meals: {
    breakfast: { avgKcal: number; count: number };
    lunch: { avgKcal: number; count: number };
    dinner: { avgKcal: number; count: number };
    snack: { avgKcal: number; count: number };
    extra: { avgKcal: number; count: number };
  };
  topProducts: { name: string; count: number }[];
  categories: { name: string; percent: number }[];
  checkins?: {
    avgEnergy: number;
    avgHunger: number;
    avgMood: number;
    flagsCount: Record<string, number>;
  };
  notes?: { date: string; text: string; tags: string[] }[];
}
