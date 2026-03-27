"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export type DbMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

const MESSAGES_PAGE_SIZE = 20;

/** Fetch messages between current user and another user from public.messages. */
export async function getMessages(
  otherUserId: string
): Promise<DbMessage[]> {
  const { userId: myId } = await auth();
  if (!myId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .or(
      `and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[getMessages]", error.message);
    return [];
  }
  return (data ?? []) as DbMessage[];
}

/** Paginated fetch: last N messages (newest first in DB), or older than `before` (created_at). Returns in descending created_at order; caller should reverse for chronological display. */
export async function getMessagesPage(
  otherUserId: string,
  options?: { before?: string; limit?: number }
): Promise<DbMessage[]> {
  const { userId: myId } = await auth();
  if (!myId) return [];

  const limit = options?.limit ?? MESSAGES_PAGE_SIZE;
  const supabase = await createClient();
  let q = supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .or(
      `and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.before) {
    q = q.lt("created_at", options.before);
  }

  const { data, error } = await q;
  if (error) {
    console.warn("[getMessagesPage]", error.message);
    return [];
  }
  return (data ?? []) as DbMessage[];
}

export type SendMessageResult =
  | { success: true; id: string }
  | { success: false; error: string };

/** Insert a message into public.messages.
 * sender_id is exactly Clerk user.id from auth() — required for RLS and consistency. */
export async function sendMessage(
  receiverId: string,
  content: string
): Promise<SendMessageResult> {
  try {
    const { userId: senderId } = await auth();
    if (!senderId) {
      return { success: false, error: "Please sign in to send a message." };
    }
    const trimmed = content?.trim();
    if (!trimmed) {
      return { success: false, error: "Message cannot be empty." };
    }

    const newMessage = {
      sender_id: senderId,
      receiver_id: receiverId,
      content: trimmed,
      is_read: false,
    };
    console.log("Sending message:", newMessage);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert(newMessage)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

export type ConversationSummary = {
  id: string;
  name: string;
  avatarInitials: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastMessage: string;
  lastMessageAt: string;
  /** ISO date string for sorting (e.g. unified messages list). */
  lastMessageCreatedAt?: string;
  unread?: number;
};

/** Fetch conversation list for the current user (others they have chatted with). */
export async function getConversations(): Promise<ConversationSummary[]> {
  const { userId: myId } = await auth();
  if (!myId) return [];

  const supabase = await createClient();
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
    .order("created_at", { ascending: false });

  if (msgError || !messages?.length) return [];

  const otherIds = Array.from(
    new Set(
      (messages as DbMessage[]).map((m) =>
        m.sender_id === myId ? m.receiver_id : m.sender_id
      )
    )
  );
  if (otherIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_online")
    .in("id", otherIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        name: p.full_name?.trim() || "Traveler",
        avatarUrl: p.avatar_url ?? null,
        isOnline: p.is_online === true,
      },
    ])
  );

  const lastByOther = new Map<string, { content: string; created_at: string }>();
  for (const m of messages as DbMessage[]) {
    const other = m.sender_id === myId ? m.receiver_id : m.sender_id;
    if (!lastByOther.has(other)) {
      lastByOther.set(other, { content: m.content, created_at: m.created_at });
    }
  }

  return otherIds.map((id) => {
    const profile = profileMap.get(id);
    const name = profile?.name ?? "Traveler";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const last = lastByOther.get(id);
    const createdAt = last?.created_at
      ? new Date(last.created_at)
      : new Date();
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    let lastMessageAt = createdAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
    if (diffDays === 1) lastMessageAt = "Yesterday";
    else if (diffDays > 1 && diffDays <= 7)
      lastMessageAt = createdAt.toLocaleDateString("en-US", { weekday: "short" });

    return {
      id,
      name,
      avatarInitials: initials || "?",
      avatarUrl: profile?.avatarUrl ?? null,
      isOnline: profile?.isOnline ?? false,
      lastMessage: last?.content ?? "",
      lastMessageAt,
      lastMessageCreatedAt: last?.created_at,
    };
  });
}

/** Fetch another user's profile for chat header (e.g. when opening ?to= without prior messages). */
export async function getOtherUserProfile(
  otherUserId: string
): Promise<{ name: string; avatarInitials: string; avatarUrl: string | null; isOnline: boolean } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, is_online")
    .eq("id", otherUserId)
    .single();

  if (error || !data) return null;
  const row = data as { full_name: string | null; avatar_url: string | null; is_online?: boolean };
  const name = row.full_name?.trim() || "Traveler";
  const avatarInitials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return { name, avatarInitials: avatarInitials || "?", avatarUrl: row.avatar_url ?? null, isOnline: row.is_online === true };
}

