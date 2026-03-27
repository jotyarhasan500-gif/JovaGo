"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getGroupsByOwnerId, type GroupRow } from "@/app/actions/groups";
import { GROUP_CATEGORIES, GROUP_DIFFICULTIES } from "@/lib/group-constants";
import { Check, Filter, Search, UsersRound } from "lucide-react";

export interface ExploreFiltersValues {
  category: string;
  difficulty: string;
  upcomingOnly: boolean;
}

interface ExploreFiltersBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filters: ExploreFiltersValues;
  onFiltersChange: (f: ExploreFiltersValues) => void;
  className?: string;
}

export function ExploreFiltersBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  className,
}: ExploreFiltersBarProps) {
  const [mounted, setMounted] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
  const [myGroupsPopoverOpen, setMyGroupsPopoverOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !myGroupsPopoverOpen) return;
    getGroupsByOwnerId().then((list) => setGroups(list ?? []));
  }, [mounted, myGroupsPopoverOpen]);

  const toggleCategory = (value: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === value ? "all" : value,
    });
  };

  const toggleDifficulty = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: filters.difficulty === value ? "all" : value,
    });
  };

  const toggleUpcomingOnly = () => {
    onFiltersChange({
      ...filters,
      upcomingOnly: !filters.upcomingOnly,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: "all",
      difficulty: "all",
      upcomingOnly: false,
    });
  };

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.difficulty !== "all" ||
    filters.upcomingOnly;

  return (
    <div
      className={cn(
        "flex flex-nowrap items-center gap-2 border-b border-border bg-card px-3 py-2 sm:gap-3 sm:px-4 sm:py-3",
        className
      )}
      suppressHydrationWarning
    >
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9 pr-3 text-sm"
          aria-label="Search groups"
        />
      </div>

      {mounted ? (
        <>
          <Popover open={filtersPopoverOpen} onOpenChange={setFiltersPopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "shrink-0 border-[#0066FF]/20 gap-1.5",
                    hasActiveFilters && "border-primary/50 bg-primary/5"
                  )}
                >
                  <Filter className="size-4" aria-hidden />
                  Filters
                  {hasActiveFilters ? (
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  ) : null}
                </Button>
              }
            />
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={6}
              className="w-[280px] p-0"
              suppressHydrationWarning
            >
              <ScrollArea className="max-h-[320px]">
                <div className="p-2">
                  <p className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Category
                  </p>
                  <ul className="space-y-0.5">
                    {GROUP_CATEGORIES.map((c) => {
                      const selected = filters.category === c;
                      return (
                        <li key={c}>
                          <button
                            type="button"
                            onClick={() => toggleCategory(c)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/80",
                              selected && "bg-muted/80"
                            )}
                          >
                            <span>{c}</span>
                            {selected ? (
                              <Check className="size-4 shrink-0 text-primary" aria-hidden />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="border-t border-border p-2">
                  <p className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Difficulty
                  </p>
                  <ul className="space-y-0.5">
                    {GROUP_DIFFICULTIES.map((d) => {
                      const selected = filters.difficulty === d;
                      return (
                        <li key={d}>
                          <button
                            type="button"
                            onClick={() => toggleDifficulty(d)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/80",
                              selected && "bg-muted/80"
                            )}
                          >
                            <span>{d}</span>
                            {selected ? (
                              <Check className="size-4 shrink-0 text-primary" aria-hidden />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="border-t border-border p-2">
                  <p className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </p>
                  <button
                    type="button"
                    onClick={toggleUpcomingOnly}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/80",
                      filters.upcomingOnly && "bg-muted/80"
                    )}
                  >
                    <span>Upcoming trips only</span>
                    {filters.upcomingOnly ? (
                      <Check className="size-4 shrink-0 text-primary" aria-hidden />
                    ) : null}
                  </button>
                </div>
              </ScrollArea>
              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-muted-foreground hover:text-foreground"
                  onClick={clearAllFilters}
                >
                  Clear All
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={myGroupsPopoverOpen} onOpenChange={setMyGroupsPopoverOpen}>
            <PopoverTrigger
              render={
                <Button type="button" variant="outline" size="sm" className="shrink-0 border-[#0066FF]/20 gap-1.5">
                  <UsersRound className="size-4" aria-hidden />
                  <span className="hidden sm:inline">My Groups</span>
                </Button>
              }
            />
            <PopoverContent align="end" className="w-64 p-0" suppressHydrationWarning>
              <div className="max-h-[280px] overflow-y-auto">
                {groups.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">No groups found</p>
                ) : (
                  <ul className="py-1">
                    {groups.map((group) => (
                      <li key={group.id}>
                        <Link
                          href={`/messages?to=group:${group.id}`}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted/80"
                          onClick={() => setMyGroupsPopoverOpen(false)}
                        >
                          <Avatar className="size-8 shrink-0 border border-border">
                            <AvatarFallback className="bg-primary/20 text-xs font-medium text-foreground">
                              {(group.name?.trim() || "G").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate">{group.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-border px-2 py-2">
                <Link
                  href="/dashboard/groups"
                  className="block rounded-md px-2 py-1.5 text-sm font-medium text-[#0066FF] hover:bg-muted/80"
                  onClick={() => setMyGroupsPopoverOpen(false)}
                >
                  Manage All
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </>
      ) : null}
    </div>
  );
}
