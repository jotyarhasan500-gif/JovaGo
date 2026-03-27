"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatDistanceStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewPostDialog } from "@/components/dashboard/new-post-dialog";
import { getPosts, type PostRow } from "@/app/actions/posts";
import { getClerkUsersInfo, type ClerkUserInfo } from "@/app/actions/clerk-users";
import { Plus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { initialPosts: PostRow[] };

/** Minimalist timestamp: "20m", "2h", "1d" */
function timeAgoShort(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const s = formatDistanceStrict(d, now, { addSuffix: false });
    const num = s.replace(/\D/g, "") || "0";
    if (/second/.test(s)) return num === "0" ? "now" : `${num}s`;
    if (/minute/.test(s)) return `${num}m`;
    if (/hour/.test(s)) return `${num}h`;
    if (/day/.test(s)) return `${num}d`;
    if (/month/.test(s)) return `${num}mo`;
    if (/year/.test(s)) return `${num}y`;
    return s;
  } catch {
    return "";
  }
}

function PostCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-full max-w-[90%]" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </article>
  );
}

function PostCard({
  post,
  userInfo,
}: {
  post: PostRow;
  userInfo: ClerkUserInfo | null;
}) {
  const loadingUser = !userInfo;
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header: avatar, name, time ago */}
      <div className="flex items-center gap-3 p-3">
        {loadingUser ? (
          <Skeleton className="size-9 shrink-0 rounded-full" />
        ) : userInfo.imageUrl ? (
          <img
            src={userInfo.imageUrl}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {userInfo.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {loadingUser ? (
            <>
              <Skeleton className="mb-1.5 h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </>
          ) : (
            <>
              <p className="truncate text-sm font-semibold text-foreground">
                {userInfo.fullName}
              </p>
              {post.location_name && (
                <p className="truncate text-xs text-muted-foreground">
                  {post.location_name}
                </p>
              )}
              <time
                dateTime={post.created_at}
                className="text-xs text-muted-foreground"
              >
                {timeAgoShort(post.created_at)}
              </time>
            </>
          )}
        </div>
      </div>
      {/* Media + View on Map */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Link
          href={
            post.latitude != null && post.longitude != null
              ? `/safety-map?lat=${post.latitude}&lng=${post.longitude}`
              : "/safety-map"
          }
          className="block h-full w-full"
          aria-label="View on map"
        >
          <img
            src={post.image_url}
            alt={post.caption ?? "Post image"}
            className="h-full w-full object-cover transition-opacity hover:opacity-95"
          />
        </Link>
        {post.latitude != null && post.longitude != null && (
          <Link
            href={`/safety-map?lat=${post.latitude}&lng=${post.longitude}`}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/75"
          >
            <MapPin className="size-3.5" aria-hidden />
            View on Map
          </Link>
        )}
      </div>
      {/* Footer: caption */}
      {post.caption && (
        <div className="p-3 pt-2">
          <p className="text-sm text-foreground">{post.caption}</p>
        </div>
      )}
    </article>
  );
}

export function ExplorePostsClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [userMap, setUserMap] = useState<Record<string, ClerkUserInfo>>({});
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [loading, setLoading] = useState(initialPosts.length === 0);

  const userIds = useMemo(
    () => [...new Set(posts.map((p) => p.user_id))],
    [posts]
  );

  useEffect(() => {
    setPosts(initialPosts);
    setLoading(initialPosts.length === 0);
  }, [initialPosts]);

  useEffect(() => {
    if (userIds.length === 0) return;
    let cancelled = false;
    getClerkUsersInfo(userIds).then((map) => {
      if (!cancelled) setUserMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [userIds.join(",")]);

  function handleCloseDialog(open: boolean) {
    if (!open) {
      setLoading(true);
      getPosts().then((next) => {
        setPosts(next);
        setLoading(false);
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header + New Post */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Explore</h1>
          <Button
            type="button"
            onClick={() => setNewPostOpen(true)}
            className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white shrink-0"
          >
            <Plus className="size-4" aria-hidden />
            New Post
          </Button>
        </div>

        {/* Grid: 3 cols desktop, 1 mobile */}
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          )}
        >
          {loading && posts.length === 0 ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </>
          ) : posts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <p className="text-muted-foreground">No posts yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to share a moment.
              </p>
              <Button
                type="button"
                onClick={() => setNewPostOpen(true)}
                className="mt-4 bg-[#0066FF] hover:bg-[#0052cc]"
              >
                <Plus className="size-4 mr-2" />
                New Post
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userInfo={userMap[post.user_id] ?? null}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating New Post button */}
      <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8">
        <Button
          type="button"
          onClick={() => setNewPostOpen(true)}
          className="size-14 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-lg shadow-black/20 sm:size-16"
          aria-label="Create new post"
        >
          <Plus className="size-7 sm:size-8" aria-hidden />
        </Button>
      </div>

      <NewPostDialog open={newPostOpen} onOpenChange={handleCloseDialog} />
    </div>
  );
}
