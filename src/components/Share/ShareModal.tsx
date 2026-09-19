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
  }), [format, period, dateFrom, dateTo, includeNotes, includeCheckins, includeWeight, showMacros, authorName, cardStyle, cardSize, anonymize, includeComment, commentText, photoUrl]);

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
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700
                    cursor-pointer"
                />
                {photoUrl && (
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="text-red-400 hover:text-red-300 text-sm"
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
                    className="h-20 w-20 object-cover rounded-md border border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Чекбокс для отображения КБЖУ */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMacros}
                onChange={(e) => setShowMacros(e.target.checked)}
              />
              <span>Показать КБЖУ и ккал</span>
            </label>

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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
              />
              <span>Скрыть имя</span>
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeComment}
                onChange={(e) => setIncludeComment(e.target.checked)}
              />
              <span>Мой комментарий</span>
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
              />
              <span>Анонимизировать</span>
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
