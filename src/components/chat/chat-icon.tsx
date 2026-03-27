"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

/** Messages entry in navbar: links to unified /messages page. Shows unread badge when applicable. */
export function ChatIcon({ scrolled }: { scrolled?: boolean }) {
  const { user } = useUser();
  const myId = user?.id ?? null;
  const { unreadCount, setUnreadCount } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const setUnreadCountRef = useRef(setUnreadCount);
  setUnreadCountRef.current = setUnreadCount;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", myId)
          .eq("is_read", false);

        if (!error && count !== null) {
          setUnreadCountRef.current(count);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [myId]);

  if (!myId) return null;

  const hasUnread = mounted && unreadCount > 0;

  return (
    <Link
      href="/messages"
      className={cn(
        "relative flex size-10 items-center justify-center rounded-lg transition-colors",
        scrolled
          ? "text-foreground/90 hover:bg-foreground/10 hover:text-foreground"
          : "text-zinc-900 hover:text-zinc-800 dark:text-white dark:hover:text-white/10"
      )}
      aria-label={hasUnread ? "Messages (unread)" : "Messages"}
    >
      <MessageSquare className="size-5 shrink-0" aria-hidden />
      {hasUnread && (
        <span
          className="absolute right-1 top-1 size-2 rounded-full bg-red-500 ring-2 ring-background"
          aria-hidden
        />
      )}
    </Link>
  );
}
