"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { MealEntry, MealType, Product, Recipe } from "../lib/types";
import { scaleNutrition, round1, roundTotals, recipeTotals } from "../lib/nutrition";
import {
  MEAL_META,
  MEAL_ORDER,
  UNIT_LABEL,
  compressImage,
  displayFromGrams,
  fmt,
  gramsFromDisplay,
  nowTime,
  todayKey,
  uid,
} from "../lib/utils";
import { Button, Modal, Segmented, useToast } from "./ui";
import { CameraIcon, ImageIcon, SearchIcon, StarIcon, XIcon } from "./icons";

export interface EntryOpenOpts {
  date?: string;
  meal?: MealType;
  productId?: string;
  recipeId?: string;
  entry?: MealEntry;
}

export function EntryModal({
  open,
  onClose,
  opts,
}: {
  open: boolean;
  onClose: () => void;
  opts: EntryOpenOpts | null;
}) {
  const { state, addEntry, updateEntry } = useStore();
  const toast = useToast();

  const [meal, setMeal] = useState<MealType>("breakfast");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState(nowTime());
  const [tab, setTab] = useState<"product" | "recipe">("product");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [amount, setAmount] = useState("100");
  const [servings, setServings] = useState("1");
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open || !opts) return;
    const e = opts.entry;
    setMeal(opts.meal ?? e?.meal ?? "breakfast");
    setDate(opts.date ?? e?.date ?? todayKey());
    setTime(e?.time ?? nowTime());
    setPhoto(e?.photo);
    setQuery("");

    if (e) {
      setTab(e.kind);
      if (e.kind === "recipe") {
        const r = state.recipes.find((x) => x.id === e.refId) ?? null;
        setRecipe(r);
        setProduct(null);
        if (r) {
          const tot = recipeTotals(r);
          const perServingG = tot.grams / r.servings;
          setServings(String(round1(perServingG > 0 ? e.grams / perServingG : 1)));
        }
      } else {
        const p = state.products.find((x) => x.id === e.refId) ?? null;
        setProduct(p);
        setRecipe(null);
        setAmount(String(round1(displayFromGrams(e.grams, state.settings.units, p?.cupG))));
      }
    } else {
      setProduct(
        opts.productId
          ? state.products.find((p) => p.id === opts.productId) ?? null
          : null
      );
      const r0 = opts.recipeId
        ? state.recipes.find((r) => r.id === opts.recipeId) ?? null
        : null;
      setRecipe(r0);
      setTab(r0 ? "recipe" : "product");
      setAmount("100");
      setServings("1");
    }
  }, [open, opts, state.products, state.recipes, state.settings.units]);

  const pmap = useMemo(
    () => new Map(state.products.map((p) => [p.id, p])),
    [state.products]
  );

  const recent = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of state.entries) {
      if (e.kind === "product" && e.refId)
        counts.set(e.refId, (counts.get(e.refId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => pmap.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [state.entries, pmap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = state.products;
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q)
      );
    }
    return list.slice(0, q ? 60 : 40);
  }, [state.products, query]);

  const emptyList = useMemo(() => {
    if (query.trim()) return filtered;
    const favs = state.products.filter((p) => p.favorite);
    const ids = new Set<string>();
    const out: Product[] = [];
    for (const p of [...favs, ...recent]) {
      if (!ids.has(p.id)) {
        ids.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [filtered, query, state.products, recent]);

  const units = state.settings.units;

  const nutrition = useMemo(() => {
    if (tab === "product" && product) {
      const g = gramsFromDisplay(Number(amount) || 0, units, product.cupG);
      return { grams: g, ...scaleNutrition(product, g) };
    }
    if (tab === "recipe" && recipe) {
      const tot = recipeTotals(recipe);
      const srv = Number(servings) || 0;
      const k = recipe.servings > 0 ? srv / recipe.servings : 0;
      return {
        grams: tot.grams * k,
        kcal: tot.kcal * k,
        protein: tot.protein * k,
        fat: tot.fat * k,
        carbs: tot.carbs * k,
      };
    }
    return null;
  }, [tab, product, recipe, amount, servings, units]);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch {
      toast.push("Не удалось загрузить фото", "err");
    }
  };

  const canSave = Boolean(nutrition && nutrition.grams > 0 && date);

  const save = () => {
    if (!nutrition || !canSave) return;
    const t = roundTotals(nutrition);
    const kind = tab;
    const refId = kind === "product" ? product?.id : recipe?.id;
    const name = kind === "product" ? product!.name : recipe!.name;

    const entry: MealEntry = {
      id: opts?.entry?.id ?? uid("e"),
      date,
      meal,
      time,
      kind,
      refId,
      name,
      grams: Math.round(nutrition.grams),
      ...t,
      photo,
    };

    if (opts?.entry) updateEntry(entry);
    else addEntry(entry);

    toast.push(opts?.entry ? "Запись обновлена" : "Добавлено в дневник");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={opts?.entry ? "Редактировать запись" : "Добавить в дневник"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {nutrition && nutrition.grams > 0 ? (
              <span className="font-semibold text-accent">
                {fmt(nutrition.kcal)} ккал
              </span>
            ) : (
              <span className="text-faint">Выберите продукт</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={save} disabled={!canSave}>
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Приём пищи */}
        <Segmented
          value={meal}
          onChange={setMeal}
          options={MEAL_ORDER.map((m) => ({
            value: m,
            label: (
              <span className="flex items-center gap-1">
                <span>{MEAL_META[m].emoji}</span>
                <span className="hidden sm:inline">{MEAL_META[m].label}</span>
              </span>
            ),
            title: MEAL_META[m].label,
          }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Дата</label>
            <input
              type="date"
              className="input"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Время</label>
            <input
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Источник */}
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "product", label: "🍎 Продукт" },
            { value: "recipe", label: `👨‍🍳 Рецепт (${state.recipes.length})` },
          ]}
        />

        {tab === "product" ? (
          <>
            <div className="relative">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                className="input pl-9"
                placeholder="Поиск продукта..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {product ? (
              <div className="anim-pop rounded-xl border border-accent-line bg-accent-soft p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-mut">
                      {product.brand ? product.brand + " · " : ""}
                      {product.category} · {fmt(product.kcal)} ккал / 100 г
                    </p>
                  </div>
                  <button
                    className="icon-btn -mr-2 -mt-2"
                    onClick={() => setProduct(null)}
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <div className="w-32">
                    <label className="label">Количество</label>
                    <input
                      type="number"
                      min={0}
                      step={units === "g" ? 1 : units === "oz" ? 0.1 : 0.25}
                      className="input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <span className="pb-3 text-sm text-mut">
                    {UNIT_LABEL[units]}
                    {units === "cup" && ` (${product.cupG ?? 250} г)`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {!query.trim() && (
                  <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">
                    Избранное и недавние
                  </p>
                )}
                {emptyList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProduct(p);
                      setAmount(String(round1(displayFromGrams(100, units, p.cupG))));
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-elev"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {p.favorite && <StarIcon size={12} className="mr-1 inline text-warn" />}
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        {p.category}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-mut">
                      {fmt(p.kcal)} ккал
                    </span>
                  </button>
                ))}
                {emptyList.length === 0 && (
                  <p className="py-3 text-center text-sm text-mut">
                    Ничего не найдено.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {state.recipes.map((r) => {
              const t = recipeTotals(r);
              const active = recipe?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRecipe(r)}
                  className={
                    "w-full rounded-xl border p-3 text-left transition " +
                    (active
                      ? "border-accent-line bg-accent-soft"
                      : "border-line bg-elev hover:border-accent-line/60")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="text-xs text-mut">
                      {Math.round(t.kcal / r.servings)} ккал/порц.
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-faint">
                    {r.ingredients.length} ингр. · {r.servings} порц.
                  </p>
                </button>
              );
            })}
            {state.recipes.length === 0 && (
              <p className="py-3 text-center text-sm text-mut">
                Рецептов пока нет — создайте их в разделе «Рецепты».
              </p>
            )}
            {recipe && (
              <div className="rounded-xl border border-accent-line bg-accent-soft p-3">
                <label className="label">Порций</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  className="input w-32"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Живая сводка */}
        {nutrition && nutrition.grams > 0 && (
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-elev p-3 text-center">
            <div>
              <p className="text-sm font-bold text-accent">{fmt(nutrition.kcal)}</p>
              <p className="text-[11px] text-faint">ккал</p>
            </div>
            <div>
              <p className="text-sm font-bold text-teal">{fmt(nutrition.protein, 1)}</p>
              <p className="text-[11px] text-faint">белки</p>
            </div>
            <div>
              <p className="text-sm font-bold text-warn">{fmt(nutrition.fat, 1)}</p>
              <p className="text-[11px] text-faint">жиры</p>
            </div>
            <div>
              <p className="text-sm font-bold text-bad">{fmt(nutrition.carbs, 1)}</p>
              <p className="text-[11px] text-faint">углев.</p>
            </div>
          </div>
        )}

        {/* Фото */}
        <div>
          {photo ? (
            <div className="relative inline-block">
              <img
                src={photo}
                alt="Фото еды"
                className="h-24 w-24 rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto(undefined)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-bad text-white"
              >
                <XIcon size={13} />
              </button>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3.5 py-2 text-sm text-mut transition hover:border-accent-line hover:text-txt">
              <CameraIcon size={16} />
              Добавить фото
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </label>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-faint">
            <ImageIcon size={12} /> Фото хранится только на вашем устройстве
          </p>
        </div>
      </div>
    </Modal>
  );
}
