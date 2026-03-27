"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getGroupsByOwnerId } from "@/app/actions/groups";
import { getConversations, type ConversationSummary } from "@/app/actions/chat";
import type { GroupRow } from "@/app/actions/groups";

export type UnifiedConversation = {
  type: "group" | "private";
  /** Stable id: "group:uuid" or "user:uuid" */
  id: string;
  name: string;
  avatarUrl: string | null;
  avatarInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  /** ISO date for sorting */
  lastMessageCreatedAt: string;
  unread?: number;
};

/** Fetch groups the user is in with their latest group_message for lastMessage/lastMessageAt. */
async function getGroupsWithLastMessage(
  groupIds: string[]
): Promise<UnifiedConversation[]> {
  if (groupIds.length === 0) return [];
  const supabase = await createClient();

  const { data: groupRows } = await supabase
    .from("groups")
    .select("id, name")
    .in("id", groupIds);
  const groupMap = new Map(
    (groupRows ?? []).map((r: { id: string; name: string | null }) => [
      r.id,
      r.name?.trim() || "Group",
    ])
  );

  const { data: recentMessages } = await supabase
    .from("group_messages")
    .select("group_id, content, created_at")
    .in("group_id", groupIds)
    .order("created_at", { ascending: false });

  const lastByGroup = new Map<
    string,
    { content: string; created_at: string }
  >();
  for (const row of recentMessages ?? []) {
    const r = row as { group_id: string; content: string; created_at: string };
    if (!lastByGroup.has(r.group_id)) {
      lastByGroup.set(r.group_id, { content: r.content, created_at: r.created_at });
    }
  }

  return groupIds.map((gid) => {
    const name = groupMap.get(gid) ?? "Group";
    const initials = name.slice(0, 2).toUpperCase() || "G";
    const last = lastByGroup.get(gid);
    const createdAt = last?.created_at
      ? new Date(last.created_at)
      : new Date(0);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    let lastMessageAt = createdAt.getTime()
      ? createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        })
      : "";
    if (diffDays === 1) lastMessageAt = "Yesterday";
    else if (diffDays > 1 && diffDays <= 7)
      lastMessageAt = createdAt.toLocaleDateString("en-US", {
        weekday: "short",
      });
    else if (diffDays > 7) lastMessageAt = createdAt.toLocaleDateString();

    return {
      type: "group" as const,
      id: `group:${gid}`,
      name,
      avatarUrl: null,
      avatarInitials: initials,
      lastMessage: last?.content ?? "",
      lastMessageAt,
      lastMessageCreatedAt: last?.created_at ?? new Date(0).toISOString(),
    };
  });
}

function conversationToUnified(c: ConversationSummary): UnifiedConversation {
  return {
    type: "private",
    id: `user:${c.id}`,
    name: c.name,
    avatarUrl: c.avatarUrl ?? null,
    avatarInitials: c.avatarInitials,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt,
    lastMessageCreatedAt: c.lastMessageCreatedAt ?? new Date(0).toISOString(),
    unread: c.unread,
  };
}

/** Single list of group + private conversations, sorted by last message time (newest first). */
export async function getUnifiedConversations(): Promise<
  UnifiedConversation[]
> {
  const { userId } = await auth();
  if (!userId) return [];

  const [groups, privateConvos] = await Promise.all([
    getGroupsByOwnerId(),
    getConversations(),
  ]);

  const groupIds = (groups as GroupRow[]).map((g) => g.id);
  const groupItems = await getGroupsWithLastMessage(groupIds);
  const privateItems = privateConvos.map(conversationToUnified);
  const combined: UnifiedConversation[] = [
    ...groupItems,
    ...privateItems,
  ].filter((x) => x.lastMessageAt || x.type === "group");

  combined.sort((a, b) => {
    const tA = new Date(a.lastMessageCreatedAt).getTime();
    const tB = new Date(b.lastMessageCreatedAt).getTime();
    return tB - tA;
  });

  return combined;
}
