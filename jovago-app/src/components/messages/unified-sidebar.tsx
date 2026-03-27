"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { UnifiedConversation } from "@/app/actions/messages";
import { Users } from "lucide-react";

interface UnifiedSidebarProps {
  conversations: UnifiedConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function UnifiedSidebar({
  conversations,
  selectedId,
  onSelect,
  loading = false,
}: UnifiedSidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Messages
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2">
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No conversations yet. Join a group or message someone from their profile.
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  selectedId === conv.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {conv.type === "group" ? (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                ) : (
                  <Avatar className="size-10 shrink-0 border border-border">
                    {conv.avatarUrl ? (
                      <AvatarImage src={conv.avatarUrl} alt="" referrerPolicy="no-referrer" />
                    ) : null}
                    <AvatarFallback className="bg-primary/15 text-sm font-medium text-primary">
                      {conv.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{conv.name}</span>
                    {conv.unread != null && conv.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {conv.lastMessage || "No messages yet"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
