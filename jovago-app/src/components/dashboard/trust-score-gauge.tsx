"use client";

import { cn } from "@/lib/utils";

const SIZE = 120;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

type Props = {
  score: number;
  className?: string;
};

export function TrustScoreGauge({ score, className }: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm",
        className
      )}
    >
      <div className="relative" aria-hidden>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-slate-600"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-[#0066FF] transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-slate-100">
            {clamped}
          </span>
          <span className="text-xs font-medium text-slate-400">/ 100</span>
        </div>
      </div>
      <p className="text-center text-sm font-medium text-slate-400">
        Trust Score
      </p>
    </div>
  );
}
