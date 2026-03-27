"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resetAllCache } from "@/app/actions/owner";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function ResetCacheButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handleClick() {
    setLoading(true);
    const result = await resetAllCache();
    setLoading(false);
    if (result.success) {
      toast.success("System cache cleared.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to reset cache.");
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      suppressHydrationWarning
    >
      <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} aria-hidden />
      {loading ? "Resetting…" : "Reset All System Cache"}
    </Button>
  );
}
