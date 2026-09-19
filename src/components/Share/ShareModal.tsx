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
  const [includeCardMacros, setIncludeCardMacros] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [cardStyle, setCardStyle] = useState<ShareCardStyle>("minimal");
  const [cardSize, setCardSize] = useState<ShareCardSize>("square");
  const [anonymize, setAnonymize] = useState(false);
  const [showCardNote, setShowCardNote] = useState(false);
  const [cardNote, setCardNote] = useState("");
  const [cardPhoto, setCardPhoto] = useState<string | undefined>(undefined);
  const [showHtmlNote, setShowHtmlNote] = useState(false);
  const [htmlNote, setHtmlNote] = useState("");
  const [messengerNote, setMessengerNote] = useState("");

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
    includeMacros,
    includeCardMacros,
    authorName,
    cardStyle,
    cardSize,
    anonymize,
    comment: undefined,
    cardNote: showCardNote ? (cardNote || undefined) : undefined,
    cardPhoto: showCardNote ? cardPhoto : undefined,
    htmlNote: showHtmlNote ? (htmlNote || undefined) : undefined,
    messengerNote: messengerNote || undefined,
  }), [format, period, dateFrom, dateTo, includeNotes, includeCheckins, includeWeight, includeMacros, includeCardMacros, authorName, cardStyle, cardSize, anonymize, showCardNote, cardNote, cardPhoto, showHtmlNote, htmlNote, messengerNote]);

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
              <span>Анонимизировать</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCardNote}
                onChange={(e) => setShowCardNote(e.target.checked)}
              />
              <span>Заметка</span>
            </label>
            {showCardNote && (
              <>
                <div>
                  <label className="label">Текст заметки</label>
                  <textarea
                    className="input min-h-[80px] resize-y"
                    value={cardNote}
                    onChange={(e) => setCardNote(e.target.value)}
                    placeholder="Ваша заметка..."
                  />
                </div>
                <div>
                  <label className="label">Фото фона</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setCardPhoto(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="btn-outline px-4 py-2 rounded cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700">
                      Загрузить фото
                    </label>
                    {cardPhoto && (
                      <button
                        onClick={() => setCardPhoto(undefined)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCardMacros}
                onChange={(e) => setIncludeCardMacros(e.target.checked)}
              />
              <span>Добавить КБЖУ</span>
            </label>
            <Button onClick={handleDownloadCard} className="w-full">
              <DownloadIcon size={18} />
              Скачать PNG
            </Button>
          </div>
        )}

        {/* Настройки для HTML */}
        {format === "html" && (
          <div className="space-y-4">
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
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
              />
              <span>Анонимизировать</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHtmlNote}
                onChange={(e) => setShowHtmlNote(e.target.checked)}
              />
              <span>Заметка</span>
            </label>
            {showHtmlNote && (
              <div>
                <label className="label">Текст заметки</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={htmlNote}
                  onChange={(e) => setHtmlNote(e.target.value)}
                  placeholder="Ваша заметка..."
                />
              </div>
            )}
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

        {/* Настройки для текста (мессенджер) */}
        {format === "text" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCheckins}
                onChange={(e) => setIncludeCheckins(e.target.checked)}
              />
              <span>Включить самочувствие</span>
            </label>
            <div>
              <label className="label">Заметки</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={messengerNote}
                onChange={(e) => setMessengerNote(e.target.value)}
                placeholder="Ваша заметка для мессенджера..."
              />
            </div>
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
      </div>
    </Modal>
  );
}
