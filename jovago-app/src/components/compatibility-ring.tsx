"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIZE = 44;
const STROKE = 3;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface CompatibilityRingProps {
  score: number;
  reasons: string[];
  className?: string;
}

export function CompatibilityRing({
  score,
  reasons,
  className,
}: CompatibilityRingProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={(e) => e.preventDefault()}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-full border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/50",
          "rounded-full bg-white/80 shadow-lg backdrop-blur-md ring-1 ring-white/50",
          className
        )}
        aria-label={`${clamped}% match. ${reasons.join(". ")}`}
      >
        <svg
          width={SIZE}
          height={SIZE}
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-[#0066FF]/15"
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
            className="text-[#0066FF] transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <span className="relative flex flex-col items-center leading-tight">
          <span className="text-xs font-bold text-[#0066FF]">{clamped}%</span>
          <span className="text-[10px] font-medium text-[#737373]">Match</span>
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[220px] border-white/20 bg-white/95 px-3 py-2.5 text-left shadow-xl backdrop-blur-md"
      >
        <p className="mb-1.5 text-xs font-semibold text-[#0a0a0a]">
          Why you match
        </p>
        <ul className="space-y-1 text-xs text-[#525252]">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-1.5">
              <span className="size-1 rounded-full bg-[#0066FF]" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
