"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExploreFiltersBar, type ExploreFiltersValues } from "@/components/explore/explore-filters-bar";
import { ViewToggle, type ViewMode } from "@/components/explore/view-toggle";
import { GroupCard } from "@/components/explore/group-card";
import { ExploreGroupsMap } from "@/components/explore/explore-groups-map";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupRow } from "@/app/actions/groups";
import { GROUP_CATEGORIES, GROUP_DIFFICULTIES } from "@/lib/group-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createGroup } from "@/app/actions/groups";
import { getSubscriptionTier, getCurrentUserProfileForHeader } from "@/app/actions/profile";
import { LocationPickerMap, type PickedLocation } from "@/components/explore/location-picker-map";
import { toast } from "sonner";
import { Crown } from "lucide-react";

type Props = { initialGroups: GroupRow[] };

export function ExplorePageClient({ initialGroups }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(10);
  const [category, setCategory] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [destination, setDestination] = useState<PickedLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ExploreFiltersValues>({
    category: "all",
    difficulty: "all",
    upcomingOnly: true,
  });

  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    Promise.all([getSubscriptionTier(), getCurrentUserProfileForHeader()]).then(
      ([tier, profile]) => {
        setSubscriptionTier(tier);
        setUserRole(profile?.role ?? null);
      }
    );
  }, []);

  const isAdmin = userRole === "admin" || userRole === "owner";
  const canCreateGroup =
    isAdmin || (subscriptionTier?.toLowerCase() ?? "") === "ultimate";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const searchLower = searchQuery.trim().toLowerCase();
  const filteredGroups = initialGroups.filter((g) => {
    if (searchLower) {
      const name = (g.name ?? "").toLowerCase();
      const desc = (g.description ?? "").toLowerCase();
      if (!name.includes(searchLower) && !desc.includes(searchLower)) return false;
    }
    if (filters.category !== "all" && g.category !== filters.category) return false;
    if (filters.difficulty !== "all" && g.difficulty_level !== filters.difficulty) return false;
    if (filters.upcomingOnly && g.trip_date) {
      try {
        const tripD = new Date(g.trip_date);
        if (tripD < todayStart) return false;
      } catch {
        // keep if date invalid
      }
    }
    return true;
  });

  async function handleGroupButtonClick() {
    const [latestTier, profile] = await Promise.all([
      getSubscriptionTier(),
      getCurrentUserProfileForHeader(),
    ]);
    setSubscriptionTier(latestTier);
    setUserRole(profile?.role ?? null);
    const allowed =
      profile?.role?.toLowerCase() === "admin" ||
      profile?.role?.toLowerCase() === "owner" ||
      (latestTier?.toLowerCase() ?? "") === "ultimate";
    if (allowed) {
      setCreateGroupOpen(true);
    } else {
      router.push("/pricing");
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = groupName.trim();
    const description = groupDescription.trim();
    const max = Number(maxMembers);
    const cat = category.trim();
    const date = tripDate.trim();
    const diff = difficulty.trim();
    const meeting = meetingPoint.trim();
    if (!name || !description || !(max >= 2) || !cat || !date || !diff || !meeting) {
      toast.error("All fields are required. Max members must be at least 2.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createGroup(name, description, {
        max_members: max,
        category: cat,
        trip_date: date,
        difficulty: diff,
        meeting_point: meeting,
        destination_lat: destination?.lat ?? undefined,
        destination_lng: destination?.lng ?? undefined,
        country_name: destination?.country_name ?? undefined,
        country_code: destination?.country_code ?? undefined,
      });
      if (result.success) {
        toast.success("Group created successfully.");
        setCreateGroupOpen(false);
        setGroupName("");
        setGroupDescription("");
        setMaxMembers(10);
        setCategory("");
        setTripDate("");
        setDifficulty("");
        setMeetingPoint("");
        setDestination(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (_err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col" suppressHydrationWarning>
        <div className="flex flex-1 flex-col border-b border-border bg-card px-4 py-6">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-4 flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" suppressHydrationWarning>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-3 border-b border-border bg-card sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <ExploreFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            className="w-full sm:min-w-0"
          />
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 sm:border-t-0 sm:border-l sm:px-4 sm:py-3 sm:pl-6">
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGroupButtonClick}
                suppressHydrationWarning
              >
                {canCreateGroup ? (
                  <>
                    <Crown className="size-3.5 shrink-0" aria-hidden />
                    Create Group
                  </>
                ) : (
                  "Upgrade to Ultimate to Create Groups"
                )}
              </Button>
            </div>
            <span className="text-sm text-[#737373] sm:sr-only">View mode</span>
            <ViewToggle mode={viewMode} onModeChange={setViewMode} />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === "list" ? (
            <ScrollArea className="h-full">
              <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <h2 className="mb-4 text-lg font-semibold text-[#0a0a0a]">
                  {filteredGroups.length} group
                  {filteredGroups.length !== 1 ? "s" : ""} found
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <GroupCard key={group.id} group={group} isDashboardView={false} />
                    ))
                  ) : (
                    <p className="col-span-full py-12 text-center text-[#737373]">
                      No groups found. Try changing filters or create one to get started.
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full min-h-[50vh] w-full p-4">
              <ExploreGroupsMap groups={filteredGroups} />
            </div>
          )}
        </div>
      </div>

      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Add a new travel group. You will be the owner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup}>
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="group-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  required
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="group-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Input
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group description"
                  required
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="group-max-members" className="text-sm font-medium text-foreground">
                  Max Members
                </label>
                <Input
                  id="group-max-members"
                  type="number"
                  min={2}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value) || 2)}
                  required
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Category
                </label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v ?? "")}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="group-trip-date" className="text-sm font-medium text-foreground">
                  Trip Date
                </label>
                <Input
                  id="group-trip-date"
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  required
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Difficulty Level
                </label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v ?? "")}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="group-meeting-point" className="text-sm font-medium text-foreground">
                  Meeting Point
                </label>
                <Input
                  id="group-meeting-point"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="Where the group will meet"
                  required
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Destination (optional)
                </label>
                <LocationPickerMap
                  value={destination}
                  onChange={setDestination}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateGroupOpen(false)}
                suppressHydrationWarning
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} suppressHydrationWarning>
                {submitting ? "Creating…" : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
