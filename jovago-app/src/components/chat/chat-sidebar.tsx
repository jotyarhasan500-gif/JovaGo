"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/chat-data";

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  loading = false,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#737373]">
          Conversations
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2">
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No conversations yet. Message a buddy from their profile or the map.
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
                <Avatar className="size-10 shrink-0 border border-[#0066FF]/10">
                  <AvatarFallback className="bg-[#0066FF]/15 text-sm font-medium text-[#0066FF]">
                    {conv.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{conv.name}</span>
                    {conv.unread != null && conv.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-[#0066FF] px-1.5 py-0.5 text-xs font-medium text-white">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-[#737373]">
                    {conv.lastMessage}
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
