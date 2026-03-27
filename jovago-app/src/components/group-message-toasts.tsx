"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type NewMessageRow = {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string | null;
  user_image: string | null;
  content: string;
  created_at: string;
};

function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // ignore
  }
}

export function GroupMessageToasts() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const router = useRouter();
  const { user, isLoaded } = useUser();
  const currentUserId = user?.id ?? null;
  const channelRefs = useRef<ReturnType<ReturnType<typeof createClient>["channel"]>[]>([]);

  useEffect(() => {
    if (!isLoaded || !currentUserId) return;

    const supabase = createClient();

    supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", currentUserId)
      .then(({ data: rows, error }) => {
        if (error || !rows?.length) return;

        const groupIds = [...new Set((rows as { group_id: string }[]).map((r) => r.group_id))];

        groupIds.forEach((group_id) => {
          const channel = supabase
            .channel(`group_message_toast:${group_id}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "group_messages",
                filter: `group_id=eq.${group_id}`,
              },
              (payload) => {
                const row = payload.new as { id?: string; group_id?: string; user_id?: string; user_name?: string | null; content?: string } & Record<string, unknown>;
                if (row.user_id === currentUserId) return;

                const currentPath = pathnameRef.current;
                const toParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("to") : null;
                const onMessagesWithThisGroup = currentPath === "/messages" && toParam === `group:${group_id}`;
                const onOldGroupPage = currentPath?.startsWith("/dashboard/groups/") && currentPath.split("/").filter(Boolean).pop() === group_id;
                if (onMessagesWithThisGroup || onOldGroupPage) return;

                const senderName = row.user_name?.trim() || "Someone";
                const preview = row.content?.trim().slice(0, 50) ?? "";
                const previewText = preview.length < (row.content?.trim().length ?? 0) ? `${preview}…` : preview;

                playNotificationSound();

                toast("New Message from " + senderName, {
                  description: previewText ? `${previewText} — Open chat.` : "Open group chat.",
                  duration: 6000,
                  action: {
                    label: "View",
                    onClick: () => {
                      router.push(`/messages?to=group:${group_id}`);
                    },
                  },
                });
              }
            )
            .subscribe();

          channelRefs.current.push(channel);
        });
      });

    return () => {
      channelRefs.current.forEach((ch) => supabase.removeChannel(ch));
      channelRefs.current = [];
    };
  }, [isLoaded, currentUserId, router]);

  return null;
}
