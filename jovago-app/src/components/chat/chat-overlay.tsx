"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  getMessagesPage,
  sendMessage,
  getOtherUserProfile,
  getInboxItems,
  markLastMessageAsRead,
  markConversationAsRead,
  type InboxItem,
} from "@/app/actions/chat";
import type { DbMessage } from "@/app/actions/chat";
import type { Conversation, ChatMessage } from "@/lib/chat-data";
import { CurrentChat } from "@/components/chat/current-chat";
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary";
import { useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const SCROLL_LOAD_THRESHOLD = 80;

function dbMessageToChatMessage(
  m: DbMessage & { sender_id: string },
  myId: string,
  conversationId: string
): ChatMessage {
  const sentAt = new Date(m.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  return {
    id: m.id,
    conversationId,
    sender: m.sender_id === myId ? "me" : "them",
    text: m.content,
    sentAt,
    isRead: m.is_read === true,
    created_at: m.created_at,
  };
}

function ChatOverlayPanel({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { user } = useUser();
  const myId = user?.id ?? null;
  const { clearUnreadCount } = useChatStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const hasMoreOlderRef = useRef(hasMoreOlder);
  hasMoreOlderRef.current = hasMoreOlder;
  const loadingOlderRef = useRef(false);
  const prependScrollRestore = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const skipNextScrollToBottom = useRef(false);
  const firstLoadScrollDone = useRef(false);

  useEffect(() => {
    if (!myId || !userId) return;
    firstLoadScrollDone.current = false;
    setHasMoreOlder(true);
    let cancelled = false;
    getOtherUserProfile(userId).then((p) => {
      if (cancelled || !p) return;
      setConversation({
        id: userId,
        name: p.name,
        avatarInitials: p.avatarInitials,
        lastMessage: "",
        lastMessageAt: "",
        avatarUrl: p.avatarUrl ?? null,
        isOnline: p.isOnline,
      });
    });
    getMessagesPage(userId, { limit: PAGE_SIZE }).then((rows) => {
      if (cancelled || !myId) return;
      const list = Array.isArray(rows) ? rows : [];
      const reversed = list.reverse();
      const mapped = reversed.map((m) =>
        dbMessageToChatMessage(m as DbMessage & { sender_id: string }, myId, userId)
      );
      setMessages(mapped);
      setHasMoreOlder(list.length >= PAGE_SIZE);
    });
    markLastMessageAsRead(userId).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [myId, userId]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    const list = messagesRef.current;
    if (!el || list.length === 0 || loadingOlderRef.current || !hasMoreOlderRef.current) return;
    if (el.scrollTop > SCROLL_LOAD_THRESHOLD) return;
    const oldestCreatedAt = list[0]?.created_at;
    if (!oldestCreatedAt) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    prependScrollRestore.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight };

    getMessagesPage(userId, { before: oldestCreatedAt, limit: PAGE_SIZE }).then((olderRows) => {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
      setHasMoreOlder(olderRows.length >= PAGE_SIZE);
      if (olderRows.length > 0) {
        skipNextScrollToBottom.current = true;
        const olderMapped = olderRows
          .reverse()
          .map((m) =>
            dbMessageToChatMessage(m as DbMessage & { sender_id: string }, myId!, userId)
          );
        setMessages((prev) => [...olderMapped, ...prev]);
      }
    });
  }, [userId, myId]);

  useLayoutEffect(() => {
    const restore = prependScrollRestore.current;
    const el = scrollContainerRef.current;
    if (!restore || !el) return;
    const delta = el.scrollHeight - restore.scrollHeight;
    el.scrollTop = restore.scrollTop + delta;
    prependScrollRestore.current = null;
  }, [messages]);

  useEffect(() => {
    if (skipNextScrollToBottom.current) {
      skipNextScrollToBottom.current = false;
      return;
    }
    if (messages.length === 0) return;
    if (!firstLoadScrollDone.current) {
      scrollBottomRef.current?.scrollIntoView({ behavior: "auto" });
      firstLoadScrollDone.current = true;
      return;
    }
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark all messages from this sender to me as read when conversation opens or when new messages arrive. Sync badge immediately.
  useEffect(() => {
    if (!myId || !userId) return;
    markConversationAsRead(userId).then(() => {
      clearUnreadCount();
    });
  }, [myId, userId, messages, clearUnreadCount]);

  // Realtime: listen for new messages so the UI updates without refresh.
  useEffect(() => {
    if (!myId || !userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`overlay-messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { eventType: string; new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;
          const senderId = row.sender_id as string;
          const receiverId = row.receiver_id as string;
          const isForThis =
            (senderId === myId && receiverId === userId) ||
            (senderId === userId && receiverId === myId);
          if (!isForThis) return;
          const dbMsg = {
            id: row.id as string,
            sender_id: senderId,
            receiver_id: receiverId,
            content: row.content as string,
            created_at: row.created_at as string,
            is_read: (row.is_read as boolean) ?? false,
          };
          setMessages((prev) => {
            const asChat = dbMessageToChatMessage(
              dbMsg as DbMessage & { sender_id: string },
              myId,
              userId
            );
            if (prev.some((m) => m.id === asChat.id)) return prev;
            const hasOpt = prev.some(
              (m) => m.id.startsWith("opt-") && m.sender === "me" && m.text === asChat.text
            );
            if (hasOpt && senderId === myId) {
              return prev.map((m) =>
                m.id.startsWith("opt-") && m.sender === "me" && m.text === asChat.text
                  ? asChat
                  : m
              );
            }
            return [...prev, asChat];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload: { eventType: string; new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row || row.id == null) return;
          const isReadTrue = row.is_read === true || row.is_read === "t" || row.is_read === 1;
          if (!isReadTrue) return;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === String(row.id) ? { ...msg, isRead: true } : msg
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[ChatOverlay] Realtime channel error — new messages may not appear until refresh.");
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, userId]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!userId || !myId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      const optId = `opt-${Date.now()}`;
      const optMsg: ChatMessage = {
        id: optId,
        conversationId: userId,
        sender: "me",
        text: trimmed,
        sentAt: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        }),
      };
      setMessages((prev) => [...prev, optMsg]);
      setSending(true);
      const result = await sendMessage(userId, trimmed);
      setSending(false);
      if (!result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optId));
        toast.error(result.error);
        return;
      }
      if (result.success && "id" in result) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optId ? { ...m, id: result.id } : m))
        );
      }
    },
    [userId, myId]
  );

  if (!myId) return null;
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <CurrentChat
        conversation={conversation}
        messages={messages}
        recipientUserId={userId}
        receiverAvatarUrl={conversation.avatarUrl ?? null}
        receiverIsOnline={conversation.isOnline ?? false}
        onSendMessage={handleSendMessage}
        onReportUser={() => alert(`Report flow would open for ${conversation.name}.`)}
        loading={false}
        sending={sending}
        scrollContainerRef={scrollContainerRef}
        scrollBottomRef={scrollBottomRef}
        onScroll={handleScroll}
        loadingOlder={loadingOlder}
        hasMoreOlder={hasMoreOlder}
      />
    </ChatErrorBoundary>
  );
}

function ChatOverlayInbox({
  onSelect,
  onClose,
}: {
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const { user } = useUser();
  const myId = user?.id ?? null;
  const [inbox, setInbox] = useState<InboxItem[]>([]);

  useEffect(() => {
    if (!myId) return;
    getInboxItems().then(setInbox);
  }, [myId]);

  if (!myId) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-semibold text-foreground">Messages</h2>
        <p className="text-xs text-muted-foreground">Select a conversation to open</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {inbox.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No messages yet. Start a chat from a profile or the map.
          </p>
        ) : (
          <ul className="space-y-1">
            {inbox.map((item) => (
              <li key={item.senderId}>
                <button
                  type="button"
                  onClick={() => onSelect(item.senderId)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/80"
                  suppressHydrationWarning
                >
                  {item.senderAvatarUrl ? (
                    <img
                      src={item.senderAvatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {item.senderName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.senderName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.lastMessageSnippet}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ChatOverlay() {
  const { isChatOverlayOpen, activeChatUserId, openChat, closeChatOverlay } = useChatStore();
  const { user } = useUser();
  const myId = user?.id ?? null;

  if (!isChatOverlayOpen) return null;
  if (!myId) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40"
        aria-hidden
        onClick={closeChatOverlay}
      />
      <div
        className={cn(
          "fixed right-0 top-0 z-[100] flex h-[80vh] max-h-[600px] w-full flex-col bg-background shadow-xl pointer-events-auto",
          "sm:w-[420px] sm:max-w-[100vw]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold text-foreground">
            {activeChatUserId ? "Chat" : "Messages"}
          </h2>
          <button
            type="button"
            onClick={closeChatOverlay}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close chat"
            suppressHydrationWarning
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted pointer-events-auto">
          {activeChatUserId ? (
            <ChatOverlayPanel userId={activeChatUserId} onClose={closeChatOverlay} />
          ) : (
            <ChatOverlayInbox onSelect={openChat} onClose={closeChatOverlay} />
          )}
        </div>
      </div>
    </>
  );
}
