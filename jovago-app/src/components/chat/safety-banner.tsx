import { ShieldAlert } from "lucide-react";

export function SafetyBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#0066FF]/20 bg-[#0066FF]/5 px-4 py-3 text-sm text-[#525252]">
      <ShieldAlert className="size-5 shrink-0 text-[#0066FF]" aria-hidden />
      <p>
        For your safety, never share financial details. Meet in public places.
      </p>
    </div>
  );
}
