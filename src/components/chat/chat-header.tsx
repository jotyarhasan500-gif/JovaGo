"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChatHeaderProps {
  name: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  recipientUserId: string | null;
  onReport?: () => void;
  onBack?: () => void;
}

export function ChatHeader({
  name,
  avatarInitials,
  avatarUrl,
  isOnline: initialIsOnline,
  recipientUserId,
  onReport,
  onBack,
}: ChatHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const recipient = { full_name: name, avatar_url: avatarUrl ?? undefined };

  useEffect(() => {
    setIsOnline(initialIsOnline);
  }, [initialIsOnline]);

  useEffect(() => {
    if (!recipientUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`profile-online-${recipientUserId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${recipientUserId}` },
        (payload) => {
          const row = payload.new as { is_online?: boolean };
          setIsOnline(row.is_online === true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientUserId]);

  const showImage = Boolean(recipient.avatar_url) && !imgError;

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onBack}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <div className="relative shrink-0">
          {showImage ? (
            <img
              src={recipient.avatar_url || "/default-avatar.png"}
              alt={recipient.full_name}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover shadow-sm"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0066FF]/10 bg-[#0066FF]/15 text-sm font-medium text-[#0066FF]"
              aria-hidden
            >
              {avatarInitials}
            </div>
          )}
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-card"
              aria-label="Online"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-[#0a0a0a]">
            {name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400">Active now</span>
            ) : (
              <span>Offline</span>
            )}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReport}
        className="shrink-0 border-[#0066FF]/20 text-[#737373] hover:bg-[#fef2f2] hover:text-[#b91c1c] hover:border-[#b91c1c]/30"
      >
        <Flag className="mr-1.5 size-4" aria-hidden />
        Report user
      </Button>
    </header>
  );
}
