"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { ChatHeader } from "./chat-header";
import { SafetyBanner } from "./safety-banner";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import type { Conversation, ChatMessage } from "@/lib/chat-data";
import { cn } from "@/lib/utils";

const TYPING_STOP_DELAY_MS = 2000;

interface CurrentChatProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  recipientUserId: string | null;
  receiverAvatarUrl: string | null;
  receiverIsOnline: boolean;
  onSendMessage: (text: string) => void;
  onReportUser: () => void;
  onBack?: () => void;
  loading?: boolean;
  sending?: boolean;
  /** When provided, enables fixed-height scroll container and load-more on scroll up. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Sentinel at bottom for scroll-into-view; required when scrollContainerRef is used. */
  scrollBottomRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
  loadingOlder?: boolean;
  hasMoreOlder?: boolean;
}

export function CurrentChat({
  conversation,
  messages,
  recipientUserId,
  receiverAvatarUrl,
  receiverIsOnline,
  onSendMessage,
  onReportUser,
  onBack,
  loading = false,
  sending = false,
  scrollContainerRef: externalScrollContainerRef,
  scrollBottomRef: externalScrollBottomRef,
  onScroll,
  loadingOlder = false,
  hasMoreOlder = true,
}: CurrentChatProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollBottomRef ?? internalScrollRef;
  const { user } = useUser();
  const myId = user?.id ?? null;
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (externalScrollContainerRef) return;
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, externalScrollContainerRef, scrollRef]);

  // Typing indicator: subscribe to broadcast channel and clean up on unmount or when conversation changes.
  useEffect(() => {
    if (!myId || !recipientUserId) {
      setOtherUserTyping(false);
      return undefined;
    }
    const channelName = `typing-room:${[myId, recipientUserId].sort().join("-")}`;
    const supabase = createClient();
    const channel = supabase.channel(channelName);
    typingChannelRef.current = channel;

    channel
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload?: { user_id?: string; is_typing?: boolean } }) => {
          const p = payload.payload;
          if (!p || p.user_id !== recipientUserId) return;
          setOtherUserTyping(!!p.is_typing);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[CurrentChat] Typing channel error.");
        }
      });

    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
      setOtherUserTyping(false);
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
        typingStopTimeoutRef.current = null;
      }
    };
  }, [myId, recipientUserId]);

  const handleTyping = useCallback(() => {
    if (!myId || !recipientUserId) return;
    const channel = typingChannelRef.current;
    if (!channel) return;

    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: myId, is_typing: true },
    });

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }
    typingStopTimeoutRef.current = setTimeout(() => {
      typingStopTimeoutRef.current = null;
      typingChannelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: myId, is_typing: false },
      });
    }, TYPING_STOP_DELAY_MS);
  }, [myId, recipientUserId]);

  const handleTypingStop = useCallback(() => {
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }
    if (myId && recipientUserId && typingChannelRef.current) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: myId, is_typing: false },
      });
    }
  }, [myId, recipientUserId]);

  if (loading && !conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-muted text-muted-foreground">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }
  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-muted text-muted-foreground">
        <p className="text-sm">Select a conversation or open a chat from a profile or the map.</p>
        <Link href="/" className="mt-2 text-sm text-[#0066FF] hover:underline">
          Go to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted">
      <ChatHeader
        name={conversation.name}
        avatarInitials={conversation.avatarInitials}
        avatarUrl={receiverAvatarUrl}
        isOnline={receiverIsOnline}
        recipientUserId={recipientUserId}
        onReport={onReportUser}
        onBack={onBack}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={externalScrollContainerRef}
          onScroll={onScroll}
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto",
            externalScrollContainerRef && "min-h-0"
          )}
        >
          <div className="shrink-0 px-4 pt-3 pb-2">
            <SafetyBanner />
          </div>
          {loadingOlder && (
            <p className="shrink-0 py-2 text-center text-sm text-muted-foreground">
              Loading older messages…
            </p>
          )}
          <ChatMessages messages={messages} />
          <div ref={scrollRef} aria-hidden />
        </div>
        <div className="shrink-0">
          {otherUserTyping && conversation && (
            <p className="border-t border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
              {conversation.name} is typing...
            </p>
          )}
          <ChatInput
            onSend={onSendMessage}
            onTyping={handleTyping}
            onTypingStop={handleTypingStop}
            disabled={sending}
          />
        </div>
      </div>
    </div>
  );
}
