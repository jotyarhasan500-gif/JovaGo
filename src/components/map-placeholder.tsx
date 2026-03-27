"use client";

export function MapPlaceholder() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground">
      {/* Simple static SVG world map outline */}
      <svg
        viewBox="0 0 200 100"
        className="mb-4 h-24 w-full max-w-[200px] opacity-60"
        aria-hidden
      >
        <ellipse
          cx="100"
          cy="50"
          rx="95"
          ry="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <path
          d="M20 50 Q60 30 100 50 Q140 70 180 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.7"
        />
        <path
          d="M100 8 L100 92"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.7"
        />
        <circle cx="55" cy="35" r="3" fill="#0066FF" opacity="0.6" />
        <circle cx="120" cy="55" r="3" fill="#0066FF" opacity="0.6" />
        <circle cx="85" cy="42" r="2" fill="#0066FF" opacity="0.4" />
      </svg>
      <p className="text-sm font-medium">Map loading…</p>
      <p className="mt-1 text-xs">Traveler locations will appear here</p>
    </div>
  );
}
