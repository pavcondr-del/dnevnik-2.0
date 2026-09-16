"use client";
import { useEffect } from "react";
import { useStore } from "../lib/store";
import { MEAL_META, todayKey } from "../lib/utils";
import type { MealType } from "../lib/types";

/** Напоминания о приёмах пищи (работают, пока приложение открыто) */
export function Reminders() {
  const { state } = useStore();
  const settings = state.settings;

  useEffect(() => {
    if (!settings.reminders.enabled) return;

    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      const slots: Array<{ meal: MealType; time: string; on: boolean }> = [
        { meal: "breakfast", time: settings.reminders.breakfast, on: true },
        { meal: "lunch", time: settings.reminders.lunch, on: true },
        { meal: "dinner", time: settings.reminders.dinner, on: true },
        { meal: "snack", time: settings.reminders.snackTime, on: settings.reminders.snack },
      ];

      for (const slot of slots) {
        if (!slot.on) continue;

        const [h, m] = slot.time.split(":").map(Number);
        const [ch, cm] = hhmm.split(":").map(Number);
        const diff = (ch * 60 + cm) - (h * 60 + m);

        if (diff < 0 || diff > 45) continue;

        const flag = `rem-${todayKey()}-${slot.meal}`;
        if (window.localStorage.getItem(flag)) continue;

        const hasMeal = state.entries.some(
          (e) => e.date === todayKey() && e.meal === slot.meal
        );

        if (hasMeal) {
          window.localStorage.setItem(flag, "1");
          continue;
        }

        window.localStorage.setItem(flag, "1");

        const title = `Время приёма пищи — ${MEAL_META[slot.meal].label}`;
        const body = "Не забудьте добавить запись в дневник питания 🥗";

        const perm =
          typeof Notification !== "undefined"
            ? Notification.permission
            : "denied";

        if (settings.notifications && perm === "granted") {
          try {
            new Notification(title, {
              body,
            });
          } catch {
            /* игнор */
          }
        }
      }
    };

    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [settings.reminders, settings.notifications, state.entries]);

  return null;
}
