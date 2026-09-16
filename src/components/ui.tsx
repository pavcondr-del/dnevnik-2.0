"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn, uid } from "../lib/utils";
import { CheckIcon, XIcon } from "./icons";

/* ---------- Card ---------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("card p-4 sm:p-5", className)}>{children}</div>;
}

/* ---------- Button ---------- */
type Variant = "primary" | "outline" | "ghost" | "danger" | "good" | "soft";
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-black font-semibold hover:brightness-110 shadow-[0_6px_16px_-6px_var(--color-accent)]",
  soft: "bg-accent-soft text-accent hover:bg-accent-line/40 font-medium",
  outline:
    "border border-line bg-elev text-txt hover:border-accent-line hover:text-accent",
  ghost: "text-mut hover:bg-elev hover:text-txt",
  danger: "bg-bad/15 text-bad hover:bg-bad/25 font-medium",
  good: "bg-good/15 text-good hover:bg-good/25 font-medium",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        size === "sm" && "px-3 py-1.5 text-[13px]",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-[15px]",
        className
      )}
      {...rest}
    />
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "anim-pop flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-card shadow-pop sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-base font-semibold">{title}</h3>
            <button className="icon-btn -mr-2" onClick={onClose} aria-label="Закрыть">
              <XIcon size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 py-3.5">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl border border-line bg-elev p-1",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition",
            value === o.value
              ? "bg-accent text-black shadow"
              : "text-mut hover:text-txt"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-accent" : "bg-line"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <div className="mb-3 text-4xl opacity-80">{emoji}</div>
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-mut">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Badge ---------- */
export function Badge({
  children,
  color = "default",
  className,
}: {
  children: ReactNode;
  color?: "default" | "accent" | "good" | "warn" | "bad" | "teal";
  className?: string;
}) {
  const colors: Record<string, string> = {
    default: "bg-elev text-mut border-line",
    accent: "bg-accent-soft text-accent border-accent-line",
    good: "bg-good/10 text-good border-good/30",
    warn: "bg-warn/10 text-warn border-warn/30",
    bad: "bg-bad/10 text-bad border-bad/30",
    teal: "bg-teal/10 text-teal border-teal/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Toasts ---------- */
interface Toast {
  id: string;
  text: string;
  kind: "ok" | "err";
}

const ToastCtx = createContext<{ push: (text: string, kind?: "ok" | "err") => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const push = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, text, kind }]);
    timers.current[id] = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-pop pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-elev px-4 py-2.5 text-sm shadow-pop"
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                t.kind === "ok" ? "bg-good/20 text-good" : "bg-bad/20 text-bad"
              )}
            >
              {t.kind === "ok" ? <CheckIcon size={13} /> : <XIcon size={13} />}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast вне ToastProvider");
  return ctx;
}

/* ---------- Подтверждение ---------- */
export function ConfirmModal({
  open,
  title,
  text,
  confirmLabel = "Удалить",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-mut">{text}</p>
    </Modal>
  );
}
