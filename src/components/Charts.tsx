"use client";
import { fmt } from "../lib/utils";
import { cn } from "../lib/utils";

/* ---------- ProgressBar ---------- */
export function ProgressBar({
  value,
  max,
  color = "var(--color-accent)",
  className,
}: {
  value: number;
  max: number;
  color?: string;
  className?: string;
}) {
  const raw = (value / max) * 100;
  const barColor = raw > 100 ? "var(--color-bad)" : color;
  const percentage = Math.min(raw, 100);

  return (
    <div className={cn("h-2 rounded-full bg-[var(--color-line)] overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${percentage}%`,
          background: barColor,
        }}
      />
    </div>
  );
}

/* ---------- StatCard ---------- */
export function StatCard({
  value,
  label,
  color,
  className,
}: {
  value: string | number;
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <div className={cn("card-flat p-3 text-center", className)}>
      <p className="text-[20px] font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[11px] text-[var(--color-faint)] mt-0.5">{label}</p>
    </div>
  );
}

/* ---------- Столбчатый график калорий по дням ---------- */
export function CalorieBars({
  data,
  target,
  height = 170,
}: {
  data: { label: string; value: number; burned: number; isToday?: boolean }[];
  target: number;
  height?: number;
}) {
  const max = Math.max(target * 1.15, ...data.map((d) => Math.max(d.value, d.burned)), 1);
  return (
    <div>
      <div className="relative" style={{ height }}>
        {/* линия цели */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-warn/60"
          style={{ bottom: 18 + (target / max) * (height - 18) }}
        >
          <span className="absolute -top-2.5 right-0 rounded bg-warn/15 px-1 text-[10px] font-medium text-warn">
            {fmt(target)}
          </span>
        </div>
        <div className="flex h-full items-end gap-[3px]">
          {data.map((d, i) => {
            const h = d.value > 0 ? (d.value / max) * (height - 18) : 2;
            const hBurned = d.burned > 0 ? (d.burned / max) * (height - 18) : 2;
            const over = d.value > target * 1.08;
            return (
              <div key={i} className="group relative flex h-full flex-1 flex-col justify-end gap-[2px]">
                {/* Столбец полученных калорий */}
                <div
                  className="relative w-full rounded-t-[4px] transition-all duration-500"
                  style={{
                    height: h,
                    background: over
                      ? "var(--color-bad)"
                      : d.isToday
                        ? "var(--color-teal)"
                        : "var(--color-accent)",
                    opacity: d.value > 0 ? 1 : 0.25,
                  }}
                >
                  {d.value > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-white drop-shadow-sm">
                        +{fmt(d.value)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Столбец сожжённых калорий */}
                {d.burned > 0 && (
                  <div
                    className="relative w-full rounded-t-[4px] transition-all duration-500"
                    style={{
                      height: hBurned,
                      background: "var(--color-bad)",
                      opacity: 0.85,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-white drop-shadow-sm">
                        -{fmt(d.burned)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-elev px-1.5 py-0.5 text-[10px] opacity-0 shadow-pop transition group-hover:opacity-100">
                  +{fmt(d.value)} / -{fmt(d.burned)} ккал
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {data.map((d, i) => (
          <div
            key={i}
            className={
              "flex-1 text-center text-[10px] " +
              (d.isToday ? "font-bold text-teal" : "text-faint")
            }
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Линейный график веса ---------- */
export function WeightLine({
  data,
  height = 150,
}: {
  data: { date: string; kg: number }[];
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-line text-sm text-mut"
        style={{ height }}
      >
        Нужно минимум 2 измерения
      </div>
    );
  }

  const w = 600;
  const pad = { top: 16, bottom: 22, left: 8, right: 8 };
  const ks = data.map((d) => d.kg);
  let min = Math.min(...ks);
  let max = Math.max(...ks);
  if (max - min < 1) {
    min -= 0.5;
    max += 0.5;
  }

  const innerH = height - pad.top - pad.bottom;
  const innerW = w - pad.left - pad.right;
  const x = (i: number) => pad.left + (i / (data.length - 1)) * innerW;
  const y = (kg: number) => pad.top + (1 - (kg - min) / (max - min)) * innerH;

  const line = data.map((d, i) => `${x(i)},${y(d.kg)}`).join(" ");
  const area = `${pad.left},${height - pad.bottom} ${line} ${x(data.length - 1)},${height - pad.bottom}`;

  const first = data[0];
  const last = data[data.length - 1];
  const diff = Math.round((last.kg - first.kg) * 10) / 10;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
        <polygon points={area} fill="var(--color-accent)" opacity={0.12} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.kg)}
            r={i === data.length - 1 ? 4 : 2.2}
            fill={i === data.length - 1 ? "var(--color-teal)" : "var(--color-accent)"}
          />
        ))}
        <text x={pad.left} y={height - 6} fontSize="11" fill="var(--color-faint)">
          {first.kg} кг
        </text>
        <text x={w - pad.right} y={height - 6} fontSize="11" fill="var(--color-teal)" textAnchor="end">
          {last.kg} кг
        </text>
      </svg>
      <div className="mt-1 flex items-center justify-center gap-2 text-xs text-mut">
        <span>Динамика:</span>
        <span className={diff <= 0 ? "font-semibold text-good" : "font-semibold text-warn"}>
          {diff > 0 ? "+" : ""}
          {diff} кг
        </span>
      </div>
    </div>
  );
}

/* ---------- Пончик БЖУ ---------- */
export function MacroDonut({
  protein,
  fat,
  carbs,
  size = 170,
}: {
  protein: number;
  fat: number;
  carbs: number;
  size?: number;
}) {
  const segments = [
    { value: protein * 4, color: "var(--color-teal)", label: "Белки", grams: protein },
    { value: fat * 9, color: "var(--color-warn)", label: "Жиры", grams: fat },
    { value: carbs * 4, color: "var(--color-accent)", label: "Углеводы", grams: carbs },
  ];

  const total = segments.reduce((s, x) => s + x.value, 0);
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-elev)"
            strokeWidth={stroke}
          />
          {total > 0 &&
            segments.map((s, i) => {
              const frac = s.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  style={{ transition: "stroke-dasharray .6s ease" }}
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{fmt(total)}</span>
          <span className="text-[11px] text-mut">ккал/день</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="w-20 text-mut">{s.label}</span>
            <span className="font-semibold">{fmt(s.grams)} г</span>
            {total > 0 && (
              <span className="w-10 text-right text-xs text-faint">
                {Math.round((s.value / total) * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
