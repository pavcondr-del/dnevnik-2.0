"use client";
import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { CATEGORIES } from "../lib/seed";
import type { Product } from "../lib/types";
import { fmt } from "../lib/utils";
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  useToast,
} from "./ui";
import { ProductModal } from "./ProductModal";
import { useQuickAdd } from "./quickadd";
import {
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from "./icons";

const FAV = "__fav__";

export default function FoodDatabase() {
  const { state, toggleFavorite, deleteProduct } = useStore();
  const quick = useQuickAdd();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [limit, setLimit] = useState(40);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.products.filter((p) => {
      if (category === FAV && !p.favorite) return false;
      if (category !== "all" && category !== FAV && p.category !== category)
        return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !(p.brand ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [state.products, query, category]);

  const visible = filtered.slice(0, limit);

  const chips = ["all", FAV, ...CATEGORIES];
  const chipLabel = (c: string) =>
    c === "all" ? "Все" : c === FAV ? "★ Избранное" : c;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">База продуктов</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <PlusIcon size={16} /> Свой продукт
        </Button>
      </div>

      {/* Поиск */}
      <Card className="p-3.5!">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              className="input pl-9"
              placeholder="Поиск по названию или бренду..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(40);
              }}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setLimit(40);
              }}
              className={"chip " + (category === c ? "chip-active" : "")}
            >
              {chipLabel(c)}
            </button>
          ))}
        </div>
      </Card>

      {/* База продуктов */}
      {filtered.length === 0 ? (
            <EmptyState
              emoji="🔎"
              title="Ничего не найдено"
              text="Измените запрос или добавьте собственный продукт."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                >
                  <PlusIcon size={16} /> Добавить продукт
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {visible.map((p) => (
                <Card key={p.id} className="p-3!">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {p.name}
                        </p>
                        {p.custom && <Badge color="accent">свой</Badge>}
                        {p.barcode && <Badge>🏷️ {p.barcode}</Badge>}
                      </div>
                      <p className="truncate text-xs text-faint">
                        {p.brand ? p.brand + " · " : ""}
                        {p.category}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                        <span className="font-semibold text-accent">
                          {fmt(p.kcal)} ккал
                        </span>
                        <span className="text-teal">
                          Б {fmt(p.protein, 1)} г
                        </span>
                        <span className="text-warn">
                          Ж {fmt(p.fat, 1)} г
                        </span>
                        <span className="text-bad">
                          У {fmt(p.carbs, 1)} г
                        </span>
                        <span className="text-faint">на 100 г</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        className={
                          "icon-btn " + (p.favorite ? "text-warn!" : "")
                        }
                        onClick={() => toggleFavorite(p.id)}
                        aria-label="В избранное"
                      >
                        <StarIcon
                          size={18}
                          {...(p.favorite ? { fill: "currentColor" } : {})}
                        />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => quick.open({ productId: p.id })}
                        aria-label="Добавить в дневник"
                        title="В дневник"
                      >
                        <PlusIcon size={18} />
                      </button>
                      {p.custom && (
                        <>
                          <button
                            className="icon-btn"
                            onClick={() => {
                              setEditing(p);
                              setModalOpen(true);
                            }}
                            aria-label="Редактировать"
                          >
                            <PencilIcon size={16} />
                          </button>
                          <button
                            className="icon-btn hover:text-bad!"
                            onClick={() => setDeleteId(p.id)}
                            aria-label="Удалить"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {filtered.length > visible.length && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLimit((l) => l + 40)}
                  >
                    Показать ещё ({filtered.length - visible.length})
                  </Button>
                </div>
              )}
            </div>
          )}

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />

      <ConfirmModal
        open={deleteId !== null}
        title="Удалить продукт?"
        text="Продукт будет удалён из вашей базы. Записи дневника сохранятся."
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteProduct(deleteId);
            toast.push("Продукт удалён");
          }
        }}
      />
    </div>
  );
}
