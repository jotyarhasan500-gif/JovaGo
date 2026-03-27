"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.log("Redirecting because...", "App error boundary caught error", error?.message, error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#0066FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0052CC]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm text-[#0066FF] hover:underline"
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}
