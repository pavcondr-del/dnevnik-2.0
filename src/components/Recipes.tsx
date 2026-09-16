"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore, recipeTotals } from "../lib/store";
import type { Ingredient, Product, Recipe } from "../lib/types";
import { scaleNutrition } from "../lib/nutrition";
import { fmt, uid } from "../lib/utils";
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Modal,
  useToast,
} from "./ui";
import { useQuickAdd } from "./quickadd";
import {
  ChefIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from "./icons";

interface Row {
  productId: string;
  name: string;
  grams: number;
}

function RecipeEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Recipe | null;
}) {
  const { state, saveRecipe } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [servings, setServings] = useState("1");
  const [steps, setSteps] = useState("");
  const [rows, setRows] = useState<Row[]>([{ productId: "", name: "", grams: 100 }]);
  const [fav, setFav] = useState(false);

  // Инициализация при открытии
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setServings(String(editing.servings));
      setSteps(editing.steps ?? "");
      setFav(Boolean(editing.favorite));
      setRows(
        editing.ingredients.map((i) => ({
          productId: i.productId,
          name: i.name,
          grams: i.grams,
        }))
      );
    } else {
      setName("");
      setServings("1");
      setSteps("");
      setFav(false);
      setRows([{ productId: "", name: "", grams: 100 }]);
    }
  }, [open, editing?.id]);

  const pmap = useMemo(
    () => new Map(state.products.map((p) => [p.id, p])),
    [state.products]
  );

  const live = useMemo(() => {
    const acc = { kcal: 0, protein: 0, fat: 0, carbs: 0, grams: 0 };
    for (const r of rows) {
      const p = r.productId ? pmap.get(r.productId) : undefined;
      if (!p || r.grams <= 0) continue;
      const t = scaleNutrition(p, r.grams);
      acc.kcal += t.kcal;
      acc.protein += t.protein;
      acc.fat += t.fat;
      acc.carbs += t.carbs;
      acc.grams += r.grams;
    }
    const srv = Math.max(1, Number(servings) || 1);
    return {
      ...acc,
      perServing: {
        kcal: acc.kcal / srv,
        protein: acc.protein / srv,
        fat: acc.fat / srv,
        carbs: acc.carbs / srv,
        grams: acc.grams / srv,
      },
    };
  }, [rows, pmap, servings]);

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const pickByName = (idx: number, text: string) => {
    const exact = state.products.find(
      (p) => p.name.toLowerCase() === text.trim().toLowerCase()
    );
    updateRow(idx, {
      name: text,
      productId: exact ? exact.id : "",
    });
  };

  const save = () => {
    if (!name.trim()) return toast.push("Введите название рецепта", "err");
    const ingredients: Ingredient[] = [];
    for (const r of rows) {
      const p: Product | undefined = r.productId
        ? pmap.get(r.productId)
        : state.products.find(
            (x) => x.name.toLowerCase() === r.name.trim().toLowerCase()
          );
      if (!p) return toast.push(`Не найден продукт: «${r.name}»`, "err");
      if (r.grams <= 0) return toast.push("Укажите вес ингредиентов", "err");
      const t = scaleNutrition(p, r.grams);
      ingredients.push({
        productId: p.id,
        name: p.name,
        grams: r.grams,
        kcal: Math.round(t.kcal),
        protein: Math.round(t.protein * 10) / 10,
        fat: Math.round(t.fat * 10) / 10,
        carbs: Math.round(t.carbs * 10) / 10,
      });
    }
    if (!ingredients.length) return toast.push("Добавьте ингредиенты", "err");
    const recipe: Recipe = {
      id: editing?.id ?? uid("rc"),
      name: name.trim(),
      servings: Math.max(1, Math.round(Number(servings) || 1)),
      ingredients,
      steps: steps.trim() || undefined,
      favorite: fav,
      custom: true,
    };
    saveRecipe(recipe);
    toast.push(editing ? "Рецепт обновлён" : "Рецепт создан");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={editing ? "Редактировать рецепт" : "Новый рецепт"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-mut">
            На порцию: <b className="text-accent">{fmt(live.perServing.kcal)} ккал</b>{" "}
            · Б {fmt(live.perServing.protein, 1)} · Ж {fmt(live.perServing.fat, 1)} · У{" "}
            {fmt(live.perServing.carbs, 1)}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={save}>Сохранить</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <div>
            <label className="label">Название</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: греческий салат"
            />
          </div>
          <div>
            <label className="label">Порций</label>
            <input
              type="number"
              min={1}
              className="input"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>
        <div>
          <p className="label">Ингредиенты</p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  list="recipe-products"
                  placeholder="Начните вводить продукт..."
                  value={r.name}
                  onChange={(e) => pickByName(i, e.target.value)}
                />
                <input
                  type="number"
                  min={0}
                  className="input w-24"
                  value={r.grams}
                  onChange={(e) =>
                    updateRow(i, { grams: Number(e.target.value) })
                  }
                />
                <span className="w-3 text-xs text-faint">г</span>
                <button
                  className="icon-btn h-9 w-9 shrink-0 hover:text-bad!"
                  onClick={() =>
                    setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs))
                  }
                  aria-label="Удалить ингредиент"
                >
                  <XIcon size={15} />
                </button>
              </div>
            ))}
          </div>
          <datalist id="recipe-products">
            {state.products.map((p) => (
              <option key={p.id} value={p.name}>
                {p.category} · {fmt(p.kcal)} ккал
              </option>
            ))}
          </datalist>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() =>
              setRows((rs) => [...rs, { productId: "", name: "", grams: 100 }])
            }
          >
            <PlusIcon size={15} /> Ингредиент
          </Button>
        </div>
        <div>
          <label className="label">Приготовление (необязательно)</label>
          <textarea
            className="input min-h-24 resize-y"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="1. ...&#10;2. ..."
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-mut">
          <input
            type="checkbox"
            checked={fav}
            onChange={(e) => setFav(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          В избранные рецепты
        </label>
      </div>
    </Modal>
  );
}

