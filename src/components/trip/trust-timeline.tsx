import { CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: "ticket", label: "Ticket Verified" },
  { id: "hotel", label: "Hotel Confirmed" },
  { id: "identity", label: "Identity Cleared" },
] as const;

export function TrustTimeline() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#737373]">
        Trust timeline
      </h3>
      <div className="flex flex-wrap items-center gap-6 sm:gap-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            {index > 0 && (
              <span
                className="hidden h-px w-6 flex-1 bg-[#22c55e]/40 sm:block"
                aria-hidden
              />
            )}
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#22c55e]/15 text-[#22c55e]">
                <CheckCircle2 className="size-6" aria-hidden />
              </span>
              <span className="text-sm font-medium text-[#0a0a0a]">
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
