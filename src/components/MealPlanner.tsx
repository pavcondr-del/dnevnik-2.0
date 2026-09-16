"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "../lib/store";
import { Card, Button, EmptyState, useToast } from "./ui";
import { PlusIcon, TrashIcon, ChefIcon, SparklesIcon } from "./icons";
import { useQuickAdd } from "./quickadd";

interface AvailableProduct {
  id: string;
  name: string;
}

export default function MealPlanner() {
  const { state, saveRecipe } = useStore();
  const toast = useToast();
  const quick = useQuickAdd();

  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Фильтрация продуктов из базы для автодополнения
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return state.products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [searchQuery, state.products]);

  // Закрытие списка при клике вне контейнера
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Фильтрация уже добавленных продуктов
  const availableIds = new Set(availableProducts.map((p) => p.id));

  const addProduct = (productId: string, productName: string) => {
    if (!availableIds.has(productId)) {
      setAvailableProducts([
        ...availableProducts,
        { id: productId, name: productName },
      ]);
    }
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const removeProduct = (id: string) => {
    setAvailableProducts(availableProducts.filter((p) => p.id !== id));
  };

  // Поиск рецептов из доступных продуктов
  const matchingRecipes = useMemo(() => {
    if (availableProducts.length === 0) return [];

    const results = state.recipes
      .map((recipe) => {
        const recipeIngredients = recipe.ingredients;
        const totalIngredients = recipeIngredients.length;
        
        // Считаем сколько ингредиентов есть в наличии
        const matchedIngredients = recipeIngredients.filter((ing) => {
          // Проверяем по refId (если ингредиент из базы продуктов)
          if (ing.productId && availableIds.has(ing.productId)) {
            return true;
          }
          // Проверяем по названию (частичное совпадение)
          const ingName = ing.name.toLowerCase();
          return availableProducts.some((p) => {
            const pName = p.name.toLowerCase();
            return pName.includes(ingName) || ingName.includes(pName);
          });
        });

        const matchCount = matchedIngredients.length;
        const matchPercent = Math.round((matchCount / totalIngredients) * 100);

        return {
          recipe,
          matchCount,
          matchPercent,
          missingIngredients: recipeIngredients.filter(
            (ing) => !matchedIngredients.includes(ing)
          ),
        };
      })
      .filter((r) => r.matchCount > 0) // Показываем только рецепты с хотя бы 1 совпадением
      .sort((a, b) => b.matchPercent - a.matchPercent); // Сортируем по % совпадения

    return results;
  }, [availableProducts, state.recipes, availableIds]);

  const handleAddRecipeToDiary = (recipeId: string) => {
    quick.open({ recipeId });
    toast.push("Добавьте рецепт в дневник");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Что есть дома</h1>
        <p className="mt-1 text-sm text-mut">
          Укажите продукты, которые есть в холодильнике, и мы подберём рецепты
        </p>
      </div>

      {/* Поиск и добавление продуктов */}
      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <ChefIcon size={18} /> Ваши продукты
        </h2>
        
        <div className="space-y-3">
          <div className="relative" ref={containerRef}>
            <input
              type="text"
              className="input"
              placeholder="Начните вводить название продукта..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {/* Выпадающий список подсказок */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-card shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p.id, p.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-elev transition"
                  >
                    {p.name}
                    <span className="ml-2 text-xs text-mut">
                      {p.category} · {Math.round(p.kcal)} ккал
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Список добавленных продуктов */}
          {availableProducts.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg bg-elev px-3 py-1.5 text-sm"
                  >
                    <span>{p.name}</span>
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="icon-btn h-5 w-5 hover:text-bad!"
                      aria-label="Удалить"
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-mut">
                Добавлено продуктов: {availableProducts.length}
              </p>
            </div>
          ) : (
            <p className="text-sm text-mut">
              Начните вводить названия продуктов, которые у вас есть
            </p>
          )}
        </div>
      </Card>

      {/* Результаты поиска рецептов */}
      {availableProducts.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <SparklesIcon size={18} className="text-accent" />
            Подходящие рецепты
          </h2>

          {matchingRecipes.length === 0 ? (
            <EmptyState
              emoji="🍽️"
              title="Рецепты не найдены"
              text="Попробуйте добавить больше продуктов или создайте новый рецепт"
            />
          ) : (
            <div className="space-y-3">
              {matchingRecipes.map(({ recipe, matchCount, matchPercent, missingIngredients }) => (
                <div
                  key={recipe.id}
                  className="rounded-lg border border-line bg-elev/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{recipe.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            matchPercent === 100
                              ? "bg-good/20 text-good"
                              : matchPercent >= 70
                              ? "bg-accent/20 text-accent"
                              : "bg-warn/20 text-warn"
                          }`}
                        >
                          {matchPercent}% совпадение
                        </span>
                      </div>
                      <p className="text-xs text-mut">
                        {matchCount} из {recipe.ingredients.length} ингредиентов у вас есть
                      </p>
                      {missingIngredients.length > 0 && (
                        <p className="text-xs text-warn mt-1">
                          Не хватает: {missingIngredients.map((i) => i.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddRecipeToDiary(recipe.id)}
                    >
                      <PlusIcon size={14} /> В дневник
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Пустое состояние */}
      {availableProducts.length === 0 && (
        <EmptyState
          emoji="🥘"
          title="Начните с продуктов"
          text="Добавьте продукты, которые есть у вас дома, и мы подберём подходящие рецепты"
        />
      )}
    </div>
  );
}
