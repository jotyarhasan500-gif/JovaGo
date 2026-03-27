"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasVaultStorage } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export type CreateGroupResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Create a group in public.groups.
 * user_id is set from Clerk auth().userId (creator).
 * Requires subscription_tier === "ultimate" or admin/owner role.
 */
export async function createGroup(
  name: string,
  description: string,
  options: {
    max_members: number;
    category: string;
    trip_date: string;
    difficulty: string;
    meeting_point: string;
    destination_lat?: number | null;
    destination_lng?: number | null;
    country_name?: string | null;
    country_code?: string | null;
  }
): Promise<CreateGroupResult> {
  try {
    const { userId } = await auth();
    const ownerId = userId ?? null;
    if (!ownerId) {
      return { success: false, error: "Please sign in to create a group." };
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier, role")
      .eq("id", ownerId)
      .single();

    if (profileError) {
      console.warn("[createGroup] profile fetch", profileError.message);
      return { success: false, error: "Could not verify subscription. Please try again." };
    }

    const isAdmin =
      profile?.role?.toLowerCase() === "admin" ||
      profile?.role?.toLowerCase() === "owner";
    const tierLower = profile?.subscription_tier?.toLowerCase();
    if (!isAdmin && tierLower !== "ultimate") {
      return { success: false, error: "Upgrade to Ultimate to create groups." };
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return { success: false, error: "Group name is required." };
    }

    const maxMembers = Number(options?.max_members);
    if (!Number.isInteger(maxMembers) || maxMembers < 2) {
      return { success: false, error: "Max members must be at least 2." };
    }

    const category = options?.category?.trim();
    if (!category) {
      return { success: false, error: "Category is required." };
    }

    const tripDate = options?.trip_date?.trim();
    if (!tripDate) {
      return { success: false, error: "Trip date is required." };
    }

    const difficultyLevel = options?.difficulty?.trim();
    if (!difficultyLevel) {
      return { success: false, error: "Difficulty is required." };
    }

    const meetingPoint = options?.meeting_point?.trim();
    if (!meetingPoint) {
      return { success: false, error: "Meeting point is required." };
    }

    const inviteCode =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
        : `g${Date.now().toString(36)}`;

    const payload: Database["public"]["Tables"]["groups"]["Insert"] = {
      name: trimmedName,
      description: description != null ? String(description).trim() || null : null,
      user_id: ownerId,
      invite_code: inviteCode,
      max_members: maxMembers,
      category,
      trip_date: tripDate,
      difficulty_level: difficultyLevel,
      meeting_point: meetingPoint,
    };
    if (options.destination_lat != null && options.destination_lng != null) {
      payload.destination_lat = options.destination_lat;
      payload.destination_lng = options.destination_lng;
    }
    if (options.country_name != null && options.country_name.trim() !== "") {
      payload.country_name = options.country_name.trim();
    }
    if (options.country_code != null && options.country_code.trim() !== "") {
      payload.country_code = options.country_code.trim();
    }

    const { data, error } = await supabase
      .from("groups")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.warn("[createGroup]", error.message);
      return { success: false, error: error.message };
    }

    const groupId = data?.id ?? "";
    const memberPayload: Database["public"]["Tables"]["group_members"]["Insert"] = {
      group_id: groupId,
      user_id: ownerId,
      role: "owner",
    };
    const { error: memberError } = await supabase.from("group_members").insert(memberPayload);

    if (memberError) {
      console.warn("[createGroup] group_members insert", memberError.message);
    }

    return { success: true, id: groupId };
  } catch (e) {
    console.warn("[createGroup]", e);
    return { success: false, error: "Failed to create group. Please try again." };
  }
}

export type GroupRow = Database["public"]["Tables"]["groups"]["Row"] & {
  /** Present when fetched for Explore; count of group_members. */
  member_count?: number;
};

export type JoinGroupResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Join a group by invite code. Adds current user (auth().userId) to group_members as 'member'.
 */
export async function joinGroupByInviteCode(
  inviteCode: string
): Promise<JoinGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Please sign in to join a group." };
  }

  const code = inviteCode?.trim();
  if (!code) {
    return { success: false, error: "Invite code is required." };
  }

  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", code)
    .single();

  if (groupError || !group?.id) {
    return { success: false, error: "Invalid or expired invite code." };
  }

  const { error: insertError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: userId,
    role: "member",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: true };
    }
    console.warn("[joinGroupByInviteCode]", insertError.message, insertError.details);
    return { success: false, error: "Could not join the group. Please try again." };
  }
  return { success: true };
}

/**
 * Fetch all groups the current user can see: owner (groups.user_id) OR member (group_members).
 * Used for dashboard and explore "My Groups" sections.
 */
