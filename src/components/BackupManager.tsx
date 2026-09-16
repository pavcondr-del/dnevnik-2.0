"use client";
import { useState, useRef } from "react";
import { useStore } from "../lib/store";
import { Card, Button, useToast } from "./ui";
import { DownloadIcon, UploadIcon, DatabaseIcon } from "./icons";

export default function BackupManager() {
  const { state, exportBackup, importBackup } = useStore();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaloriyka-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.push("Бэкап успешно экспортирован");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const success = importBackup(json);
      if (success) {
        toast.push("Данные успешно восстановлены из бэкапа");
      } else {
        toast.push("Ошибка: неверный формат файла бэкапа", "err");
      }
    };
    reader.onerror = () => {
      toast.push("Ошибка чтения файла", "err");
    };
    reader.readAsText(file);

    // Сброс input для возможности повторной загрузки того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatLastBackup = (timestamp?: string) => {
    if (!timestamp) return "Никогда";
    const date = new Date(timestamp);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDataSize = () => {
    const json = JSON.stringify(state);
    const bytes = new Blob([json]).size;
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Резервные копии</h1>
        <p className="mt-1 text-sm text-mut">
          Экспортируйте и импортируйте данные для безопасности
        </p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <DatabaseIcon size={24} className="text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Статистика данных</h2>
            <div className="mt-2 space-y-1 text-sm text-mut">
              <p>Размер данных: <span className="font-medium text-txt">{getDataSize()}</span></p>
              <p>Последний бэкап: <span className="font-medium text-txt">{formatLastBackup(state.lastBackup)}</span></p>
              <p>Записей в дневнике: <span className="font-medium text-txt">{state.entries.length}</span></p>
              <p>Продуктов в базе: <span className="font-medium text-txt">{state.products.length}</span></p>
              <p>Рецептов: <span className="font-medium text-txt">{state.recipes.length}</span></p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Экспорт данных</h2>
        <p className="mb-4 text-sm text-mut">
          Скачайте все ваши данные в формате JSON. Этот файл можно использовать для восстановления данных или переноса на другое устройство.
        </p>
        <Button onClick={handleExport} className="w-full sm:w-auto">
          <DownloadIcon size={18} />
          Скачать бэкап
        </Button>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Импорт данных</h2>
        <p className="mb-4 text-sm text-mut">
          Восстановите данные из ранее сохранённого бэкапа. <span className="text-warn font-medium">Внимание:</span> текущие данные будут заменены данными из бэкапа.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          <UploadIcon size={18} />
          Загрузить бэкап
        </Button>
      </Card>

      <Card className="border-warn/30 bg-warn/5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-warn">
          <span>⚠️</span>
          <span>Рекомендации</span>
        </h2>
        <ul className="space-y-2 text-sm text-mut">
          <li>• Создавайте бэкап регулярно (раз в неделю или месяц)</li>
          <li>• Храните бэкапы в надёжном месте (облако, внешний диск)</li>
          <li>• Перед импортом убедитесь, что у вас есть актуальный бэкап текущих данных</li>
          <li>• Не удаляйте старые бэкапы, пока не убедитесь, что новые работают</li>
        </ul>
      </Card>
    </div>
  );
}
