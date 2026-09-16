"use client";
import { useState } from "react";
import { Card, Button } from "../ui";
import { ShareModal } from "./ShareModal";
import { ShareIcon, DownloadIcon, CopyIcon } from "../icons";

export default function SharePage() {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Поделиться результатом</h1>
        <p className="mt-1 text-sm text-mut">
          Создайте карточку для соцсетей, текст для мессенджера или HTML-отчёт для отправки кому угодно. Всё работает офлайн.
        </p>
      </div>

      {/* Три карточки с форматами */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <span className="text-3xl">🖼</span>
          </div>
          <h3 className="mb-2 font-semibold">PNG-карточка</h3>
          <p className="mb-4 text-sm text-mut">
            Красивая карточка для Instagram, VK или других соцсетей. 4 стиля и 3 размера.
          </p>
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            Создать карточку
          </Button>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="mb-2 font-semibold">Текст для мессенджера</h3>
          <p className="mb-4 text-sm text-mut">
            Краткий текстовый отчёт для Telegram, WhatsApp или SMS. Копируется в буфер.
          </p>
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            Создать текст
          </Button>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <span className="text-3xl">📄</span>
          </div>
          <h3 className="mb-2 font-semibold">HTML-отчёт</h3>
          <p className="mb-4 text-sm text-mut">
            Подробный отчёт с графиками и таблицами. Открывается в любом браузере.
          </p>
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            Создать отчёт
          </Button>
        </Card>
      </div>

      {/* Как это работает */}
      <Card>
        <h2 className="mb-4 font-semibold">Как это работает</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Выберите период</p>
              <p className="text-sm text-mut">Неделя, 2 недели, месяц или свой диапазон дат</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Выберите формат</p>
              <p className="text-sm text-mut">PNG-карточка, текст или HTML-отчёт</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium">Настройте и скачайте</p>
              <p className="text-sm text-mut">Выберите стиль, включите заметки и самочувствие, скачайте файл</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Особенности */}
      <Card>
        <h2 className="mb-4 font-semibold">Особенности</h2>
        <ul className="space-y-2 text-sm text-mut">
          <li className="flex items-start gap-2">
            <span className="text-accent">✓</span>
            <span>Всё работает офлайн — никаких серверов и интернета</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">✓</span>
            <span>Анонимизация — можно скрыть имя участника</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">✓</span>
            <span>Кириллица — все тексты на русском языке</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">✓</span>
            <span>Адаптивность — отчёты корректно отображаются на всех устройствах</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">✓</span>
            <span>SVG-графики — вес, калории и БЖУ визуализированы в отчётах</span>
          </li>
        </ul>
      </Card>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
