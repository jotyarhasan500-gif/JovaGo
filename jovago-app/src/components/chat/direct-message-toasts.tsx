"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getOtherUserProfile } from "@/app/actions/chat";
import { useChatStore } from "@/lib/chat-store";

export function DirectMessageToasts() {
  const { user, isLoaded } = useUser();
  const myId = user?.id ?? null;
  const { activeChatUserId, openChat } = useChatStore();
  const activeChatRef = useRef(activeChatUserId);
  activeChatRef.current = activeChatUserId;

  useEffect(() => {
    if (!isLoaded || !myId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("direct-message-toasts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (!row) return;
          const receiverId = row.receiver_id as string;
          const senderId = row.sender_id as string;
          if (receiverId !== myId || senderId === myId) return;
          if (activeChatRef.current === senderId) return;

          const profile = await getOtherUserProfile(senderId);
          const senderName = profile?.name ?? "Someone";

          toast("New message from " + senderName, {
            description: "Open the conversation.",
            duration: 6000,
            action: {
              label: "View",
              onClick: () => openChat(senderId),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, myId, openChat]);

  return null;
}
