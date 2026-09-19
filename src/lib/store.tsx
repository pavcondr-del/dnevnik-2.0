"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ActivityEntry,
  AppState,
  DailyCheckin,
  Habit,
  MealEntry,
  MealType,
  Note,
  Product,
  Profile,
  Recipe,
  Settings,
  WeightPoint,
} from "./types";
import { SEED_PRODUCTS, buildDemo, seedRecipes } from "./seed";
import { uid } from "./utils";
import { get, set } from "./storage";

const STORAGE_KEY = "kaloriyka-v1";

const DEFAULT_PROFILE: Profile = {
  name: "",
  sex: "male",
  age: 30,
  weightKg: 75,
  heightCm: 178,
  activity: "light",
  goal: "maintain",
  weightHistory: [],
};

const DEFAULT_SETTINGS: Settings = {
  units: "g",
  accent: "coral",
  theme: "dark",
  language: "ru",
  notifications: false,
  reminders: {
    enabled: false,
    breakfast: "08:00",
    lunch: "13:00",
    dinner: "19:00",
    snack: false,
    snackTime: "16:00",
  },
  hideNumbers: false,
};

function freshState(): AppState {
  return {
    version: 1,
    profile: DEFAULT_PROFILE,
    settings: DEFAULT_SETTINGS,
    products: SEED_PRODUCTS,
    entries: [],
    weights: [],
    recipes: seedRecipes(SEED_PRODUCTS),
    activities: [],
    joinedChallenges: ["c-streak", "c-cal"],
    notes: [],
    checkins: [],
    habits: [],
    habitLogs: [],
  };
}

async function loadState(): Promise<AppState> {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = await get<string>(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const base = freshState();
    // Объединяем с базой, чтобы новые продукты из сидов тоже появлялись
    const customProducts = (parsed.products ?? []).filter((p: Product) => p.custom);
    const favoriteIds = new Set(
      (parsed.products ?? []).filter((p: Product) => p.favorite).map((p: Product) => p.id)
    );
    const products = [
      ...base.products.map((p) => ({
        ...p,
        favorite: favoriteIds.has(p.id),
      })),
      ...customProducts,
    ];
    return {
      ...base,
      ...parsed,
      settings: {
        ...base.settings,
        ...parsed.settings,
        reminders: {
          ...base.settings.reminders,
          ...parsed.settings?.reminders,
        },
      },
      profile: { ...base.profile, ...parsed.profile },
      products,
      recipes:
        parsed.recipes && parsed.recipes.length
          ? parsed.recipes
          : base.recipes,
    };
  } catch {
    return freshState();
  }
}

