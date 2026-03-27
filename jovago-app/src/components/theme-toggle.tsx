"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  overHero,
}: {
  className?: string;
  /** When true, use white icon so it reads on hero background */
  overHero?: boolean;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn("flex size-9 items-center justify-center rounded-lg", className)}
        aria-hidden
      >
        <span className="size-4 rounded-full bg-current opacity-30" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      suppressHydrationWarning={true}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-lg transition-colors",
        overHero
          ? "text-zinc-900 hover:bg-zinc-900/10 hover:text-zinc-800 dark:text-white/90 dark:hover:bg-white/10 dark:hover:text-white"
          : "text-foreground/80 hover:bg-foreground/10 hover:text-foreground dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        className={cn(
          "size-4 transition-transform duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "absolute size-4 transition-transform duration-300",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
        aria-hidden
      />
    </button>
  );
}
