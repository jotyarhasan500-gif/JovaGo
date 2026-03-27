"use client";

import { MOCK_TRAVELERS } from "@/lib/discovery-data";
import Link from "next/link";

const AVATARS = [...MOCK_TRAVELERS, ...MOCK_TRAVELERS].map((t, i) => ({
  id: `marquee-${t.id}-${i}`,
  initials: t.avatarInitials,
  profileId: t.id,
}));

export function RecentlyJoinedMarquee() {
  return (
    <section className="border-y border-border bg-background py-6">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recently Joined
      </p>
      <div className="overflow-hidden">
        <div className="flex w-max animate-marquee-scroll gap-6">
          {AVATARS.map((a) => (
            <Link
              key={a.id}
              href={`/traveler/${a.profileId}`}
              className="flex shrink-0 flex-col items-center gap-1 transition-opacity hover:opacity-90"
            >
              <div className="flex size-12 items-center justify-center rounded-full border-2 border-border bg-primary/15 text-sm font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                {a.initials}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