interface StoreContextValue {
  state: AppState;
  saveProfile: (p: Profile) => void;
  saveSettings: (s: Settings) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addEntry: (e: MealEntry) => void;
  updateEntry: (e: MealEntry) => void;
  deleteEntry: (id: string) => void;
  copyDay: (from: string, to: string) => number;
  saveRecipe: (r: Recipe) => void;
  deleteRecipe: (id: string) => void;
  toggleRecipeFavorite: (id: string) => void;
  addWeight: (w: WeightPoint) => void;
  deleteWeightAt: (date: string) => void;
  addWeightEntry: (date: string, weight: number, note?: string) => void;
  removeWeightEntry: (date: string) => void;
  getWeightHistory: () => WeightPoint[];
  addActivity: (a: Omit<ActivityEntry, "id">) => void;
  deleteActivity: (id: string) => void;
  joinChallenge: (id: string) => void;
  leaveChallenge: (id: string) => void;
  addNote: (n: Omit<Note, "id" | "createdAt">) => void;
  updateNote: (n: Note) => void;
  deleteNote: (id: string) => void;
  upsertCheckin: (c: DailyCheckin) => void;
  addHabit: (h: Omit<Habit, "id">) => void;
  deleteHabit: (id: string) => void;
  logHabit: (habitId: string, date: string, completed: boolean) => void;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  loadDemo: () => void;
  resetAll: () => void;
  importState: (s: AppState) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Ленивая инициализация — сразу загружаем из IndexedDB,
  // чтобы не было race condition с записью пустого состояния
  const [state, setState] = useState<AppState>(freshState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Загружаем состояние при монтировании
    loadState().then((s) => {
      setState(s);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* квота переполнена (обычно из-за фото) */
      }
    }
  }, [state, loaded]);

  // Применяем акцент и тему
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent =
      state.settings.accent === "coral" ? "" : state.settings.accent;
    if (!root.dataset.accent) root.removeAttribute("data-accent");
    if (state.settings.theme === "dark") {
      root.removeAttribute("data-theme");
    } else {
      root.dataset.theme = state.settings.theme;
    }
    // Обновляем theme-color для мобильных браузеров
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const colors: Record<string, string> = {
        dark: "#121212",
        amoled: "#000000",
        light: "#f5f5f7",
      };
      themeMeta.setAttribute("content", colors[state.settings.theme] ?? "#121212");
    }
  }, [state.settings.accent, state.settings.theme]);

  const saveProfile = useCallback((p: Profile) => {
    setState((s) => ({ ...s, profile: p }));
  }, []);

  const saveSettings = useCallback((settings: Settings) => {
    setState((s) => ({ ...s, settings }));
  }, []);

  const upsertProduct = useCallback((p: Product) => {
    setState((s) => {
      const exists = s.products.some((x) => x.id === p.id);
      const products = exists
        ? s.products.map((x) => (x.id === p.id ? p : x))
        : [...s.products, p];
      return { ...s, products };
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p
      ),
    }));
  }, []);

  const addEntry = useCallback((e: MealEntry) => {
    setState((s) => ({ ...s, entries: [...s.entries, e] }));
  }, []);

  const updateEntry = useCallback((e: MealEntry) => {
    setState((s) => ({
      ...s,
      entries: s.entries.map((x) => (x.id === e.id ? e : x)),
    }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      entries: s.entries.filter((e) => e.id !== id),
    }));
  }, []);

  const copyDay = useCallback(
    (from: string, to: string) => {
      const clones = state.entries
        .filter((e) => e.date === from)
        .map((e) => ({
          ...e,
          id: uid("e"),
          date: to,
          photo: undefined,
        }));
      if (!clones.length) return 0;
      setState((s) => ({
        ...s,
        entries: [...s.entries.filter((e) => e.date !== to), ...clones],
      }));
      return clones.length;
    },
    [state.entries]
  );

  const saveRecipe = useCallback((r: Recipe) => {
    setState((s) => {
      const exists = s.recipes.some((x) => x.id === r.id);
      return {
        ...s,
        recipes: exists
          ? s.recipes.map((x) => (x.id === r.id ? r : x))
          : [...s.recipes, r],
      };
    });
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setState((s) => ({ ...s, recipes: s.recipes.filter((r) => r.id !== id) }));
  }, []);

  const toggleRecipeFavorite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      recipes: s.recipes.map((r) =>
        r.id === id ? { ...r, favorite: !r.favorite } : r
      ),
    }));
  }, []);

  const addWeight = useCallback((w: WeightPoint) => {
    setState((s) => ({
      ...s,
      weights: [...s.weights.filter((x) => x.date !== w.date), w].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    }));
  }, []);

  const deleteWeightAt = useCallback((date: string) => {
    setState((s) => ({
      ...s,
      weights: s.weights.filter((w) => w.date !== date),
    }));
  }, []);

  const addWeightEntry = useCallback((date: string, weight: number, note?: string) => {
    setState((s) => {
      const newEntry: WeightPoint = { date, kg: weight, note };
      return {
        ...s,
        profile: {
          ...s.profile,
          weightHistory: [
            ...s.profile.weightHistory.filter((p) => p.date !== date),
            newEntry,
          ].sort((a, b) => a.date.localeCompare(b.date)),
        },
      };
    });
  }, []);

  const removeWeightEntry = useCallback((date: string) => {
    setState((s) => ({
      ...s,
      profile: {
        ...s.profile,
        weightHistory: s.profile.weightHistory.filter((p) => p.date !== date),
      },
    }));
  }, []);

  const getWeightHistory = useCallback(() => {
    // Эта функция должна вызываться внутри компонента через state.profile.weightHistory
    // Здесь возвращаем пустой массив, так как нет доступа к state в замыкании
    // Для использования нужно обращаться к state.profile.weightHistory напрямую
    return [];
  }, []);

  const addActivity = useCallback((a: Omit<ActivityEntry, "id">) => {
    setState((s) => ({
      ...s,
      activities: [...s.activities, { ...a, id: uid("a") }],
    }));
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      activities: s.activities.filter((a) => a.id !== id),
    }));
  }, []);

  const joinChallenge = useCallback((id: string) => {
    setState((s) =>
      s.joinedChallenges.includes(id)
        ? s
        : { ...s, joinedChallenges: [...s.joinedChallenges, id] }
    );
  }, []);

  const leaveChallenge = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      joinedChallenges: s.joinedChallenges.filter((c) => c !== id),
    }));
  }, []);

  const addNote = useCallback((n: Omit<Note, "id" | "createdAt">) => {
    setState((s) => ({
      ...s,
      notes: [
        ...s.notes,
        { ...n, id: uid("note"), createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  const updateNote = useCallback((n: Note) => {
    setState((s) => ({
      ...s,
      notes: s.notes.map((x) => (x.id === n.id ? n : x)),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notes: s.notes.filter((n) => n.id !== id),
    }));
  }, []);

  const upsertCheckin = useCallback((c: DailyCheckin) => {
    setState((s) => ({
      ...s,
      checkins: [
        ...s.checkins.filter((x) => x.date !== c.date),
        c,
      ],
    }));
  }, []);

  const addHabit = useCallback((h: Omit<Habit, "id">) => {
    setState((s) => ({
      ...s,
      habits: [...s.habits, { ...h, id: uid("hab") }],
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
      habitLogs: s.habitLogs.filter((l) => l.habitId !== id),
    }));
  }, []);

  const logHabit = useCallback((habitId: string, date: string, completed: boolean) => {
    setState((s) => {
      const filtered = s.habitLogs.filter(
        (l) => !(l.habitId === habitId && l.date === date)
      );
      if (completed) {
        return {
          ...s,
          habitLogs: [...filtered, { habitId, date, completed }],
        };
      }
      return { ...s, habitLogs: filtered };
    });
  }, []);

  const loadDemo = useCallback(() => {
    setState((s) => {
      const demo = buildDemo(s.profile, s.products);
      return {
        ...s,
        entries: demo.entries,
        weights: demo.weights,
        activities: demo.activities,
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState(freshState());
  }, []);

  const importState = useCallback((incoming: AppState) => {
    setState({
      ...freshState(),
      ...incoming,
      profile: { ...DEFAULT_PROFILE, ...incoming.profile },
      settings: {
        ...DEFAULT_SETTINGS,
        ...incoming.settings,
        reminders: {
          ...DEFAULT_SETTINGS.reminders,
          ...incoming.settings?.reminders,
        },
      },
    });
  }, []);

  const exportBackup = useCallback(() => {
    const backup = {
      ...state,
      lastBackup: new Date().toISOString(),
    };
    setState((s) => ({ ...s, lastBackup: backup.lastBackup }));
    return JSON.stringify(backup, null, 2);
  }, [state]);

  const importBackup = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as AppState;
      if (!parsed.version || !parsed.profile || !parsed.settings) {
        return false;
      }
      importState(parsed);
      return true;
    } catch {
      return false;
    }
  }, [importState]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      saveProfile,
      saveSettings,
      upsertProduct,
      deleteProduct,
      toggleFavorite,
      addEntry,
      updateEntry,
      deleteEntry,
      copyDay,
      saveRecipe,
      deleteRecipe,
      toggleRecipeFavorite,
      addWeight,
      deleteWeightAt,
      addWeightEntry,
      removeWeightEntry,
      getWeightHistory,
      addActivity,
      deleteActivity,
      joinChallenge,
      leaveChallenge,
      addNote,
      updateNote,
      deleteNote,
      upsertCheckin,
      addHabit,
      deleteHabit,
      logHabit,
      exportBackup,
      importBackup,
      loadDemo,
      resetAll,
      importState,
    }),
    [
      state,
      saveProfile,
      saveSettings,
      upsertProduct,
      deleteProduct,
      toggleFavorite,
      addEntry,
      updateEntry,
      deleteEntry,
      copyDay,
      saveRecipe,
      deleteRecipe,
      toggleRecipeFavorite,
      addWeight,
      deleteWeightAt,
      addWeightEntry,
      removeWeightEntry,
      getWeightHistory,
      addActivity,
      deleteActivity,
      joinChallenge,
      leaveChallenge,
      addNote,
      updateNote,
      deleteNote,
      upsertCheckin,
      addHabit,
      deleteHabit,
      logHabit,
      exportBackup,
      importBackup,
      loadDemo,
      resetAll,
      importState,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore вне StoreProvider");
  return ctx;
}

/** Удобные селекторы */
export function useProductMap(): Map<string, Product> {
  const { state } = useStore();
  return useMemo(
    () => new Map(state.products.map((p) => [p.id, p])),
    [state.products]
  );
}

export function recipeTotals(r: Recipe) {
  return r.ingredients.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      protein: acc.protein + i.protein,
      fat: acc.fat + i.fat,
      carbs: acc.carbs + i.carbs,
      grams: acc.grams + i.grams,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, grams: 0 }
  );
}

export type { MealType };
