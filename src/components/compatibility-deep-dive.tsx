"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CompatibilityBreakdown } from "@/lib/compatibility-score";
import { Heart, Wallet, Compass, MessageSquare } from "lucide-react";

const THEME = {
  bg: "bg-[#e8f0fe]",
  border: "border-[#0066FF]/15",
  track: "bg-[#0066FF]/10",
  indicator: "bg-[#0066FF]",
  text: "text-[#0a0a0a]",
  muted: "text-[#5f6368]",
  verdictBg: "bg-white/80",
} as const;

const progressBarClass =
  "[&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-track]]:bg-[#0066FF]/10 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[#0066FF] [&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-500";

type Props = {
  breakdown: CompatibilityBreakdown;
  className?: string;
};

export function CompatibilityDeepDive({ breakdown, className }: Props) {
  const { interestAlignment, budgetSync, styleMatch, verdict } = breakdown;

  return (
    <Card
      className={cn(
        "overflow-hidden border-[#0066FF]/15",
        THEME.bg,
        className
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className={cn("text-lg font-semibold", THEME.text)}>
          Compatibility Deep-Dive
        </CardTitle>
        <p className={cn("text-sm", THEME.muted)}>
          How you align with this traveler
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn("flex items-center gap-2 text-sm font-medium", THEME.text)}>
                <Heart className="size-4 text-[#0066FF]" aria-hidden />
                Interest Alignment
              </span>
              <span className={cn("text-sm tabular-nums", THEME.muted)}>
                {interestAlignment}%
              </span>
            </div>
            <div className={cn(progressBarClass)}>
              <Progress value={interestAlignment} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn("flex items-center gap-2 text-sm font-medium", THEME.text)}>
                <Wallet className="size-4 text-[#0066FF]" aria-hidden />
                Budget Sync
              </span>
              <span className={cn("text-sm tabular-nums", THEME.muted)}>
                {budgetSync}%
              </span>
            </div>
            <div className={cn(progressBarClass)}>
              <Progress value={budgetSync} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn("flex items-center gap-2 text-sm font-medium", THEME.text)}>
                <Compass className="size-4 text-[#0066FF]" aria-hidden />
                Style Match
              </span>
              <span className={cn("text-sm tabular-nums", THEME.muted)}>
                {styleMatch}%
              </span>
            </div>
            <div className={cn(progressBarClass)}>
              <Progress value={styleMatch} />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex gap-3 rounded-xl border border-[#0066FF]/10 p-4",
            THEME.verdictBg
          )}
        >
          <MessageSquare className="size-5 shrink-0 text-[#0066FF]" aria-hidden />
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-wide", THEME.muted)}>
              Compatibility Verdict
            </p>
            <p className={cn("mt-1 text-sm leading-relaxed", THEME.text)}>
              {verdict}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
