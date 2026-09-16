"use client";
import { useState } from "react";
import { ARTICLES } from "../lib/seed";
import type { Article } from "../lib/types";
import { Badge, Card, Modal } from "./ui";
import { BookIcon, ClockIcon } from "./icons";

export default function Articles() {
  const [active, setActive] = useState<Article | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Статьи и советы</h1>
        <p className="mt-1 text-sm text-mut">
          Короткие материалы о питании, привычках и тренировках — без воды и
          строгих диет.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a) => (
          <button
            key={a.id}
            onClick={() => setActive(a)}
            className="card group p-5 text-left transition hover:border-accent-line active:scale-[0.99]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-elev text-2xl transition group-hover:bg-accent-soft">
                {a.emoji}
              </span>
              <Badge>{a.category}</Badge>
            </div>
            <h2 className="font-semibold leading-snug">{a.title}</h2>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-mut">
              {a.paragraphs[0]}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
              <ClockIcon size={12} /> {a.minutes} мин чтения
            </p>
          </button>
        ))}
      </div>

      <div className="card flex items-center gap-3 p-4">
        <BookIcon size={20} className="shrink-0 text-accent" />
        <p className="text-xs text-mut">
          Материалы носят информационный характер и не заменяют консультацию
          врача или диетолога.
        </p>
      </div>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={
          active ? (
            <span className="flex items-center gap-2">
              <span className="text-2xl">{active.emoji}</span>
              {active.title}
            </span>
          ) : (
            ""
          )
        }
        wide
      >
        {active && (
          <article className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Badge color="accent">{active.category}</Badge>
              <span className="flex items-center gap-1 text-xs text-faint">
                <ClockIcon size={12} /> {active.minutes} мин
              </span>
            </div>
            {active.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-txt/90">
                {p}
              </p>
            ))}
          </article>
        )}
      </Modal>
    </div>
  );
}
