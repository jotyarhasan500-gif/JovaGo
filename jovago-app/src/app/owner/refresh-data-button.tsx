"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshDataButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => router.refresh()}
      suppressHydrationWarning
    >
      <RefreshCw className="size-4 shrink-0" aria-hidden />
      Refresh Data
    </Button>
  );
}
