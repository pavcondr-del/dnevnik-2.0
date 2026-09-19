"use client";
import type { ReactNode } from "react";
import { clamp } from "../lib/utils";

export function Ring({
  value,
  target,
  size = 176,
  stroke = 15,
  color = "var(--color-accent)",
  trackColor = "var(--color-elev)",
  children,
  overColor = "var(--color-bad)",
}: {
  value: number;
  target: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  overColor?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;
  const over = target > 0 && value > target * 1.05;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        className="-rotate-90"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Прогресс: ${Math.round(pct * 100)}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? overColor : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{
            transition: "stroke-dashoffset .7s cubic-bezier(.2,.9,.3,1), stroke .3s",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/** Маленькое кольцо для макронутриентов */
export function MiniRing({
  value,
  target,
  size = 64,
  stroke = 7,
  color,
  label,
}: {
  value: number;
  target: number;
  size?: number;
  stroke?: number;
  color: string;
  label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          width={size} 
          height={size} 
          className="-rotate-90"
          role="progressbar"
          aria-valuenow={Math.round(pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${Math.round(pct * 100)}%`}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-elev)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
      </div>
      <span className="text-xs font-medium text-mut">{label}</span>
    </div>
  );
}
