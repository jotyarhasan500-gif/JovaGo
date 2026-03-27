"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unblockUser } from "@/app/actions/safety-privacy";
import type { BlockedUserEntry } from "@/app/actions/safety-privacy";
import { UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  blockedUsers: BlockedUserEntry[];
  className?: string;
};

export function BlockList({ blockedUsers, className }: Props) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleUnblock(blockedId: string) {
    setRemovingId(blockedId);
    const result = await unblockUser(blockedId);
    setRemovingId(null);
    if (result.success) {
      router.refresh();
      toast.success("User unblocked.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card className={cn("border-[#0066FF]/10", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0a0a0a]">
          <UserX className="size-5 text-[#0066FF]" />
          Blocked users
        </CardTitle>
        <CardDescription>
          Users you have blocked cannot message you. You can unblock them here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-[#737373]">
            You haven’t blocked anyone yet. You can block a user from their profile.
          </p>
        ) : (
          <ul className="space-y-2">
            {blockedUsers.map((entry) => (
              <li
                key={entry.blocked_id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2"
              >
                <Link
                  href={`/profile/${entry.blocked_id}`}
                  className="font-medium text-[#0a0a0a] hover:text-[#0066FF] hover:underline"
                >
                  {entry.full_name || "Unknown user"}
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={removingId === entry.blocked_id}
                  onClick={() => handleUnblock(entry.blocked_id)}
                >
                  {removingId === entry.blocked_id ? "Removing…" : "Unblock"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
