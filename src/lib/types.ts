export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "extra";
export type Sex = "male" | "female";
export type Goal = "lose" | "maintain" | "gain";
export type Activity =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very";
export type Units = "g" | "oz" | "cup";
export type Accent = "coral" | "teal" | "violet" | "green" | "blue" | "amber";

export interface Product {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  cupG?: number;
  brand?: string;
  barcode?: string;
  image?: string;
  custom?: boolean;
  favorite?: boolean;
}

export interface Ingredient {
  productId: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: Ingredient[];
  steps?: string;
  favorite?: boolean;
  custom?: boolean;
}

export type EntryKind = "product" | "recipe";

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  time: string; // HH:MM
  kind: EntryKind;
  refId?: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  photo?: string;
  note?: string;
}

export interface Note {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  tags: string[];
  createdAt: string; // ISO timestamp
  audio?: string; // base64 encoded audio
}

export interface DailyCheckin {
  date: string; // YYYY-MM-DD
  energy: number; // 1–5
  hunger: number; // 1–5
  mood: number; // 1–5
  flags: string[]; // "sport" | "sleep_ok" | "stress" | "sick"
}

export const CHECKIN_FLAGS = [
  { id: "sport", label: "Был спорт" },
  { id: "sleep_ok", label: "Выспался" },
  { id: "stress", label: "Стрессовый день" },
  { id: "sick", label: "Болел" },
] as const;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface WeightPoint {
  date: string;
  kg: number;
}

export interface ActivityEntry {
  id: string;
  date: string;
  label: string;
  minutes: number;
  kcal: number;
}

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  targetWeightKg?: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  customDeficitPercent?: number;
}

export interface ReminderSettings {
  enabled: boolean;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: boolean;
  snackTime: string;
}

export interface Settings {
  units: Units;
  accent: Accent;
  theme: "dark" | "amoled" | "light";
  language: string;
  notifications: boolean;
  reminders: ReminderSettings;
  hideNumbers: boolean;
}

export interface ChallengeDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: number;
  metric: "streak" | "calorieDays" | "proteinDays" | "loggingDays" | "uniqueProducts" | "stableWeightDays" | "distanceKm" | "protein100Days" | "noSugarDays" | "veggieDays" | "deficitDays" | "noOvereatDays" | "balancedMacroDays" | "noLateEatDays" | "fastDays" | "cheatMeals";
  unlockLevel?: number;
  periodDays: number;
}

export interface Article {
  id: string;
  emoji: string;
  category: string;
  title: string;
  minutes: number;
  paragraphs: string[];
}

export interface AppState {
  version: number;
  profile: Profile;
  settings: Settings;
  products: Product[];
  entries: MealEntry[];
  weights: WeightPoint[];
  recipes: Recipe[];
  activities: ActivityEntry[];
  joinedChallenges: string[];
  notes: Note[];
  checkins: DailyCheckin[];
  habits: Habit[];
  habitLogs: HabitLog[];
  lastBackup?: string; // ISO timestamp
}

export interface Totals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DayTargets {
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}
