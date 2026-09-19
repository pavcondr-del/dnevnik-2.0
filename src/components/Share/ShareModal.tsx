"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "../../lib/store";
import { Modal, Button, Segmented, Card, useToast } from "../ui";
import { buildSnapshot, resolvePeriod } from "../../lib/share/shareData";
import { generateShareText } from "../../lib/share/shareText";
import { generateShareCard } from "../../lib/share/shareCardPng";
import { generateShareHtml } from "../../lib/share/shareHtml";
import type { ShareOptions, ShareFormat, SharePeriod, ShareCardStyle, ShareCardSize } from "../../lib/share/shareTypes";
import { DownloadIcon, CopyIcon } from "../icons";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShareModal({ open, onClose }: ShareModalProps) {
  const { state } = useStore();
  const toast = useToast();

  const [format, setFormat] = useState<ShareFormat>("text");
  const [period, setPeriod] = useState<SharePeriod>("week");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeCheckins, setIncludeCheckins] = useState(false);
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeMacros, setIncludeMacros] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [cardStyle, setCardStyle] = useState<ShareCardStyle>("minimal");
  const [cardSize, setCardSize] = useState<ShareCardSize>("square");
  const [anonymize, setAnonymize] = useState(false);
  const [includeComment, setIncludeComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [includeUserNote, setIncludeUserNote] = useState(false);
  const [userNoteText, setUserNoteText] = useState("");

  // Обработка загрузки фото
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      toast.push("Выберите изображение", "err");
      return;
    }
    
    // Создаём URL для предпросмотра
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    toast.push("Фото загружено");
  };

  // Очистка URL при закрытии
  useEffect(() => {
    if (!open && photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }
  }, [open, photoUrl]);

  // Инициализация дат при открытии
  useEffect(() => {
    if (open) {
      const { from, to } = resolvePeriod({ period } as ShareOptions);
      setDateFrom(from);
      setDateTo(to);
    }
  }, [open, period]);

  const options: ShareOptions = useMemo(() => ({
    format,
    period,
    dateFrom,
    dateTo,
    includeNotes,
    includeCheckins,
    includeWeight,
    includeMacros: showMacros, // Используем состояние чекбокса
    authorName,
    cardStyle,
    cardSize,
    anonymize,
    comment: includeComment ? commentText : undefined,
    photoUrl, // Передаём фото в опции
    userNote: includeUserNote ? userNoteText : undefined, // Передаём заметку пользователя
  }), [format, period, dateFrom, dateTo, includeNotes, includeCheckins, showMacros, authorName, cardStyle, cardSize, anonymize, includeComment, commentText, photoUrl, includeUserNote, userNoteText]);

  const snapshot = useMemo(() => buildSnapshot(state, options), [state, options]);

  const handleCopyText = async () => {
    const text = generateShareText(snapshot);
    try {
      await navigator.clipboard.writeText(text);
      toast.push("Текст скопирован в буфер обмена");
    } catch {
      toast.push("Не удалось скопировать текст", "err");
    }
  };

  const handleDownloadCard = async () => {
    try {
      const blob = await generateShareCard(snapshot, options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `share-card-${dateFrom}-${dateTo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.push("Карточка сохранена");
    } catch {
      toast.push("Не удалось создать карточку", "err");
    }
  };

  const handleDownloadHtml = () => {
    try {
      const html = generateShareHtml(snapshot, options);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `otchet-${dateFrom}-${dateTo}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.push("HTML-отчёт сохранён");
    } catch {
      toast.push("Не удалось создать HTML-отчёт", "err");
    }
  };

  const textPreview = useMemo(() => generateShareText(snapshot), [snapshot]);

  return (
    <Modal open={open} onClose={onClose} title="Поделиться результатом" wide>
      <div className="space-y-6">
        {/* Период */}
        <div>
          <label className="label">Период</label>
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { value: "week", label: "Неделя" },
              { value: "twoWeeks", label: "2 недели" },
              { value: "month", label: "Месяц" },
              { value: "custom", label: "Свой" },
            ]}
          />
          {period === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">С</label>
                <input
                  type="date"
                  className="input"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label">По</label>
                <input
                  type="date"
                  className="input"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Формат */}
        <div>
          <label className="label">Формат</label>
          <Segmented
            value={format}
            onChange={setFormat}
            options={[
              { value: "card", label: "🖼 Карточка" },
              { value: "text", label: "💬 Текст" },
              { value: "html", label: "📄 HTML-отчёт" },
            ]}
          />
        </div>

        {/* Настройки для карточки */}
        {format === "card" && (
          <div className="space-y-4">
            {/* Загрузка фото */}
            <div>
              <label className="label">Фото для карточки</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    dark:file:bg-blue-900/30 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                    transition-colors cursor-pointer"
                />
                {photoUrl && (
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium"
                  >
                    Удалить
                  </button>
                )}
              </div>
              {photoUrl && (
                <div className="mt-2">
                  <img
                    src={photoUrl}
                    alt="Предпросмотр"
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Чекбокс для отображения КБЖУ */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMacros}
                onChange={(e) => setShowMacros(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Показать КБЖУ и ккал</span>
            </label>

            {/* Чекбокс для пользовательской заметки */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUserNote}
                onChange={(e) => setIncludeUserNote(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Добавить заметку</span>
            </label>
            {includeUserNote && (
              <textarea
                value={userNoteText}
                onChange={(e) => setUserNoteText(e.target.value)}
                placeholder="Ваш текст..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
              />
            )}

            <div>
              <label className="label">Стиль</label>
              <Segmented
                value={cardStyle}
                onChange={setCardStyle}
                options={[
                  { value: "minimal", label: "Минимализм" },
                  { value: "sport", label: "Спорт" },
                  { value: "warm", label: "Тёплый" },
                  { value: "noNumbers", label: "Без цифр" },
                ]}
              />
            </div>
            <div>
              <label className="label">Размер</label>
              <Segmented
                value={cardSize}
                onChange={setCardSize}
                options={[
                  { value: "square", label: "Квадрат" },
                  { value: "story", label: "Stories" },
                  { value: "wide", label: "Широкая" },
                ]}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Скрыть имя</span>
            </label>
            <Button onClick={handleDownloadCard} className="w-full">
              <DownloadIcon size={18} />
              Скачать PNG
            </Button>
          </div>
        )}

        {/* Настройки для текста */}
        {format === "text" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              <span>Включить заметки</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCheckins}
                onChange={(e) => setIncludeCheckins(e.target.checked)}
              />
              <span>Включить самочувствие</span>
            </label>
            <div>
              <label className="label">Превью</label>
              <textarea
                readOnly
                className="input min-h-[150px] resize-none"
                value={textPreview}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCopyText} variant="outline">
                <CopyIcon size={18} />
                Копировать
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([textPreview], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `text-${dateFrom}-${dateTo}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.push("Текст сохранён");
                }}
                variant="outline"
              >
                <DownloadIcon size={18} />
                Сохранить .txt
              </Button>
            </div>
          </div>
        )}

        {/* Настройки для HTML */}
        {format === "html" && (
          <div className="space-y-4">
            {/* Загрузка фото для HTML */}
            <div>
              <label className="label">Фото для отчёта (опционально)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    dark:file:bg-blue-900/30 dark:file:text-blue-300
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                    transition-colors cursor-pointer"
                />
                {photoUrl && (
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium"
                  >
                    Удалить
                  </button>
                )}
              </div>
              {photoUrl && (
                <div className="mt-2">
                  <img
                    src={photoUrl}
                    alt="Предпросмотр"
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Включить заметки</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCheckins}
                onChange={(e) => setIncludeCheckins(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Включить самочувствие</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeComment}
                onChange={(e) => setIncludeComment(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Мой комментарий</span>
            </label>
            {includeComment && (
              <div>
                <label className="label">Ваш комментарий к отчёту</label>
                <textarea
                  className="input min-h-[100px] resize-y"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Напишите что-нибудь от себя..."
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUserNote}
                onChange={(e) => setIncludeUserNote(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Добавить заметку</span>
            </label>
            {includeUserNote && (
              <textarea
                value={userNoteText}
                onChange={(e) => setUserNoteText(e.target.value)}
                placeholder="Ваш текст..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
              />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Анонимизировать</span>
            </label>
            {!anonymize && (
              <div>
                <label className="label">Имя участника (опционально)</label>
                <input
                  type="text"
                  className="input"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
            )}
            <Button onClick={handleDownloadHtml} className="w-full">
              <DownloadIcon size={18} />
              Скачать HTML
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
