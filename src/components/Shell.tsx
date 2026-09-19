"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { useQuickAdd } from "./quickadd";
import {
  BookIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ChefIcon,
  DatabaseIcon,
  DiaryIcon,
  DropIcon,
  FlameIcon,
  FoodIcon,
  HomeIcon,
  PlusIcon,
  ShareIcon,
  SlidersIcon,
  TrendingDownIcon,
  TrophyIcon,
  UserIcon,
  XIcon,
} from "./icons";

import type { Page } from "../lib/navigation";

interface NavItem {
  href: Page;
  label: string;
  icon: (p: { size?: number; className?: string }) => ReactNode;
}

const MAIN_NAV: NavItem[] = [
  { href: "dashboard", label: "Главная", icon: HomeIcon },
  { href: "diary", label: "Дневник", icon: DiaryIcon },
  { href: "products", label: "Продукты", icon: FoodIcon },
  { href: "recipes", label: "Рецепты", icon: ChefIcon },
  { href: "stats", label: "Статистика", icon: ChartIcon },
];

const EXTRA_NAV: NavItem[] = [
  { href: "calculators", label: "Калькуляторы", icon: DropIcon },
  { href: "calorieCalculator", label: "Расход калорий", icon: FlameIcon },
  { href: "weightProjection", label: "Прогноз веса", icon: TrendingDownIcon },
  { href: "simulator", label: "Симулятор", icon: TrendingDownIcon },
  { href: "notes", label: "Заметки", icon: BookIcon },
  { href: "habits", label: "Привычки", icon: CheckIcon },
  { href: "backup", label: "Резервные копии", icon: DatabaseIcon },
  { href: "share", label: "Поделиться", icon: ShareIcon },
  { href: "challenges", label: "Челленджи", icon: TrophyIcon },
  { href: "articles", label: "Статьи и советы", icon: BookIcon },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "dashboard", label: "Главная", icon: HomeIcon },
  { href: "diary", label: "Дневник", icon: DiaryIcon },
  { href: "stats", label: "Статистика", icon: ChartIcon },
];

interface ShellProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-lg font-bold tracking-tight">
        Гармония <span className="text-accent">Рациона</span>
      </span>
    </div>
  );
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
        active
          ? "bg-accent-soft text-accent"
          : "text-mut hover:bg-elev hover:text-txt"
      )}
    >
      <Icon size={19} className={cn(active ? "opacity-100" : "opacity-70")} />
      {item.label}
    </button>
  );
}

function MobileLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onNavigate}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
        active ? "text-accent" : "text-mut"
      )}
    >
      <Icon size={22} className={active ? "opacity-100" : "opacity-70"} />
      {item.label}
    </button>
  );
}

export function Shell({ children, currentPage, onNavigate }: ShellProps) {
  const quick = useQuickAdd();
  const [moreOpen, setMoreOpen] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [currentPage]);

  return (
    <div className="min-h-screen">
      {/* Сайдбар (десктоп) */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface md:flex">
        <div className="px-5 pb-4 pt-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Дневник
          </p>
          {MAIN_NAV.map((i) => (
            <NavLink
              key={i.href}
              item={i}
              active={currentPage === i.href}
              onNavigate={() => onNavigate(i.href)}
            />
          ))}
          <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-faint">
            Ещё
          </p>
          {EXTRA_NAV.map((i) => (
            <NavLink
              key={i.href}
              item={i}
              active={currentPage === i.href}
              onNavigate={() => onNavigate(i.href)}
            />
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <NavLink
            item={{ href: "profile", label: "Профиль", icon: UserIcon }}
            active={currentPage === "profile"}
            onNavigate={() => onNavigate("profile")}
          />
          <NavLink
            item={{ href: "settings", label: "Настройки", icon: SlidersIcon }}
            active={currentPage === "settings"}
            onNavigate={() => onNavigate("settings")}
          />
        </div>
      </aside>

      {/* Основная область */}
      <div className="md:pl-60">
        {/* Мобильная шапка */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-md md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            {!online && (
              <span className="mr-1 rounded-full bg-warn/15 px-2 py-1 text-[11px] font-medium text-warn">
                Нет сети
              </span>
            )}
            <button
              onClick={() => quick.open()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-black transition active:scale-95"
              aria-label="Добавить еду"
            >
              <PlusIcon size={20} />
            </button>
          </div>
        </header>

        {/* Десктоп-статус */}
        {!online && (
          <div className="no-print hidden border-b border-warn/30 bg-warn/10 px-6 py-1.5 text-center text-xs text-warn md:block">
            Нет сети — данные сохраняются на устройстве
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-14 md:pt-8">
          {children}
        </main>
      </div>

      {/* Нижняя навигация (мобильные) */}
      <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 items-center px-2">
          {BOTTOM_NAV.slice(0, 2).map((i) => (
            <MobileLink
              key={i.href}
              item={i}
              active={currentPage === i.href}
              onNavigate={() => onNavigate(i.href)}
            />
          ))}
          <div className="flex justify-center">
            <button
              onClick={() => quick.open()}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-[0_8px_20px_-6px_var(--color-accent)] transition active:scale-95"
              aria-label="Быстро добавить"
            >
              <PlusIcon size={26} />
            </button>
          </div>
          <MobileLink
            item={BOTTOM_NAV[2]}
            active={currentPage === "stats"}
            onNavigate={() => onNavigate("stats")}
          />
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-mut"
          >
            <span className="grid h-6 w-6 place-items-center">
              <span className="grid grid-cols-2 gap-[3px]">
                <span className="h-[5px] w-[5px] rounded-full bg-current" />
                <span className="h-[5px] w-[5px] rounded-full bg-current" />
                <span className="h-[5px] w-[5px] rounded-full bg-current" />
                <span className="h-[5px] w-[5px] rounded-full bg-current" />
              </span>
            </span>
            Ещё
          </button>
        </div>
      </nav>

      {/* Шторка «Ещё» */}
      {moreOpen && (
        <div
          className="anim-fade fixed inset-0 z-[60] bg-black/60 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="anim-slide absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Все разделы</h2>
              <button className="icon-btn" onClick={() => setMoreOpen(false)}>
                <XIcon size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[...MAIN_NAV.slice(2), ...EXTRA_NAV].map((i) => {
                const Icon = i.icon;
                return (
                  <button
                    key={i.href}
                    onClick={() => onNavigate(i.href)}
                    className="flex flex-col items-center gap-2 rounded-xl bg-elev p-3.5 text-center text-[12px] font-medium text-mut transition active:scale-95"
                  >
                    <Icon size={22} className="text-txt" />
                    {i.label}
                  </button>
                );
              })}
              <button
                onClick={() => onNavigate("profile")}
                className="flex flex-col items-center gap-2 rounded-xl bg-elev p-3.5 text-center text-[12px] font-medium text-mut"
              >
                <UserIcon size={22} className="text-txt" />
                Профиль
              </button>
              <button
                onClick={() => onNavigate("settings")}
                className="flex flex-col items-center gap-2 rounded-xl bg-elev p-3.5 text-center text-[12px] font-medium text-mut"
              >
                <SlidersIcon size={22} className="text-txt" />
                Настройки
              </button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-faint">
              <CalendarIcon size={12} /> Данные хранятся локально на устройстве
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
