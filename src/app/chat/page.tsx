"use client";

/**
 * Chat page: do not call router.push("/") here. When user is null we only show loading (loading={!myId});
 * we never redirect to landing. Any redirect to "/" would come from middleware or another layout.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { CurrentChat } from "@/components/chat/current-chat";
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary";
import { getMessages, sendMessage, getConversations, getOtherUserProfile, markLastMessageAsRead, markConversationAsRead } from "@/app/actions/chat";
import type { DbMessage } from "@/app/actions/chat";
import type { Conversation, ChatMessage } from "@/lib/chat-data";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/chat-store";
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

export default function ChatPage() {
  const router = useRouter();
  const { user } = useUser();
  const myId = user?.id ?? null;
  const { clearUnreadCount } = useChatStore();
  const searchParams = useSearchParams();
  const toParam = searchParams.get("to");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(toParam);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    name: string;
    avatarInitials: string;
    avatarUrl: string | null;
    isOnline: boolean;
  } | null>(null);

  const conversation = useMemo(() => {
    if (!selectedId) return null;
    const fromList = conversations.find((c) => c.id === selectedId);
    if (fromList) return fromList;
    if (otherUserProfile)
      return {
        id: selectedId,
        name: otherUserProfile.name,
        avatarInitials: otherUserProfile.avatarInitials,
        lastMessage: "",
        lastMessageAt: "",
        avatarUrl: otherUserProfile.avatarUrl ?? null,
        isOnline: otherUserProfile.isOnline,
      };
    return null;
  }, [conversations, selectedId, otherUserProfile]);

  useEffect(() => {
    if (!myId) {
      setLoading(false);
      return;
    }
    getConversations().then((list) => {
      setConversations(list);
      setLoading(false);
    });
  }, [myId]);

  useEffect(() => {
    setSelectedId(toParam);
  }, [toParam]);

  // Load messages when opening a conversation.
  useEffect(() => {
    if (!myId || !selectedId) {
      setMessages([]);
      setOtherUserProfile(null);
      return;
    }
    let cancelled = false;
    getMessages(selectedId).then((rows) => {
      if (cancelled) return;
      const list = Array.isArray(rows) ? rows : [];
      const mapped = list.map((m) =>
        dbMessageToChatMessage(m as DbMessage & { sender_id: string }, myId, selectedId)
      );
      setMessages(mapped);
    });
    markLastMessageAsRead(selectedId).catch((err) => console.warn("[Chat] markLastMessageAsRead:", err));
    return () => {
      cancelled = true;
    };
  }, [myId, selectedId]);

  // Mark all messages from this sender to me as read when conversation opens or when new messages arrive. Sync badge immediately.
  useEffect(() => {
    if (!myId || !selectedId) return;
    markConversationAsRead(selectedId).then(() => {
      clearUnreadCount();
    });
  }, [myId, selectedId, messages, clearUnreadCount]);

  // Fetch other user profile only when selectedId is not yet in conversations list.
  useEffect(() => {
    if (!myId || !selectedId) return;
    const isInList = conversations.some((c) => c.id === selectedId);
    if (isInList) {
      setOtherUserProfile(null);
      return;
    }
    let cancelled = false;
    getOtherUserProfile(selectedId).then((p) => {
      if (!cancelled && p) setOtherUserProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [myId, selectedId, conversations]);

  // Realtime: listen for new messages so the UI updates without refresh.
  useEffect(() => {
    if (!myId || !selectedId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { eventType: string; new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;
          const senderId = row.sender_id as string;
          const receiverId = row.receiver_id as string;
          const isForThisConversation =
            (senderId === myId && receiverId === selectedId) ||
            (senderId === selectedId && receiverId === myId);
          if (!isForThisConversation) return;
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
              selectedId
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
          console.warn("[Chat] Realtime channel error — new messages may not appear for the other user until refresh.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, selectedId]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.replace(`/chat?to=${id}`, { scroll: false });
    },
    [router]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!selectedId || !myId) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const optId = `opt-${Date.now()}`;
      const optMsg: ChatMessage = {
        id: optId,
        conversationId: selectedId,
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
      const result = await sendMessage(selectedId, trimmed);
      setSending(false);
      if (!result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optId));
        toast.error(result.error);
        return;
      }
      // Replace optimistic message with real id so UI shows confirmed message; realtime will not duplicate (same id).
      if (result.success && "id" in result) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optId ? { ...m, id: result.id } : m
          )
        );
        // Refresh conversation list so sidebar shows latest message
        getConversations().then(setConversations);
      }
    },
    [selectedId, myId]
  );

  const handleReportUser = useCallback(() => {
    if (conversation) {
      alert(`Report flow would open for ${conversation.name}.`);
    }
  }, [conversation]);

  return (
    <div className="flex h-screen flex-col">
      <ChatErrorBoundary>
        <div className="flex min-h-0 flex-1">
          <aside className="w-full shrink-0 sm:w-80">
            <ChatSidebar
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
              loading={loading}
            />
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            <CurrentChat
              conversation={conversation}
              messages={messages}
              recipientUserId={selectedId}
              receiverAvatarUrl={conversation?.avatarUrl ?? otherUserProfile?.avatarUrl ?? null}
              receiverIsOnline={conversation?.isOnline ?? otherUserProfile?.isOnline ?? false}
              onSendMessage={handleSendMessage}
              onReportUser={handleReportUser}
              loading={!myId}
              sending={sending}
            />
          </main>
        </div>
      </ChatErrorBoundary>
    </div>
  );
}
