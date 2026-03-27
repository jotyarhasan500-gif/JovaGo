"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeCheck, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Traveler } from "@/lib/discovery-data";
import type { QuickConnectTraveler } from "@/components/quick-connect-drawer";

interface TravelerCardProps {
  traveler: Traveler;
  index?: number;
  onConnect?: (traveler: QuickConnectTraveler) => void;
}

export function TravelerCard({ traveler, index = 0, onConnect }: TravelerCardProps) {
  const showMatch =
    traveler.matchScore != null && (traveler.matchReasons?.length ?? 0) > 0;
  const matchReason = traveler.matchReasons?.[0];
  const isTopMatch = showMatch && traveler.matchScore! > 90;
  const clampedScore = showMatch
    ? Math.min(100, Math.max(0, traveler.matchScore!))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="h-full"
    >
      <Link href={`/traveler/${traveler.id}`} className="block h-full">
        <Card className="group/card relative h-full overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer ring-1 ring-border">
          {isTopMatch && (
            <div className="absolute left-0 right-0 top-0 z-10 flex justify-center pt-2">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md"
              >
                <Sparkles className="size-3" />
                Top Match
              </motion.span>
            </div>
          )}
          <CardHeader className={cn("flex flex-row items-start gap-3 pb-2", isTopMatch && "pt-8")}>
            {/* Avatar with Verified badge */}
            <div className="relative shrink-0">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary shadow-inner">
                {traveler.avatarInitials}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#0066FF] text-white"
                title="Verified"
              >
                <BadgeCheck className="size-3.5" strokeWidth={2.5} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">
                    {traveler.name}
                  </h3>
                  <p className="truncate text-sm text-primary">
                    Heading to {traveler.destination}
                  </p>
                  {showMatch && matchReason && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      <span className="text-primary" aria-hidden>✨</span>{" "}
                      {clampedScore}% Match: {matchReason}
                    </p>
                  )}
                </div>
                {showMatch && (
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      className="inline-block shrink-0 border-0 bg-transparent p-0 cursor-default"
                      onClick={(e) => e.preventDefault()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 18,
                          delay: 0.1 + index * 0.06,
                        }}
                        className="shrink-0"
                      >
                        <Badge
                          className="cursor-default border-0 text-white shadow-sm transition-transform hover:scale-105"
                          style={{
                            background: "linear-gradient(135deg, #0066FF 0%, #4f46e5 100%)",
                          }}
                        >
                          {clampedScore}%
                        </Badge>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[220px] border-border bg-card px-3 py-2.5 text-left shadow-xl"
                    >
                      <p className="mb-1.5 text-xs font-semibold text-foreground">
                        Why you match
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {(traveler.matchReasons ?? []).map((r) => (
                          <li key={r} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-primary" aria-hidden />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-muted-foreground">{traveler.travelDates}</p>
            <p className="line-clamp-3 text-sm text-muted-foreground">{traveler.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {traveler.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
            {onConnect && (
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onConnect({
                    id: traveler.id,
                    name: traveler.name,
                    destination: traveler.destination,
                    avatarInitials: traveler.avatarInitials,
                    interests: traveler.interests,
                    matchScore: traveler.matchScore,
                  });
                }}
              >
                <MessageCircle className="size-4" />
                Connect
              </Button>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
