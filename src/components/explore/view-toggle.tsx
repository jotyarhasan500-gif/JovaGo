"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "map";

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ mode, onModeChange, className }: ViewToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex rounded-lg border border-border bg-card p-0.5",
          className
        )}
        role="tablist"
        aria-label="View mode"
      >
        <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#525252]">
          <LayoutGrid className="size-4" aria-hidden />
          List
        </div>
        <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#525252]">
          <Map className="size-4" aria-hidden />
          Map
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-card p-0.5",
        className
      )}
      role="tablist"
      aria-label="View mode"
      suppressHydrationWarning
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "list"}
        onClick={() => onModeChange("list")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          mode === "list"
            ? "bg-[#0066FF] text-white"
            : "text-[#525252] hover:bg-[#0066FF]/5 hover:text-[#0066FF]"
        )}
        suppressHydrationWarning
      >
        <LayoutGrid className="size-4" aria-hidden />
        List
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "map"}
        onClick={() => onModeChange("map")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          mode === "map"
            ? "bg-[#0066FF] text-white"
            : "text-[#525252] hover:bg-[#0066FF]/5 hover:text-[#0066FF]"
        )}
        suppressHydrationWarning
      >
        <Map className="size-4" aria-hidden />
        Map
      </button>
    </div>
  );
}