export default function Recipes() {
  const { state, deleteRecipe, toggleRecipeFavorite } = useStore();
  const quick = useQuickAdd();
  const toast = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Рецепты</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <PlusIcon size={16} /> Создать рецепт
        </Button>
      </div>

      {state.recipes.length === 0 ? (
        <EmptyState
          emoji="👨‍🍳"
          title="Рецептов пока нет"
          text="Соберите блюдо из продуктов базы — калорийность порции посчитается автоматически."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <PlusIcon size={16} /> Создать первый рецепт
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.recipes.map((r) => {
            const t = recipeTotals(r);
            const per = {
              kcal: t.kcal / r.servings,
              protein: t.protein / r.servings,
              fat: t.fat / r.servings,
              carbs: t.carbs / r.servings,
              grams: t.grams / r.servings,
            };
            return (
              <Card key={r.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-elev text-xl">
                      <ChefIcon size={20} />
                    </span>
                    <div>
                      <h3 className="font-semibold leading-tight">{r.name}</h3>
                      <p className="text-xs text-faint">
                        {r.ingredients.length} ингр. · {r.servings} порц. ·{" "}
                        {fmt(per.grams)} г/порц.
                      </p>
                    </div>
                  </div>
                  <button
                    className={"icon-btn " + (r.favorite ? "text-warn!" : "")}
                    onClick={() => toggleRecipeFavorite(r.id)}
                    aria-label="В избранное"
                  >
                    <StarIcon size={17} {...(r.favorite ? { fill: "currentColor" } : {})} />
                  </button>
                </div>
                <div className="my-3 grid grid-cols-4 gap-1.5 rounded-xl bg-elev p-2.5 text-center">
                  <div>
                    <p className="text-sm font-bold text-accent">{fmt(per.kcal)}</p>
                    <p className="text-[10px] text-faint">ккал</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-teal">{fmt(per.protein, 1)}</p>
                    <p className="text-[10px] text-faint">белки</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warn">{fmt(per.fat, 1)}</p>
                    <p className="text-[10px] text-faint">жиры</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-bad">{fmt(per.carbs, 1)}</p>
                    <p className="text-[10px] text-faint">углев.</p>
                  </div>
                </div>
                <button
                  className="mb-3 text-left text-xs text-mut transition hover:text-txt"
                  onClick={() =>
                    setExpanded(expanded === r.id ? null : r.id)
                  }
                >
                  {expanded === r.id ? "Скрыть состав" : "Показать состав"}
                </button>
                {expanded === r.id && (
                  <div className="anim-fade mb-3 space-y-2">
                    <ul className="space-y-1 text-xs text-mut">
                      {r.ingredients.map((ing, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{ing.name}</span>
                          <span className="text-faint">{fmt(ing.grams)} г</span>
                        </li>
                      ))}
                    </ul>
                    {r.steps && (
                      <p className="whitespace-pre-line rounded-lg bg-elev p-2.5 text-xs leading-relaxed text-mut">
                        {r.steps}
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-auto flex items-center gap-2">
                  <Button className="flex-1" size="sm" onClick={() => quick.open({ recipeId: r.id })}>
                    <PlusIcon size={15} /> Съесть
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(r);
                      setEditorOpen(true);
                    }}
                  >
                    <PencilIcon size={14} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(r.id)}>
                    <TrashIcon size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RecipeEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editing={editing}
      />

      <ConfirmModal
        open={deleteId !== null}
        title="Удалить рецепт?"
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteRecipe(deleteId);
            toast.push("Рецепт удалён");
          }
        }}
      />
    </div>
  );
}
