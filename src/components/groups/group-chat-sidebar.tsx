"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getGroupById,
  getGroupMembers,
  leaveGroup,
  updateGroupSettings,
  searchUsersForGroup,
  addGroupMember,
  uploadGroupImage,
} from "@/app/actions/groups";
import type { GroupInfo, GroupMemberInfo } from "@/app/actions/groups";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { UsersRound, LogOut, Pencil, Check, X, Settings, UserPlus, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type GroupChatSidebarProps = {
  groupId: string;
  currentUserId: string | null;
  onClose?: () => void;
  className?: string;
};

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="size-4" />
      {children}
    </h4>
  );
}

export function GroupChatSidebar({
  groupId,
  currentUserId,
  onClose,
  className,
}: GroupChatSidebarProps) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupInfo>(null);
  const [members, setMembers] = useState<GroupMemberInfo[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string | null; avatar_url: string | null; email: string | null }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = Boolean(group && currentUserId && group.user_id === currentUserId);

  const refreshGroup = useCallback(() => {
    if (!groupId) return;
    getGroupById(groupId).then((g) => {
      setGroup(g);
      setEditName(g?.name?.trim() ?? "");
    });
  }, [groupId]);

  const refreshMembers = useCallback(() => {
    if (!groupId) return;
    getGroupMembers(groupId).then(setMembers);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    refreshGroup();
    refreshMembers();
  }, [groupId, refreshGroup, refreshMembers]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => {
      searchUsersForGroup(groupId, searchQuery)
        .then(setSearchResults)
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [groupId, searchQuery]);

  const handleLeave = async () => {
    if (!groupId) return;
    setLeaving(true);
    const result = await leaveGroup(groupId);
    setLeaving(false);
    setLeaveOpen(false);
    if (result.success) {
      toast.success("You left the group.");
      router.replace("/messages");
      onClose?.();
    } else {
      toast.error(result.error ?? "Failed to leave group.");
    }
  };

  const handleSaveName = async () => {
    if (!groupId || !editName.trim() || editName.trim() === group?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const result = await updateGroupSettings(groupId, { name: editName.trim() });
    setSavingName(false);
    if (result.success) {
      setGroup((prev) => (prev ? { ...prev, name: editName.trim() } : null));
      setEditingName(false);
      toast.success("Group name updated.");
    } else {
      toast.error(result.error ?? "Failed to update name.");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !groupId) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadGroupImage(groupId, formData);
    setUploadingImage(false);
    if (result.success) {
      setGroup((prev) => (prev ? { ...prev, image_url: result.image_url } : null));
      toast.success("Group image updated.");
    } else {
      toast.error(result.error ?? "Failed to upload image.");
    }
  };

  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId);
    const result = await addGroupMember(groupId, userId);
    setAddingUserId(null);
    if (result.success) {
      refreshMembers();
      setSearchQuery("");
      setSearchResults([]);
      toast.success("Member added.");
    } else {
      toast.error(result.error ?? "Failed to add member.");
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Settings (Name & Photo) */}
        <section>
          <SectionTitle icon={Settings}>Settings</SectionTitle>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="size-14 border-2 border-border">
                {group?.image_url ? (
                  <AvatarImage src={group.image_url} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                  {(group?.name?.trim() || "G").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-1 -right-1 size-7 rounded-full"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    aria-label="Upload group image"
                  >
                    <Upload className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {editingName && isAdmin ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    disabled={savingName}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditName(group?.name ?? "");
                        setEditingName(false);
                      }
                    }}
                  />
                  <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={handleSaveName} disabled={savingName || !editName.trim()}>
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    onClick={() => {
                      setEditName(group?.name ?? "");
                      setEditingName(false);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h3 className="truncate font-semibold text-foreground">{group?.name ?? "Group"}</h3>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit group name"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
              <p className="truncate text-xs text-muted-foreground">{group?.description || "No description"}</p>
            </div>
          </div>
        </section>

        {/* Section 2: Members */}
        <section>
          <SectionTitle icon={UsersRound}>Members ({members.length})</SectionTitle>
          <ul className="space-y-2">
            {members.map((m) => {
              const isCurrentUser = m.user_id === currentUserId;
              const displayName = m.full_name?.trim() || "Traveler";
              const messageHref = `/messages?userId=${encodeURIComponent(m.user_id)}`;
              return (
                <li key={m.user_id} className="flex items-center gap-3">
                  {isCurrentUser ? (
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-muted text-xs">
                        {(m.full_name?.trim() || m.user_id).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger
                        render={(props) => (
                          <Link
                            {...props}
                            href={messageHref}
                            className={cn(
                              "block shrink-0 rounded-full ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              props.className
                            )}
                            aria-label={`Message ${displayName}`}
                          >
                            <Avatar className="size-8">
                              <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                              <AvatarFallback className="bg-muted text-xs">
                                {(m.full_name?.trim() || m.user_id).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        )}
                      />
                      <TooltipContent side="right">Message {displayName}</TooltipContent>
                    </Tooltip>
                  )}
                  <div className="min-w-0 flex-1">
                    {isCurrentUser ? (
                      <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger
                          render={(props) => (
                            <Link
                              {...props}
                              href={messageHref}
                              className={cn(
                                "block cursor-pointer truncate text-sm font-medium text-foreground hover:text-primary hover:underline",
                                props.className
                              )}
                              aria-label={`Message ${displayName}`}
                            >
                              {displayName}
                            </Link>
                          )}
                        />
                        <TooltipContent side="right">Message {displayName}</TooltipContent>
                      </Tooltip>
                    )}
                    <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Section 3: Add Members (admin only) */}
        {isAdmin && (
          <section>
            <SectionTitle icon={UserPlus}>Add members</SectionTitle>
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2 h-9 text-sm"
            />
            {searchLoading && <p className="text-xs text-muted-foreground">Searching…</p>}
            {!searchLoading && searchResults.length > 0 && (
              <ul className="space-y-1.5">
                {searchResults.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage src={u.avatar_url ?? undefined} alt="" />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {(u.full_name?.trim() || u.id).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.full_name || "Traveler"}</p>
                        {u.email && <p className="truncate text-[10px] text-muted-foreground">{u.email}</p>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 text-xs"
                      onClick={() => handleAddMember(u.id)}
                      disabled={addingUserId === u.id}
                    >
                      {addingUserId === u.id ? "Adding…" : "Add"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground">No users found or they’re already in the group.</p>
            )}
          </section>
        )}

        {/* Section 4: Danger Zone */}
        <section>
          <SectionTitle icon={AlertTriangle}>Danger zone</SectionTitle>
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setLeaveOpen(true)}
          >
            <LogOut className="size-4" />
            Leave group
          </Button>
        </section>
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive messages or see this chat. You can rejoin with an invite link if you have one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLeave();
              }}
              disabled={leaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaving ? "Leaving…" : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
