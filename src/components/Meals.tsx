"use client";
import { useState } from "react";
import { useStore } from "../lib/store";
import type { MealEntry, MealType } from "../lib/types";
import { roundTotals, sumEntries } from "../lib/nutrition";
import { MEAL_META, fmt } from "../lib/utils";
import { useQuickAdd } from "./quickadd";
import { ConfirmModal } from "./ui";
import { useToast } from "./ui";
import { useHideNumbers } from "../lib/useHideNumbers";
import { PencilIcon, PlusIcon, TrashIcon } from "./icons";

export function MealGroup({
  date,
  meal,
  entries,
}: {
  date: string;
  meal: MealType;
  entries: MealEntry[];
}) {
  const { deleteEntry } = useStore();
  const quick = useQuickAdd();
  const toast = useToast();
  const hideNumbers = useHideNumbers();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const meta = MEAL_META[meal];
  const totals = roundTotals(sumEntries(entries));

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-elev text-lg">
            {meta.emoji}
          </span>
          <div>
            <h3 className="text-[15px] font-semibold leading-tight">
              {meta.label}
            </h3>
            <p className="text-xs text-faint">
              {entries.length
                ? hideNumbers
                  ? "••• ккал"
                  : `${fmt(totals.kcal)} ккал · Б ${fmt(totals.protein, 1)} · Ж ${fmt(
                      totals.fat,
                      1
                    )} · У ${fmt(totals.carbs, 1)}`
                : "Нет записей"}
            </p>
          </div>
        </div>
        <button
          onClick={() => quick.open({ date, meal })}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent transition hover:bg-accent-line/50 active:scale-95"
          aria-label={`Добавить: ${meta.label}`}
        >
          <PlusIcon size={18} />
        </button>
      </header>

      {entries.length === 0 ? (
        <button
          onClick={() => quick.open({ date, meal })}
          className="w-full rounded-xl border border-dashed border-line py-4 text-sm text-mut transition hover:border-accent-line hover:text-accent"
        >
          + Добавить приём пищи
        </button>
      ) : (
        <ul className="space-y-2">
          {entries
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((e) => (
              <li
                key={e.id}
                className="group flex items-center gap-3 rounded-xl bg-elev/60 p-2.5"
              >
                {e.photo ? (
                  <img
                    src={e.photo}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elev text-base">
                    {e.kind === "recipe" ? "👨‍🍳" : "🍽️"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-faint">
                    {e.time} · {fmt(e.grams)} г ·{" "}
                    {hideNumbers ? (
                      <span className="text-faint">•••</span>
                    ) : (
                      <>
                        <span className="text-teal">Б {fmt(e.protein, 1)}</span>{" "}
                        <span className="text-warn">Ж {fmt(e.fat, 1)}</span>{" "}
                        <span className="text-bad">У {fmt(e.carbs, 1)}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {hideNumbers ? "•••" : fmt(e.kcal)}
                  <span className="ml-0.5 text-[10px] font-normal text-faint">
                    ккал
                  </span>
                </span>
                <div className="flex shrink-0 items-center">
                  <button
                    className="icon-btn h-8 w-8"
                    onClick={() => quick.openEdit(e)}
                    aria-label="Редактировать"
                  >
                    <PencilIcon size={15} />
                  </button>
                  <button
                    className="icon-btn h-8 w-8 hover:text-bad!"
                    onClick={() => setConfirmId(e.id)}
                    aria-label="Удалить"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Удалить запись?"
        text="Это действие нельзя отменить."
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) {
            deleteEntry(confirmId);
            toast.push("Запись удалена");
          }
        }}
      />
    </section>
  );
}
