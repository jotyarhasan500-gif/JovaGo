"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { UsersRound, ArrowRight, MoreVertical, Pencil, Trash2, CalendarDays } from "lucide-react";
import type { GroupRow } from "@/app/actions/groups";
import { updateGroupSettings, deleteGroup } from "@/app/actions/groups";
import { Badge } from "@/components/ui/badge";
import { getStaticMapImageUrl } from "@/lib/mapbox-static";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN : undefined;

function difficultyBadgeClass(difficulty: string | null | undefined): string {
  if (!difficulty) return "";
  const d = difficulty.toLowerCase();
  if (d === "easy") return "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (d === "moderate") return "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (d === "hard" || d === "challenging") return "border-transparent bg-red-500/15 text-red-600 dark:text-red-400";
  return "";
}

function formatTripDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

interface GroupCardProps {
  group: GroupRow;
  className?: string;
  /** Dashboard (My Groups) view: link to unified messenger /messages?to=group:id. Explore view: link to /dashboard/groups, "Go to My Groups" button. */
  isDashboardView?: boolean;
}

export function GroupCard({ group, className, isDashboardView = false }: GroupCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const isCreator = Boolean(currentUserId && currentUserId === group.user_id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const href = isDashboardView ? `/messages?to=group:${group.id}` : "/dashboard/groups";
  const maxMembers = group.max_members ?? 10;
  const memberCount = group.member_count ?? 0;
  const isFull = memberCount >= maxMembers;
  const joinHref =
    !isDashboardView && group.invite_code
      ? `/dashboard/groups/join?code=${encodeURIComponent(group.invite_code)}`
      : null;
  const buttonLabel = isDashboardView ? "Open Chat" : isFull ? "Full" : "Join";
  const buttonVariant = isDashboardView ? "default" : "outline";

  const hasCoords =
    typeof group.destination_lat === "number" &&
    typeof group.destination_lng === "number";
  const staticMapUrl =
    hasCoords && MAPBOX_TOKEN
      ? getStaticMapImageUrl(
          group.destination_lng!,
          group.destination_lat!,
          MAPBOX_TOKEN
        )
      : null;

  const cardMedia = (
    <div className="relative h-32 w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#0066FF]/20 to-[#0066FF]/5">
      {staticMapUrl ? (
        <img
          src={staticMapUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-4">
          <UsersRound className="size-12 text-[#0066FF]/60" aria-hidden />
        </div>
      )}
      <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        {group.country_name ? (
          <Badge variant="secondary" className="text-xs shadow-sm">
            {group.country_name}
          </Badge>
        ) : null}
        {group.difficulty_level ? (
          <Badge
            variant="secondary"
            className={cn("text-xs shadow-sm", difficultyBadgeClass(group.difficulty_level))}
          >
            {group.difficulty_level}
          </Badge>
        ) : null}
      </div>
    </div>
  );

  const handleOpenEdit = () => {
    setMenuOpen(false);
    setEditName(group.name);
    setEditDescription(group.description ?? "");
    setEditOpen(true);
  };

  const handleOpenDelete = () => {
    setMenuOpen(false);
    setDeleteOpen(true);
  };

  async function handleSaveEdit() {
    setEditSaving(true);
    const result = await updateGroupSettings(group.id, {
      name: editName.trim() || group.name,
      description: editDescription.trim() || undefined,
    });
    setEditSaving(false);
    if (result.success) {
      setEditOpen(false);
      toast.success("Group updated.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmDelete() {
    setDeleteLoading(true);
    const result = await deleteGroup(group.id);
    setDeleteLoading(false);
    if (result.success) {
      setDeleteOpen(false);
      toast.success("Group deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Card
        className={cn(
          "flex h-full flex-col overflow-hidden border-[#0066FF]/10 bg-card transition-shadow hover:shadow-lg hover:shadow-[#0066FF]/5",
          className
        )}
      >
        <div className="relative">
          {isCreator && (
            <div className="absolute right-2 top-2 z-10">
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-8 rounded-full bg-background/80 shadow hover:bg-muted"
                      aria-label="Group actions"
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </Button>
                  }
                />
                <PopoverContent align="end" side="bottom" sideOffset={4} className="w-48 p-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={handleOpenEdit}
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit Group
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    onClick={handleOpenDelete}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Delete Group
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {isDashboardView ? (
            <>
              {cardMedia}
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">{group.name}</h3>
                    {group.category && (
                      <Badge
                        variant={group.category === "Forest" ? "success" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {group.category}
                      </Badge>
                    )}
                  </div>
                  {group.trip_date && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                      {formatTripDate(group.trip_date)}
                    </p>
                  )}
                  {group.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[#737373]">{group.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-[#737373]">No description.</p>
                  )}
                </div>
                {(memberCount > 0 || maxMembers > 0) && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UsersRound className="size-3.5 shrink-0" aria-hidden />
                    <span>
                      {memberCount} / {maxMembers} members
                    </span>
                  </p>
                )}
                <div className="mt-auto flex w-fit items-center gap-2">
                  <Link
                    href={href}
                    className={cn(
                      buttonVariants({ variant: buttonVariant, size: "sm" }),
                      "inline-flex items-center gap-2"
                    )}
                  >
                    {buttonLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              {cardMedia}
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">{group.name}</h3>
                    {group.category && (
                      <Badge
                        variant={group.category === "Forest" ? "success" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {group.category}
                      </Badge>
                    )}
                  </div>
                  {group.trip_date && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                      {formatTripDate(group.trip_date)}
                    </p>
                  )}
                  {group.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[#737373]">{group.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-[#737373]">No description.</p>
                  )}
                </div>
                {(memberCount > 0 || maxMembers > 0) && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UsersRound className="size-3.5 shrink-0" aria-hidden />
                    <span>
                      {memberCount} / {maxMembers} members
                    </span>
                  </p>
                )}
                <div className="mt-auto flex w-fit items-center gap-2">
                  {isFull ? (
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "cursor-not-allowed opacity-70"
                      )}
                    >
                      Full
                    </span>
                  ) : joinHref ? (
                    <Link
                      href={joinHref}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "inline-flex items-center gap-2"
                      )}
                    >
                      Join
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <Link
                      href={href}
                      className={cn(
                        buttonVariants({ variant: buttonVariant, size: "sm" }),
                        "inline-flex items-center gap-2"
                      )}
                    >
                      Go to My Groups
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Change the group name and description.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Group name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Group description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group and all its messages from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
