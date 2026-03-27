"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UnifiedSidebar } from "@/components/messages/unified-sidebar";
import { GroupChat } from "@/components/groups/group-chat";
import { CurrentChat } from "@/components/chat/current-chat";
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary";
import { getUnifiedConversations, type UnifiedConversation } from "@/app/actions/messages";
import {
  getMessages,
  sendMessage,
  getOtherUserProfile,
  markLastMessageAsRead,
  markConversationAsRead,
} from "@/app/actions/chat";
import type { DbMessage } from "@/app/actions/chat";
import type { Conversation, ChatMessage } from "@/lib/chat-data";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/chat-store";
import { playNotificationSound } from "@/lib/notification-sound";
import { toast } from "sonner";

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
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useUser();
  const myId = user?.id ?? null;
  const { clearUnreadCount } = useChatStore();
  const searchParams = useSearchParams();
  const toParam = searchParams.get("to");
  const groupIdParam = searchParams.get("groupId");
  const userIdParam = searchParams.get("userId");
  const initialSelected =
    toParam ??
    (userIdParam ? `user:${userIdParam}` : null) ??
    (groupIdParam ? `group:${groupIdParam}` : null);

  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [loading, setLoading] = useState(true);

  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    name: string;
    avatarInitials: string;
    avatarUrl: string | null;
    isOnline: boolean;
  } | null>(null);

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null;
    return conversations.find((c) => c.id === selectedId) ?? null;
  }, [conversations, selectedId]);

  const isGroup = selectedId?.startsWith("group:") ?? false;
  const groupId = isGroup && selectedId ? selectedId.slice(7) : null;
  const privateUserId = !isGroup && selectedId?.startsWith("user:") ? selectedId.slice(5) : null;

  const conversationForCurrentChat = useMemo((): Conversation | null => {
    if (!privateUserId) return null;
    if (selectedConversation && selectedConversation.type === "private") {
      return {
        id: privateUserId,
        name: selectedConversation.name,
        avatarInitials: selectedConversation.avatarInitials,
        lastMessage: selectedConversation.lastMessage,
        lastMessageAt: selectedConversation.lastMessageAt,
        avatarUrl: selectedConversation.avatarUrl ?? null,
        isOnline: false,
      };
    }
    if (otherUserProfile) {
      return {
        id: privateUserId,
        name: otherUserProfile.name,
        avatarInitials: otherUserProfile.avatarInitials,
        lastMessage: "",
        lastMessageAt: "",
        avatarUrl: otherUserProfile.avatarUrl ?? null,
        isOnline: otherUserProfile.isOnline ?? false,
      };
    }
    return {
      id: privateUserId,
      name: "Loading…",
      avatarInitials: "…",
      lastMessage: "",
      lastMessageAt: "",
      avatarUrl: null,
      isOnline: false,
    };
  }, [privateUserId, selectedConversation, otherUserProfile]);

  useEffect(() => {
    if (!myId) {
      setLoading(false);
      return;
    }
    getUnifiedConversations().then((list) => {
      setConversations(list);
      setLoading(false);
    });
  }, [myId]);

  useEffect(() => {
    const next =
      toParam ??
      (userIdParam ? `user:${userIdParam}` : null) ??
      (groupIdParam ? `group:${groupIdParam}` : null);
    setSelectedId(next);
    if (userIdParam && !toParam) {
      router.replace(`/messages?to=user:${encodeURIComponent(userIdParam)}`, { scroll: false });
    } else if (groupIdParam && !toParam && next) {
      router.replace(`/messages?to=${encodeURIComponent(next)}`, { scroll: false });
    }
  }, [toParam, userIdParam, groupIdParam, router]);

  useEffect(() => {
    if (!myId || !privateUserId) {
      setPrivateMessages([]);
      setOtherUserProfile(null);
      return;
    }
    let cancelled = false;
    getMessages(privateUserId).then((rows) => {
      if (cancelled) return;
      const list = Array.isArray(rows) ? rows : [];
      const mapped = list.map((m) =>
        dbMessageToChatMessage(m as DbMessage & { sender_id: string }, myId, privateUserId)
      );
      setPrivateMessages(mapped);
    });
    markLastMessageAsRead(privateUserId).catch((err) =>
      console.warn("[Messages] markLastMessageAsRead:", err)
    );
    return () => {
      cancelled = true;
    };
  }, [myId, privateUserId]);

  useEffect(() => {
    if (!myId || !privateUserId) return;
    markConversationAsRead(privateUserId).then(() => {
      clearUnreadCount();
    });
  }, [myId, privateUserId, clearUnreadCount]);

  useEffect(() => {
    if (!myId || !privateUserId) return;
    const isInList = conversations.some((c) => c.id === `user:${privateUserId}`);
    if (isInList) {
      setOtherUserProfile(null);
      return;
    }
    let cancelled = false;
    getOtherUserProfile(privateUserId).then((p) => {
      if (!cancelled && p) setOtherUserProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [myId, privateUserId, conversations]);

  useEffect(() => {
    if (!myId || !privateUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("messages-unified-private")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;
          const senderId = row.sender_id as string;
          const receiverId = row.receiver_id as string;
          const isForThis =
            (senderId === myId && receiverId === privateUserId) ||
            (senderId === privateUserId && receiverId === myId);
          if (receiverId === myId && senderId !== myId) {
            playNotificationSound({
              onlyWhenUnfocusedOrDifferentChat: true,
              isDifferentChat: !isForThis,
            });
          }
          if (!isForThis) return;
          const dbMsg = {
            id: row.id as string,
            sender_id: senderId,
            receiver_id: receiverId,
            content: row.content as string,
            created_at: row.created_at as string,
            is_read: (row.is_read as boolean) ?? false,
          };
          setPrivateMessages((prev) => {
            const asChat = dbMessageToChatMessage(
              dbMsg as DbMessage & { sender_id: string },
              myId,
              privateUserId
            );
            if (prev.some((m) => m.id === asChat.id)) return prev;
            return [...prev, asChat];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row || row.id == null) return;
          const isReadTrue =
            row.is_read === true || row.is_read === "t" || row.is_read === 1;
          if (!isReadTrue) return;
          setPrivateMessages((prev) =>
            prev.map((msg) =>
              msg.id === String(row.id) ? { ...msg, isRead: true } : msg
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, privateUserId]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/messages?to=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router]
  );

  const handleBack = useCallback(() => {
    setSelectedId(null);
    router.replace("/messages", { scroll: false });
  }, [router]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!privateUserId || !myId) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const optId = `opt-${Date.now()}`;
      const optMsg: ChatMessage = {
        id: optId,
        conversationId: privateUserId,
        sender: "me",
        text: trimmed,
        sentAt: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        }),
      };
      setPrivateMessages((prev) => [...prev, optMsg]);
      setSending(true);
      const result = await sendMessage(privateUserId, trimmed);
      setSending(false);
      if (!result.success) {
        setPrivateMessages((prev) => prev.filter((m) => m.id !== optId));
        toast.error(result.error);
        return;
      }
      if (result.success && "id" in result) {
        setPrivateMessages((prev) =>
          prev.map((m) => (m.id === optId ? { ...m, id: result.id } : m))
        );
        getUnifiedConversations().then(setConversations);
      }
    },
    [privateUserId, myId]
  );

  const handleReportUser = useCallback(() => {
    if (conversationForCurrentChat) {
      alert(`Report flow would open for ${conversationForCurrentChat.name}.`);
    }
  }, [conversationForCurrentChat]);

  const isChatOpen = selectedId != null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Vertical side panel: full height, fixed right, messenger-style. Mobile: full width; desktop: 400px */}
      <div className="fixed inset-y-0 right-0 z-40 flex h-screen w-full flex-col overflow-hidden border-l border-slate-200 bg-card shadow-2xl dark:border-slate-800 md:w-[400px] md:max-w-[100vw]">
        <ChatErrorBoundary>
          {!isChatOpen ? (
            /* List View: only the conversation list */
            <div className="flex min-h-0 flex-1 flex-col">
              <UnifiedSidebar
                conversations={conversations}
                selectedId={selectedId}
                onSelect={handleSelect}
                loading={loading}
              />
            </div>
          ) : (
            /* Chat View: only the selected chat, with Back in the chat header */
            <div className="flex min-h-0 flex-1 flex-col">
              {isGroup && groupId ? (
                <GroupChat
                  groupId={groupId}
                  fillHeight
                  onBack={handleBack}
                  className="flex-1 min-h-0 border-0 shadow-none"
                />
              ) : conversationForCurrentChat && privateUserId ? (
                <CurrentChat
                  conversation={{
                    ...conversationForCurrentChat,
                    avatarUrl:
                      conversationForCurrentChat.avatarUrl ??
                      otherUserProfile?.avatarUrl ??
                      null,
                    isOnline:
                      conversationForCurrentChat.isOnline ??
                      otherUserProfile?.isOnline ??
                      false,
                  }}
                  messages={privateMessages}
                  recipientUserId={privateUserId}
                  receiverAvatarUrl={
                    conversationForCurrentChat.avatarUrl ??
                    otherUserProfile?.avatarUrl ??
                    null
                  }
                  receiverIsOnline={
                    conversationForCurrentChat.isOnline ??
                    otherUserProfile?.isOnline ??
                    false
                  }
                  onSendMessage={handleSendMessage}
                  onReportUser={handleReportUser}
                  onBack={handleBack}
                  loading={!myId}
                  sending={sending}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center bg-muted text-muted-foreground">
                  <p className="text-sm">Loading conversation…</p>
                </div>
              )}
            </div>
          )}
        </ChatErrorBoundary>
      </div>
    </div>
  );
}
