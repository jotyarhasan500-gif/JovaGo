import { cn } from "@/lib/utils";

/** Color themes for Travel DNA badges - glass-morphism style */
const TRAIT_STYLES: Record<string, string> = {
  "Early Bird": "bg-amber-400/20 text-amber-800 ring-1 ring-amber-400/30",
  "Night Owl": "bg-indigo-400/20 text-indigo-800 ring-1 ring-indigo-400/30",
  "Slow Traveler": "bg-emerald-400/20 text-emerald-800 ring-1 ring-emerald-400/30",
  "Fast Packer": "bg-rose-400/20 text-rose-800 ring-1 ring-rose-400/30",
  "Foodie Explorer": "bg-orange-400/20 text-orange-800 ring-1 ring-orange-400/30",
  "Culture Buff": "bg-violet-400/20 text-violet-800 ring-1 ring-violet-400/30",
  "Adventure Seeker": "bg-sky-400/20 text-sky-800 ring-1 ring-sky-400/30",
  "Wellness Seeker": "bg-teal-400/20 text-teal-800 ring-1 ring-teal-400/30",
  "Digital Nomad": "bg-cyan-400/20 text-cyan-800 ring-1 ring-cyan-400/30",
  "Splurge Traveler": "bg-fuchsia-400/20 text-fuchsia-800 ring-1 ring-fuchsia-400/30",
};

const DEFAULT_STYLE =
  "bg-[#0066FF]/15 text-[#0066FF] ring-1 ring-[#0066FF]/25";

interface TravelDnaSectionProps {
  traits: string[];
  className?: string;
}

export function TravelDnaSection({ traits, className }: TravelDnaSectionProps) {
  if (!traits.length) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/40 bg-white/60 p-5 shadow-lg shadow-black/5 backdrop-blur-xl",
        className
      )}
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#737373]">
        Travel DNA
      </h3>
      <div className="flex flex-wrap gap-2">
        {traits.map((trait) => (
          <span
            key={trait}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur-sm",
              TRAIT_STYLES[trait] ?? DEFAULT_STYLE
            )}
          >
            {trait}
          </span>
        ))}
      </div>
    </div>
  );
}
