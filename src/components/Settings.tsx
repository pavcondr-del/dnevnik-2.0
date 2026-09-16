import { useRef, useState } from "react";
import { useStore } from "../lib/store";
import type { Accent, Settings as SettingsType, Units } from "../lib/types";
import { downloadFile, todayKey } from "../lib/utils";
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Segmented,
  Toggle,
  useToast,
} from "./ui";
import {
  BellIcon,
  DownloadIcon,
  EyeOffIcon,
  MoonIcon,
  PaletteIcon,
  ResetIcon,
  ScaleIcon,
  SlidersIcon,
  UploadIcon,
} from "./icons";
import type { AppState } from "../lib/types";

const ACCENTS: { id: Accent; color: string; label: string }[] = [
  { id: "coral", color: "#ff6b6b", label: "Коралл" },
  { id: "teal", color: "#4ecdc4", label: "Бирюзовый" },
  { id: "violet", color: "#a78bfa", label: "Аметист" },
  { id: "green", color: "#7bc67e", label: "Зелёный" },
  { id: "blue", color: "#5b9dff", label: "Синий" },
  { id: "amber", color: "#ffb84d", label: "Янтарь" },
];

export default function Settings() {
  const {
    state,
    saveSettings,
    loadDemo,
    resetAll,
    importState,
  } = useStore();
  const toast = useToast();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const patch = (p: Partial<SettingsType>) =>
    saveSettings({ ...s, ...p });

  const patchReminders = (
    p: Partial<SettingsType["reminders"]>
  ) => saveSettings({ ...s, reminders: { ...s.reminders, ...p } });

  const enableNotifications = async (on: boolean) => {
    if (on && typeof Notification !== "undefined") {
      let perm = Notification.permission;
      if (perm === "default") {
        try {
          perm = await Notification.requestPermission();
        } catch {
          perm = "denied";
        }
      }
      if (perm !== "granted") {
        toast.push("Разрешите уведомления в браузере", "err");
        return;
      }
      patch({ notifications: true, reminders: { ...s.reminders, enabled: true } });
      toast.push("Уведомления включены");
      return;
    }
    patch({ notifications: on, reminders: { ...s.reminders, enabled: on } });
  };

  const testNotification = () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      toast.push("Сначала разрешите уведомления", "err");
      return;
    }
    new Notification("Гармония Рациона 🔔", {
      body: "Напоминания о приёмах пищи работают!",
    });
  };

  const exportBackup = () => {
    downloadFile(
      `kaloriyka-backup-${todayKey()}.json`,
      JSON.stringify(state, null, 2),
      "application/json;charset=utf-8"
    );
    toast.push("Резервная копия выгружена");
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as AppState;
      if (!Array.isArray(data.products) || !Array.isArray(data.entries)) {
        throw new Error("bad");
      }
      importState(data);
      toast.push("Данные импортированы");
    } catch {
      toast.push("Некорректный файл резервной копии", "err");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">Настройки</h1>

      {/* Единицы измерения */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <ScaleIcon size={18} /> Единицы измерения
        </h2>
        <p className="mb-3 text-sm text-mut">
          Применяются при вводе веса порций. Все данные хранятся в граммах.
        </p>
        <Segmented<Units>
          value={s.units}
          onChange={(v) => patch({ units: v })}
          options={[
            { value: "g", label: "Граммы (г)" },
            { value: "oz", label: "Унции (oz)" },
            { value: "cup", label: "Чашки" },
          ]}
        />
        {s.units === "cup" && (
          <p className="mt-2 text-xs text-faint">
            Чашка по умолчанию = 250 г. Для отдельных продуктов вес чашки
            задаётся в карточке продукта (крупы, напитки).
          </p>
        )}
      </Card>

      {/* Оформление */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <PaletteIcon size={18} /> Оформление
        </h2>
        <p className="mb-3 text-sm text-mut">Акцентный цвет интерфейса</p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => patch({ accent: a.id })}
              title={a.label}
              className="relative h-10 w-10 rounded-full transition active:scale-90"
              style={{ background: a.color }}
            >
              {s.accent === a.id && (
                <span className="absolute inset-0 grid place-items-center text-black/80">
                  ✓
                </span>
              )}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-faint">
                {a.label}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <MoonIcon size={16} /> Тема оформления
          </p>
          <Segmented
            value={s.theme}
            onChange={(v: "dark" | "amoled" | "light") => patch({ theme: v })}
            options={[
              { value: "light", label: "☀️ Светлая" },
              { value: "dark", label: "🌙 Классическая" },
              { value: "amoled", label: "⚫ AMOLED" },
            ]}
          />
        </div>
      </Card>

      {/* Уведомления */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <BellIcon size={18} /> Уведомления и напоминания
            </h2>
            <p className="mt-1 text-sm text-mut">
              Браузер пришлёт напоминание, если приём пищи не отмечен в
              дневник. Работают, пока приложение открыто (или установлено как
              PWA).
            </p>
          </div>
          <Toggle
            checked={s.notifications}
            onChange={enableNotifications}
            label="Уведомления"
          />
        </div>
        <div
          className={
            "mt-4 space-y-3 transition " +
            (s.notifications ? "" : "pointer-events-none opacity-40")
          }
        >
          <div className="flex items-center justify-between rounded-xl bg-elev p-3">
            <span className="text-sm">Напоминания включены</span>
            <Toggle
              checked={s.reminders.enabled}
              onChange={(on) => patchReminders({ enabled: on })}
              label="Напоминания"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TimeField
              label="🌅 Завтрак"
              value={s.reminders.breakfast}
              onChange={(v) => patchReminders({ breakfast: v })}
            />
            <TimeField
              label="🍲 Обед"
              value={s.reminders.lunch}
              onChange={(v) => patchReminders({ lunch: v })}
            />
            <TimeField
              label="🌙 Ужин"
              value={s.reminders.dinner}
              onChange={(v) => patchReminders({ dinner: v })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-elev p-3">
            <Toggle
              checked={s.reminders.snack}
              onChange={(on) => patchReminders({ snack: on })}
              label="Перекус"
            />
            <span className="text-sm">Напоминание о перекусе</span>
            <input
              type="time"
              className="input ml-auto w-32"
              value={s.reminders.snackTime}
              onChange={(e) => patchReminders({ snackTime: e.target.value })}
            />
          </div>
          <Button variant="outline" size="sm" onClick={testNotification}>
            🔔 Проверить уведомление
          </Button>
        </div>
      </Card>

      {/* Режим без цифр */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <EyeOffIcon size={18} /> Режим "Без цифр"
        </h2>
        <p className="mb-4 text-sm text-mut">
          Скрывает калории, БЖУ и другие числовые показатели. Подходит для тех, кто хочет питаться интуитивно или имеет расстройства пищевого поведения.
        </p>
        <Toggle
          checked={s.hideNumbers}
          onChange={(on) => patch({ hideNumbers: on })}
          label="Скрыть цифры"
        />
      </Card>

      {/* Язык */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <SlidersIcon size={18} /> Язык интерфейса
        </h2>
        <select
          className="input max-w-xs"
          value={s.language}
          onChange={(e) => {
            patch({ language: e.target.value });
          }}
        >
          <option value="ru">Русский</option>
          <option value="en" disabled>
            English (скоро)
          </option>
        </select>
      </Card>

      {/* Данные */}
      <Card>
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <UploadIcon size={18} /> Данные и хранение
        </h2>
        <p className="mb-4 text-sm text-mut">
          Все записи, фото и продукты хранятся локально в браузере (localStorage).
          Никакие данные не отправляются на сервер. Делайте резервные копии при
          очистке браузера.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm("Заполнить демо-данными за 20 дней? Текущие записи будут заменены.")) {
                loadDemo();
                toast.push("Демо-данные добавлены — загляните в Статистику");
              }
            }}
          >
            ✨ Демо-данные (20 дней)
          </Button>
          <Button variant="outline" size="sm" onClick={exportBackup}>
            <DownloadIcon size={15} /> Скачать копию (JSON)
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <UploadIcon size={15} /> Восстановить из файла
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            <ResetIcon size={15} /> Сбросить всё
          </Button>
        </div>
      </Card>

      {/* О приложении */}
      <Card>
        <h2 className="mb-2 font-semibold">О приложении</h2>
        <ul className="space-y-1.5 text-sm text-mut">
          <li>
            <Badge color="teal">PWA</Badge> Установите приложение: браузер →
            «Добавить на главный экран» / «Установить приложение».
          </li>
          <li>
            <Badge color="teal">Офлайн</Badge> После первой загрузки дневник
            работает без интернета.
          </li>
          <li>
            <Badge color="accent">v1.0</Badge> Гармония Рациона — счётчик калорий
            питания. Расчёт норм по формуле Миффлина — Сан-Жеора.
          </li>
        </ul>
      </Card>

      <ConfirmModal
        open={resetOpen}
        title="Сбросить все данные?"
        text="Все записи, продукты, рецепты и настройки будут удалены без возможности восстановления. Рекомендуем сначала скачать JSON-копию."
        confirmLabel="Сбросить"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetAll();
          toast.push("Все данные сброшены");
        }}
      />
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="time"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
