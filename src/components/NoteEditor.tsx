import { useState, useEffect } from "react";
import { useStore } from "../lib/store";
import { NOTE_TAGS } from "../lib/seed";
import { todayKey } from "../lib/utils";
import { Modal, Button, useToast } from "./ui";
import { VoiceRecorder } from "./VoiceRecorder";
import { MicIcon } from "./icons";
import type { Note } from "../lib/types";

interface NoteEditorProps {
  open: boolean;
  onClose: () => void;
  editing?: Note | null;
  initialDate?: string;
}

export function NoteEditor({ open, onClose, editing, initialDate }: NoteEditorProps) {
  const { addNote, updateNote } = useStore();
  const toast = useToast();

  const [date, setDate] = useState(initialDate ?? todayKey());
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [audio, setAudio] = useState<string | undefined>(undefined);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDate(editing.date);
      setText(editing.text);
      setTags(editing.tags);
      setAudio(editing.audio);
    } else {
      setDate(initialDate ?? todayKey());
      setText("");
      setTags([]);
      setAudio(undefined);
    }
    setCustomTag("");
    setShowVoiceRecorder(false);
  }, [open, editing, initialDate]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag.startsWith("#") ? tag : `#${tag}`]);
      setCustomTag("");
    }
  };

  const handleSave = () => {
    if (!text.trim() && !audio) {
      toast.push("Введите текст заметки или запишите голос", "err");
      return;
    }

    if (editing) {
      updateNote({ ...editing, date, text: text.trim(), tags, audio });
      toast.push("Заметка обновлена");
    } else {
      addNote({ date, text: text.trim(), tags, audio });
      toast.push("Заметка добавлена");
    }
    onClose();
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    // Конвертируем Blob в base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAudio(base64);
      setShowVoiceRecorder(false);
      toast.push("Голосовая заметка добавлена");
    };
    reader.readAsDataURL(audioBlob);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Редактировать заметку" : "Новая заметка"}
    >
      <div className="space-y-4">
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
          <label className="label">Текст</label>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Что произошло? Как ты себя чувствовал?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Голосовая запись */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            >
              <MicIcon size={16} />
              {showVoiceRecorder ? "Скрыть запись" : "Записать голос"}
            </Button>
            {audio && !showVoiceRecorder && (
              <span className="text-xs text-good">✓ Аудио записано</span>
            )}
          </div>
          {showVoiceRecorder && (
            <div className="rounded-lg border border-line bg-elev/50 p-4">
              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
            </div>
          )}
        </div>

        <div>
          <label className="label">Теги</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {NOTE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`chip ${tags.includes(tag) ? "chip-active" : ""}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Свой тег..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
            />
            <Button variant="outline" onClick={addCustomTag}>
              +
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs text-accent"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:text-accent-hover"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </div>
      </div>
    </Modal>
  );
}
