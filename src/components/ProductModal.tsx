"use client";
import { useEffect, useState } from "react";
import { CATEGORIES } from "../lib/seed";
import { useStore } from "../lib/store";
import type { Product } from "../lib/types";
import { uid } from "../lib/utils";
import { Button, Modal, useToast } from "./ui";

const EMPTY: {
  name: string;
  category: string;
  brand: string;
  kcal: string;
  protein: string;
  fat: string;
  carbs: string;
  barcode: string;
} = {
  name: "",
  category: CATEGORIES[0],
  brand: "",
  kcal: "",
  protein: "",
  fat: "",
  carbs: "",
  barcode: "",
};

export function ProductModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Product | null;
}) {
  const { upsertProduct } = useStore();
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setF({
        name: editing.name,
        category: editing.category,
        brand: editing.brand ?? "",
        kcal: String(editing.kcal),
        protein: String(editing.protein),
        fat: String(editing.fat),
        carbs: String(editing.carbs),
        barcode: editing.barcode ?? "",
      });
      setFavorite(Boolean(editing.favorite));
    } else {
      setF(EMPTY);
      setFavorite(false);
    }
  }, [open, editing]);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    if (!f.name.trim()) {
      toast.push("Укажите название", "err");
      return;
    }

    if (!f.kcal.trim() || !f.protein.trim() || !f.fat.trim() || !f.carbs.trim()) {
      toast.push("Заполните все поля пищевой ценности", "err");
      return;
    }

    const num = (s: string) => {
      const n = Number(s.replace(",", "."));
      return isFinite(n) && n >= 0 ? n : 0;
    };

    const product: Product = {
      id: editing?.id ?? uid("pc"),
      name: f.name.trim(),
      category: f.category,
      brand: f.brand.trim() || undefined,
      barcode: f.barcode.trim() || undefined,
      kcal: num(f.kcal),
      protein: num(f.protein),
      fat: num(f.fat),
      carbs: num(f.carbs),
      custom: true,
      favorite,
    };

    upsertProduct(product);
    toast.push(editing ? "Продукт обновлён" : "Продукт добавлен");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Редактировать продукт" : "Новый продукт"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={save}>Сохранить</Button>
        </div>
      }
    >
      <div className="space-y-3.5">
        <div>
          <label className="label">Название *</label>
          <input
            className="input"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Например: протеиновый батончик"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Категория</label>
            <select
              className="input"
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Бренд (необязательно)</label>
            <input
              className="input"
              value={f.brand}
              onChange={(e) => set("brand", e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-xl bg-elev p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
            Пищевая ценность на 100 г
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="label">Ккал *</label>
              <input
                type="number"
                min={0}
                required
                className="input"
                value={f.kcal}
                onChange={(e) => set("kcal", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Белки *</label>
              <input
                type="number"
                min={0}
                step="0.1"
                required
                className="input"
                value={f.protein}
                onChange={(e) => set("protein", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Жиры *</label>
              <input
                type="number"
                min={0}
                step="0.1"
                required
                className="input"
                value={f.fat}
                onChange={(e) => set("fat", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Углев. *</label>
              <input
                type="number"
                min={0}
                step="0.1"
                required
                className="input"
                value={f.carbs}
                onChange={(e) => set("carbs", e.target.value)}
              />
            </div>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-mut">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Добавить в избранное
        </label>
      </div>
    </Modal>
  );
}
