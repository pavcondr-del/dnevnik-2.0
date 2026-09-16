"use client";
import { useState, useEffect } from "react";
import { useStore } from "../lib/store";
import { CHECKIN_FLAGS } from "../lib/types";
import { Modal, Button, useToast } from "./ui";
import { todayKey } from "../lib/utils";

interface CheckinModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
}

const ENERGY_EMOJIS = ["😴", "😐", "🙂", "😊", "⚡"];
const HUNGER_EMOJIS = ["🤢", "😌", "😐", "🍽️", "🐺"];
const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];

export function CheckinModal({ open, onClose, initialDate }: CheckinModalProps) {
  const { state, upsertCheckin } = useStore();
  const toast = useToast();
  
  const [date, setDate] = useState(todayKey());
  const [energy, setEnergy] = useState(3);
  const [hunger, setHunger] = useState(3);
  const [mood, setMood] = useState(3);
  const [flags, setFlags] = useState<string[]>([]);

  // Загрузка существующего чек-ина
  useEffect(() => {
    if (open) {
      const d = initialDate ?? todayKey();
      setDate(d);
      const existing = state.checkins.find((c) => c.date === d);
      if (existing) {
        setEnergy(existing.energy);
        setHunger(existing.hunger);
        setMood(existing.mood);
        setFlags(existing.flags);
      } else {
        setEnergy(3);
        setHunger(3);
        setMood(3);
        setFlags([]);
      }
    }
  }, [open, initialDate, state.checkins]);

  const toggleFlag = (flagId: string) => {
    setFlags((prev) =>
      prev.includes(flagId) ? prev.filter((f) => f !== flagId) : [...prev, flagId]
    );
  };

  const handleSave = () => {
    upsertCheckin({ date, energy, hunger, mood, flags });
    toast.push("Самочувствие сохранено");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Как ты себя чувствуешь?">
      <div className="space-y-5">
        {/* Энергия */}
        <div>
          <label className="label mb-2">Энергия</label>
          <div className="flex gap-2">
            {ENERGY_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setEnergy(idx + 1)}
                className={`flex-1 rounded-lg border p-3 text-2xl transition ${
                  energy === idx + 1
                    ? "border-accent bg-accent/10 scale-110"
                    : "border-line bg-elev hover:border-accent/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Голод */}
        <div>
          <label className="label mb-2">Голод</label>
          <div className="flex gap-2">
            {HUNGER_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setHunger(idx + 1)}
                className={`flex-1 rounded-lg border p-3 text-2xl transition ${
                  hunger === idx + 1
                    ? "border-accent bg-accent/10 scale-110"
                    : "border-line bg-elev hover:border-accent/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Настроение */}
        <div>
          <label className="label mb-2">Настроение</label>
          <div className="flex gap-2">
            {MOOD_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setMood(idx + 1)}
                className={`flex-1 rounded-lg border p-3 text-2xl transition ${
                  mood === idx + 1
                    ? "border-accent bg-accent/10 scale-110"
                    : "border-line bg-elev hover:border-accent/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Флаги */}
        <div>
          <label className="label mb-2">Что было сегодня?</label>
          <div className="flex flex-wrap gap-2">
            {CHECKIN_FLAGS.map((flag) => (
              <button
                key={flag.id}
                onClick={() => toggleFlag(flag.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  flags.includes(flag.id)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-elev text-mut hover:border-accent/50"
                }`}
              >
                {flag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