export async function getGroupsByOwnerId(): Promise<GroupRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  const [ownedRes, membersRes] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, description, user_id, max_members, category, trip_date, difficulty_level, meeting_point, destination_lat, destination_lng, country_name, country_code, invite_code")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId),
  ]);

  const owned = (ownedRes.data ?? []) as GroupRow[];
  const memberGroupIds =
    (membersRes.data ?? [])
      .map((r: { group_id: string }) => r.group_id)
      .filter((id: string) => !owned.some((g) => g.id === id)) ?? [];

  if (memberGroupIds.length === 0) {
    return owned;
  }

  const { data: memberGroups } = await supabase
    .from("groups")
    .select("id, name, description, user_id, max_members, category, trip_date, difficulty_level, meeting_point, destination_lat, destination_lng, country_name, country_code, invite_code")
    .in("id", memberGroupIds);

  const merged = [...owned, ...(memberGroups ?? [])] as GroupRow[];
  return merged;
}

export type GroupInfo = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  image_url?: string | null;
} | null;

/** Fetch a single group by id (for chat sidebar). */
export async function getGroupById(groupId: string): Promise<GroupInfo> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, user_id, image_url")
    .eq("id", groupId)
    .single();
  if (error || !data) return null;
  return data as GroupInfo;
}

export type GroupMemberInfo = {
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

/** Fetch members of a group with profile names/avatars. */
export async function getGroupMembers(groupId: string): Promise<GroupMemberInfo[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId);
  if (error || !rows?.length) return [];
  const userIds = (rows as { user_id: string; role: string }[]).map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);
  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null }) => [
      p.id,
      { full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null },
    ])
  );
  return (rows as { user_id: string; role: string }[]).map((r) => {
    const p = profileMap.get(r.user_id);
    return {
      user_id: r.user_id,
      role: r.role ?? "member",
      full_name: p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
    };
  });
}

export type LeaveGroupResult = { success: true } | { success: false; error: string };

/** Current user leaves the group (removes themselves from group_members). */
export async function leaveGroup(groupId: string): Promise<LeaveGroupResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) {
    console.warn("[leaveGroup]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type UpdateGroupMessageResult = { success: true } | { success: false; error: string };

/** Edit a group message. Only the sender (user_id) can edit. Sets is_edited and updated_at. */
export async function updateGroupMessage(
  messageId: string,
  content: string
): Promise<UpdateGroupMessageResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };
  const trimmed = content?.trim();
  if (!trimmed) return { success: false, error: "Message cannot be empty." };

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("group_messages")
    .select("id, user_id")
    .eq("id", messageId)
    .single();

  if (fetchErr || !row || (row as { user_id: string }).user_id !== userId) {
    return { success: false, error: "Message not found or you are not the sender." };
  }

  const { error } = await supabase
    .from("group_messages")
    .update({
      content: trimmed,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[updateGroupMessage]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type DeleteGroupMessageResult = { success: true } | { success: false; error: string };

/** Soft-delete a group message. Only the sender can delete. Sets is_deleted = true. */
export async function deleteGroupMessage(messageId: string): Promise<DeleteGroupMessageResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("group_messages")
    .select("id, user_id")
    .eq("id", messageId)
    .single();

  if (fetchErr || !row || (row as { user_id: string }).user_id !== userId) {
    return { success: false, error: "Message not found or you are not the sender." };
  }

  const { error } = await supabase
    .from("group_messages")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[deleteGroupMessage]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Fetch all groups for the Explore page. Uses RLS (anon can select).
 */
export async function getExploreGroups(): Promise<GroupRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, user_id, max_members, category, trip_date, difficulty_level, meeting_point, destination_lat, destination_lng, country_name, country_code, invite_code")
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as GroupRow[];
}

/**
 * Server-side fetch for Explore page. Returns groups with member_count.
 * Uses service role when available to bypass RLS.
 */
export async function getExploreGroupsServer(): Promise<GroupRow[]> {
  let supabase;
  try {
    supabase = await (hasVaultStorage()
      ? Promise.resolve(createAdminClient())
      : createClient());
  } catch {
    supabase = await createClient();
  }
  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !groups?.length) return (groups ?? []) as GroupRow[];

  const groupIds = (groups as { id: string }[]).map((g) => g.id);
  const { data: members } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);
  const countByGroup = new Map<string, number>();
  for (const row of members ?? []) {
    const gid = (row as { group_id: string }).group_id;
    countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1);
  }

  return (groups as GroupRow[]).map((g) => ({
    ...g,
    member_count: countByGroup.get(g.id) ?? 0,
  }));
}

export type UpdateGroupResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Update group name/description/image_url. Only the group creator can update.
 */
