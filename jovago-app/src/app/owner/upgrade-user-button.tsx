"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { upgradeUserToUltimate } from "@/app/actions/owner";
import { toast } from "sonner";
import { Crown } from "lucide-react";

export function UpgradeUserButton({
  userId,
  currentTier,
  disabled,
}: {
  userId: string;
  currentTier: string | null;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isUltimate = (currentTier?.toLowerCase() ?? "") === "ultimate";

  async function handleClick() {
    setLoading(true);
    const result = await upgradeUserToUltimate(userId);
    setLoading(false);
    if (result.success) {
      toast.success("User upgraded to Ultimate.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Upgrade failed.");
    }
  }

  if (isUltimate) {
    return (
      <span className="text-xs text-muted-foreground">Ultimate</span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading || disabled}
      suppressHydrationWarning
    >
      <Crown className="size-3.5 shrink-0" aria-hidden />
      {loading ? "Upgrading…" : "Upgrade to Ultimate"}
    </Button>
  );
}
