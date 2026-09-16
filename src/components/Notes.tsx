import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { NOTE_TAGS } from "../lib/seed";
import { Card, Button, EmptyState, ConfirmModal, useToast } from "./ui";
import { NoteEditor } from "./NoteEditor";
import { AudioPlayer } from "./AudioPlayer";
import { PencilIcon, TrashIcon, PlusIcon } from "./icons";
import type { Note } from "../lib/types";

export default function Notes() {
  const { state, deleteNote } = useStore();
  const toast = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Все уникальные теги из заметок
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    state.notes.forEach((n) => n.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [state.notes]);

  // Фильтрация заметок
  const filteredNotes = useMemo(() => {
    let notes = [...state.notes];

    // Фильтр по тегу
    if (filterTag) {
      notes = notes.filter((n) => n.tags.includes(filterTag));
    }

    // Поиск по тексту
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.text.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Сортировка по дате (новые сверху)
    notes.sort((a, b) => b.date.localeCompare(a.date));

    return notes;
  }, [state.notes, filterTag, searchQuery]);

  // Группировка по дате
  const groupedNotes = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    filteredNotes.forEach((n) => {
      if (!groups[n.date]) groups[n.date] = [];
      groups[n.date].push(n);
    });
    return groups;
  }, [filteredNotes]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleEdit = (note: Note) => {
    setEditing(note);
    setEditorOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteNote(deleteId);
      toast.push("Заметка удалена");
      setDeleteId(null);
    }
  };

  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Заметки</h1>
          <p className="mt-1 text-sm text-mut">
            Записывайте мысли о питании, срывах и энергии — потом увидите паттерны
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }}>
          <PlusIcon size={16} /> Новая заметка
        </Button>
      </div>

      {/* Поиск и фильтры */}
      <Card>
        <div className="space-y-3">
          <input
            type="text"
            className="input"
            placeholder="Поиск по тексту и тегам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag(null)}
              className={`chip ${!filterTag ? "chip-active" : ""}`}
            >
              Все
            </button>
            {(allTags.length > 0 ? allTags : NOTE_TAGS).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`chip ${filterTag === tag ? "chip-active" : ""}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Список заметок */}
      {Object.keys(groupedNotes).length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Заметок пока нет"
          text="Записывайте мысли о питании, срывах и энергии — потом увидите паттерны"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotes)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, notes]) => (
              <div key={date}>
                <h2 className="mb-3 text-sm font-semibold text-mut uppercase tracking-wide">
                  {formatDate(date)}
                </h2>
                <div className="space-y-3">
                  {notes.map((note, index) => (
                    <Card key={note.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="inline-block bg-accent/10 text-accent text-xs font-semibold px-2 py-0.5 rounded mb-2">
                            Заметка {index + 1} · {new Date(note.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </div>
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
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {note.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs text-accent"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {note.audio && (
                            <div className="mt-2">
                              <AudioPlayer audioSrc={note.audio} />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(note)}
                            className="icon-btn"
                            aria-label="Редактировать"
                          >
                            <PencilIcon size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(note.id)}
                            className="icon-btn hover:text-bad!"
                            aria-label="Удалить"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <NoteEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditing(null); }}
        editing={editing}
      />

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить заметку?"
        text="Это действие нельзя отменить."
      />
    </div>
  );
}