/** Navbar badge: count only messages where receiver_id = current user and is_read === false. */
export async function getUnreadCount(): Promise<number> {
  const { userId: myId } = await auth();
  if (!myId) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", myId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

export type InboxItem = {
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  lastMessageSnippet: string;
  lastMessageAt: string;
};

/** Inbox for navbar dropdown: senders who have sent messages to the current user, with latest message snippet. */
export async function getInboxItems(): Promise<InboxItem[]> {
  const { userId: myId } = await auth();
  if (!myId) return [];

  const supabase = await createClient();
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .eq("receiver_id", myId)
    .order("created_at", { ascending: false });

  if (msgError || !messages?.length) return [];

  const senderIds = Array.from(new Set((messages as DbMessage[]).map((m) => m.sender_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", senderIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { name: p.full_name?.trim() || "Traveler", avatarUrl: p.avatar_url ?? null },
    ])
  );

  const seen = new Set<string>();
  const items: InboxItem[] = [];
  for (const m of messages as DbMessage[]) {
    if (seen.has(m.sender_id)) continue;
    seen.add(m.sender_id);
    const profile = profileMap.get(m.sender_id);
    const snippet = m.content.length > 60 ? m.content.slice(0, 60) + "…" : m.content;
    const createdAt = new Date(m.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    let lastMessageAt = createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
    if (diffDays === 1) lastMessageAt = "Yesterday";
    else if (diffDays > 1 && diffDays <= 7) lastMessageAt = createdAt.toLocaleDateString("en-US", { weekday: "short" });
    else if (diffDays > 7) lastMessageAt = createdAt.toLocaleDateString();

    items.push({
      senderId: m.sender_id,
      senderName: profile?.name ?? "Traveler",
      senderAvatarUrl: profile?.avatarUrl ?? null,
      lastMessageSnippet: snippet,
      lastMessageAt,
    });
  }
  return items;
}

/** When the receiver opens the chat, mark only the LAST message received from the sender as read.
 * Sender guard: if (senderId === currentUserId) return; the sender must never mark their own message as read. */
export async function markLastMessageAsRead(senderId: string): Promise<void> {
  try {
    const { userId: myId } = await auth();
    if (!myId) return;
    if (String(senderId) === String(myId)) return;

    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("messages")
      .select("id, sender_id")
      .eq("receiver_id", myId)
      .eq("sender_id", senderId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = rows?.[0] as { id: string; sender_id: string } | undefined;
    if (!row || String(row.sender_id) === String(myId)) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", row.id)
      .eq("receiver_id", myId);
  } catch (e) {
    console.warn("[markLastMessageAsRead]", e);
  }
}

/** Mark all unread messages from a sender to the current user as read. Used when opening a conversation or when new messages arrive. Server-side so RLS allows the update. */
export async function markConversationAsRead(senderId: string): Promise<void> {
  try {
    const { userId: myId } = await auth();
    if (!myId) return;
    if (String(senderId) === String(myId)) return;

    const supabase = await createClient();
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", myId)
      .eq("sender_id", senderId)
      .eq("is_read", false);
  } catch (e) {
    console.warn("[markConversationAsRead]", e);
  }
}