export async function updateGroupSettings(
  groupId: string,
  updates: { name?: string; description?: string; image_url?: string | null }
): Promise<UpdateGroupResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("groups")
    .select("user_id")
    .eq("id", groupId)
    .single();

  if (!existing || (existing as { user_id: string }).user_id !== userId) {
    return { success: false, error: "Only the group creator can change settings." };
  }

  const payload: { name?: string; description?: string | null; image_url?: string | null } = {};
  if (updates.name !== undefined) {
    const t = updates.name.trim();
    if (t) payload.name = t;
  }
  if (updates.description !== undefined) payload.description = updates.description?.trim() ?? null;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url || null;

  if (Object.keys(payload).length === 0) return { success: true };

  const { error } = await supabase
    .from("groups")
    .update(payload)
    .eq("id", groupId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[updateGroupSettings]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type SearchUsersForGroupResult = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}[];

/** Search users by name or email for inviting to a group. Excludes current user and existing members. */
export async function searchUsersForGroup(
  groupId: string,
  query: string
): Promise<SearchUsersForGroupResult> {
  const { userId } = await auth();
  if (!userId || !query?.trim()) return [];

  const supabase = await createClient();
  const safe = query.trim().replace(/'/g, "''").replace(/,/g, "");
  const term = `%${safe}%`;

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const memberIds = new Set((memberRows ?? []).map((r: { user_id: string }) => r.user_id));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .or(`full_name.ilike.${term},email.ilike.${term}`)
    .limit(20);

  return (profiles ?? [])
    .filter((p: { id: string }) => p.id !== userId && !memberIds.has(p.id))
    .map((p: { id: string; full_name: string | null; avatar_url: string | null; email: string | null }) => ({
      id: p.id,
      full_name: p.full_name ?? null,
      avatar_url: p.avatar_url ?? null,
      email: p.email ?? null,
    }));
}

export type AddGroupMemberResult = { success: true } | { success: false; error: string };

/** Add a user to the group. Only the group creator can add members. */
export async function addGroupMember(groupId: string, newUserId: string): Promise<AddGroupMemberResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("user_id")
    .eq("id", groupId)
    .single();

  if (!group || (group as { user_id: string }).user_id !== userId) {
    return { success: false, error: "Only the group creator can add members." };
  }

  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", newUserId)
    .maybeSingle();

  if (existing) return { success: false, error: "This user is already in the group." };

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: newUserId,
    role: "member",
  });

  if (error) {
    console.warn("[addGroupMember]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type UploadGroupImageResult =
  | { success: true; image_url: string }
  | { success: false; error: string };

const GROUP_AVATAR_BUCKET = "group-attachments";

/** Upload group avatar. Only the group creator. Uploads to group-attachments/{groupId}/avatar.{ext} */
export async function uploadGroupImage(groupId: string, formData: FormData): Promise<UploadGroupImageResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { success: false, error: "No file provided." }

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("user_id")
    .eq("id", groupId)
    .single();

  if (!group || (group as { user_id: string }).user_id !== userId) {
    return { success: false, error: "Only the group creator can change the group image." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${groupId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(GROUP_AVATAR_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.warn("[uploadGroupImage]", uploadError.message);
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from(GROUP_AVATAR_BUCKET).getPublicUrl(path);
  const imageUrl = urlData?.publicUrl ?? "";

  const { error: updateError } = await supabase
    .from("groups")
    .update({ image_url: imageUrl })
    .eq("id", groupId)
    .eq("user_id", userId);

  if (updateError) {
    console.warn("[uploadGroupImage] update", updateError.message);
    return { success: false, error: updateError.message };
  }
  return { success: true, image_url: imageUrl };
}

export type ResetInviteCodeResult =
  | { success: true; newInviteCode: string }
  | { success: false; error: string };

/**
 * Reset invite code for a group. Only the group creator can reset.
 */
export async function resetGroupInviteCode(groupId: string): Promise<ResetInviteCodeResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const supabase = await createClient();
  const newCode =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : `g${Date.now().toString(36)}`;

  const { error } = await supabase
    .from("groups")
    .update({ invite_code: newCode })
    .eq("id", groupId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[resetGroupInviteCode]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, newInviteCode: newCode };
}

export type RemoveMemberResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Remove a member from the group. Only the group creator (admin) can remove. Cannot remove the creator.
 */
export async function removeGroupMember(
  groupId: string,
  memberUserId: string
): Promise<RemoveMemberResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("user_id")
    .eq("id", groupId)
    .single();

  if (!group || (group as { user_id: string }).user_id !== userId) {
    return { success: false, error: "Only admins can remove members." };
  }

  const creatorId = (group as { user_id: string }).user_id;
  if (memberUserId === creatorId) {
    return { success: false, error: "Cannot remove the group creator." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId);

  if (error) {
    console.warn("[removeGroupMember]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type DeleteGroupResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Delete a group. Only the group creator can delete. RLS/caller check: .eq('user_id', currentUserId).
 */
export async function deleteGroup(groupId: string): Promise<DeleteGroupResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[deleteGroup]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}
