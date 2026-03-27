"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinGroupByInviteCode } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function JoinGroupForm({ initialCode = "" }: { initialCode?: string }) {
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialCode) setInviteCode(initialCode);
  }, [initialCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await joinGroupByInviteCode(inviteCode);
      if (result.success) {
        toast.success("You joined the group.");
        setInviteCode("");
        router.push("/dashboard/groups");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (_err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[140px]">
        <label htmlFor="invite-code" className="sr-only">
          Invite code
        </label>
        <Input
          id="invite-code"
          type="text"
          placeholder="Invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500"
          disabled={loading}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        className="border-slate-700 shrink-0"
        disabled={loading || !inviteCode.trim()}
      >
        {loading ? "Joining…" : "Join Group"}
      </Button>
    </form>
  );
}
