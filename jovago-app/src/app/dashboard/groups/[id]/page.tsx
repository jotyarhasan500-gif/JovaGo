"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Legacy route: /dashboard/groups/[id] redirects to the unified messenger
 * so all group chat happens at /messages?to=group:[id].
 */
export default function DashboardGroupIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : null;

  useEffect(() => {
    if (id) {
      router.replace(`/messages?to=group:${encodeURIComponent(id)}`);
    } else {
      router.replace("/dashboard/groups");
    }
  }, [id, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      <p className="text-sm">Redirecting to messages…</p>
    </div>
  );
}
