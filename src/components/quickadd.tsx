"use client";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { MealEntry, MealType } from "../lib/types";
import { EntryModal, type EntryOpenOpts } from "./EntryModal";

interface QuickAddValue {
  open: (opts?: EntryOpenOpts) => void;
  openEdit: (entry: MealEntry, date?: string) => void;
}

const Ctx = createContext<QuickAddValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<EntryOpenOpts | null>(null);
  const [open, setOpen] = useState(false);

  const openModal = useCallback((o?: EntryOpenOpts) => {
    setOpts(o ?? {});
    setOpen(true);
  }, []);

  const openEdit = useCallback((entry: MealEntry) => {
    setOpts({ entry, meal: entry.meal, date: entry.date });
    setOpen(true);
  }, []);

  return (
    <Ctx.Provider value={{ open: openModal, openEdit }}>
      {children}
      <EntryModal open={open} onClose={() => setOpen(false)} opts={opts} />
    </Ctx.Provider>
  );
}

export function useQuickAdd(): QuickAddValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuickAdd вне QuickAddProvider");
  return ctx;
}

export type { MealType };
