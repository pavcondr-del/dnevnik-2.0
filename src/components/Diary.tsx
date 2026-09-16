"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { calcTargets, roundTotals, sumEntries } from "../lib/nutrition";
import {
  MEAL_ORDER,
  addDaysKey,
  fmt,
  ruDateLong,
  todayKey,
} from "../lib/utils";
import { MealGroup } from "./Meals";
import { Badge, Button, Card, EmptyState, Modal } from "./ui";
import { useQuickAdd } from "./quickadd";
import { useToast } from "./ui";
import { useHideNumbers } from "../lib/useHideNumbers";
import { NoteEditor } from "./NoteEditor";
import { AudioPlayer } from "./AudioPlayer";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  ZapIcon,
} from "./icons";

function DayNote({ date }: { date: string }) {
  const { state, updateNote } = useStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  
  const notes = state.notes.filter((n) => n.date === date);

  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleEditClick = (note: any) => {
    setEditText(note.text);
    setEditingNoteId(note.id);
  };

  const handleSave = () => {
    if (editingNoteId) {
      const note = notes.find((n) => n.id === editingNoteId);
      if (note) {
        updateNote({ ...note, text: editText });
        setEditingNoteId(null);
        setEditText("");
      }
    }
  };

  const handleCancel = () => {
    setEditingNoteId(null);
    setEditText("");
  };

  return (
    <>
      <Card className="py-3!">
        {notes.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint mb-2">
              {notes.length === 1 ? "Заметка дня" : `Заметки дня (${notes.length})`}
            </p>
            {notes.map((note, index) => (
              <div key={note.id} className={index > 0 ? "border-t border-line pt-4" : ""}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📝</span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="inline-block bg-accent/10 text-accent text-xs font-semibold px-2 py-0.5 rounded mb-1">
                        {notes.length > 1 ? `Заметка ${index + 1}` : "Заметка"} · {new Date(note.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full rounded-lg border border-line bg-elev p-2 text-sm focus:border-accent focus:outline-none resize-y min-h-[80px]"
                            rows={4}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              Сохранить
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancel}>
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="break-words overflow-hidden">
                            <p 
                              className={`text-sm whitespace-pre-wrap break-words ${
                                expandedNotes.has(note.id) ? "" : "line-clamp-3"
                              }`}
                            >
                              {note.text}
                            </p>
                          </div>
                          {note.text.length > 150 && (
                            <button
                              onClick={() => toggleExpanded(note.id)}
                              className="mt-1 text-xs text-accent hover:underline"
                            >
                              {expandedNotes.has(note.id) ? "Свернуть" : "Развернуть"}
                            </button>
                          )}
                          {note.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {note.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {editingNoteId !== note.id && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setViewingNote(note)}
                          className="icon-btn"
                          aria-label="Посмотреть заметку"
                        >
                          <EyeIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleEditClick(note)}
                          className="icon-btn"
                          aria-label="Редактировать заметку"
                        >
                          <PencilIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {note.audio && (
                    <AudioPlayer audioSrc={note.audio} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setEditorOpen(true)}
            className="flex w-full items-center gap-2 text-sm text-mut hover:text-accent transition"
          >
            <PlusIcon size={14} />
            Добавить заметку дня
          </button>
        )}
      </Card>
      <NoteEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialDate={date}
      />
      
      <Modal
        open={viewingNote !== null}
        onClose={() => setViewingNote(null)}
        title={viewingNote ? `Заметка от ${new Date(viewingNote.date).toLocaleDateString('ru-RU')}` : ""}
      >
        {viewingNote && (
          <div className="space-y-3">
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap break-words">
                {viewingNote.text}
              </p>
            </div>
            {viewingNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {viewingNote.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {viewingNote.audio && (
              <AudioPlayer audioSrc={viewingNote.audio} />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Macro({
  label,
  v,
  t,
  color,
}: {
  label: string;
  v: number;
  t: number;
  color: string;
}) {
  const hideNumbers = useHideNumbers();
  return (
    <div>
      <p className="text-xs text-mut">{label}</p>
      <p className="text-lg font-bold">
        {hideNumbers ? (
          <span className="text-faint">•••</span>
        ) : (
          <>
            <span className={color}>{fmt(v, 1)}</span>
            <span className="text-xs font-normal text-faint"> / {fmt(t)} г</span>
          </>
        )}
      </p>
    </div>
  );
}

export default function Diary() {
  const { state, copyDay, deleteActivity } = useStore();
  const hideNumbers = useHideNumbers();
  const quick = useQuickAdd();
  const toast = useToast();
  const [day, setDay] = useState(todayKey());

  const targets = useMemo(() => calcTargets(state.profile), [state.profile]);
  const isToday = day === todayKey();

  // Обработка параметров из сканера/базы продуктов
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId");
    const recipeId = params.get("recipeId");

    if (productId || recipeId) {
      quick.open({
        date: todayKey(),
        productId: productId ?? undefined,
        recipeId: recipeId ?? undefined,
      });
      // Очищаем URL
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
  }, [quick]);

  const dayEntries = state.entries.filter((e) => e.date === day);
  const totals = roundTotals(sumEntries(dayEntries));
  const dayActivities = state.activities.filter((a) => a.date === day);
  const burned = dayActivities.reduce((s, a) => s + a.kcal, 0);
  const pct = Math.min(100, Math.round((totals.kcal / targets.kcal) * 100));

  const copyYesterday = () => {
    const from = addDaysKey(day, -1);
    const hasSource = state.entries.some((e) => e.date === from);

    if (!hasSource) {
      toast.push("За предыдущий день нет записей", "err");
      return;
    }

    if (
      dayEntries.length > 0 &&
      !window.confirm("Текущие записи дня будут заменены. Продолжить?")
    ) {
      return;
    }

    const n = copyDay(from, day);
    toast.push(`Скопировано записей: ${n}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Дневник питания</h1>
      </div>

      {/* Навигация по датам */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3!">
        <div className="flex items-center gap-1">
          <button
            className="icon-btn"
            onClick={() => setDay(addDaysKey(day, -1))}
            aria-label="Предыдущий день"
          >
            <ChevronLeftIcon />
          </button>
          <div className="min-w-[180px] text-center">
            <p className="text-sm font-semibold capitalize">{ruDateLong(day)}</p>
            {isToday && (
              <span className="text-[11px] font-medium text-accent">сегодня</span>
            )}
          </div>
          <button
            className="icon-btn disabled:opacity-30"
            onClick={() => setDay(addDaysKey(day, 1))}
            disabled={isToday}
            aria-label="Следующий день"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button size="sm" variant="outline" onClick={() => setDay(todayKey())}>
              Сегодня
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={copyYesterday}>
            <CopyIcon size={15} /> Перенести
          </Button>
        </div>
      </Card>

      {/* Сводка дня */}
      <Card>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <p className="text-xs text-mut">Калории</p>
            <p className="text-2xl font-extrabold">
              {hideNumbers ? (
                <span className="text-faint">•••</span>
              ) : (
                <>
                  <span
                    className={
                      totals.kcal > targets.kcal * 1.08 ? "text-bad" : "text-accent"
                    }
                  >
                    {fmt(totals.kcal)}
                  </span>
                  <span className="text-sm font-normal text-faint">
                    {" "}
                    / {fmt(targets.kcal)}
                  </span>
                </>
              )}
            </p>
            <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-elev">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Macro
            label="Белки"
            v={totals.protein}
            t={targets.protein}
            color="text-teal"
          />
          <Macro
            label="Жиры"
            v={totals.fat}
            t={targets.fat}
            color="text-warn"
          />
          <Macro
            label="Углеводы"
            v={totals.carbs}
            t={targets.carbs}
            color="text-bad"
          />
          {burned > 0 && (
            <Badge color="teal" className="ml-auto px-3 py-1.5">
              <ZapIcon size={14} /> сожжено {fmt(burned)} ккал
            </Badge>
          )}
        </div>
      </Card>

      {/* Заметка дня */}
      <DayNote date={day} />

      {dayActivities.length > 0 && (
        <Card className="py-3!">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            Активность
          </p>
          <div className="flex flex-wrap gap-2">
            {dayActivities.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-2 rounded-lg bg-elev px-3 py-1.5 text-xs"
              >
                {a.label} · {a.minutes} мин ·{" "}
                <b className="text-teal">−{a.kcal} ккал</b>
                <button
                  className="text-faint hover:text-bad"
                  onClick={() => deleteActivity(a.id)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </Card>
      )}

      {dayEntries.length === 0 ? (
        <EmptyState
          emoji="📔"
          title={isToday ? "День только начинается" : "Нет записей за этот день"}
          text="Добавьте продукт из базы, рецепт или перенесите записи из предыдущего дня."
          action={
            <Button onClick={() => quick.open({ date: day })} size="lg">
              <PlusIcon size={18} /> Добавить запись
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {MEAL_ORDER.map((m) => (
            <MealGroup
              key={m}
              date={day}
              meal={m}
              entries={dayEntries.filter((e) => e.meal === m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
