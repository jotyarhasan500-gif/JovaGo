"use client";

import { motion } from "framer-motion";
import { Check, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrustMilestone } from "@/lib/trust-score";

type TrustScoreMeterProps = {
  score: number;
  milestones: TrustMilestone[];
  verified: boolean;
  className?: string;
  showMilestones?: boolean;
};

export function TrustScoreMeter({
  score,
  milestones,
  verified,
  className,
  showMilestones = true,
}: TrustScoreMeterProps) {
  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
        hidden: {},
      }}
    >
      {/* Score label + Verified badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <motion.div
          className="flex items-center gap-2"
          variants={{
            hidden: { opacity: 0, y: -6 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <span className="text-sm font-medium text-[#0a0a0a]">
            Trust Score
          </span>
          <span className="text-lg font-semibold tabular-nums text-[#0066FF]">
            {score}
            <span className="text-sm font-normal text-[#737373]">/100</span>
          </span>
        </motion.div>
        {verified && (
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-[#0066FF]/10 px-2.5 py-1 text-sm font-medium text-[#0066FF]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <BadgeCheck className="size-4 shrink-0" aria-hidden />
            <span>Verified Traveler</span>
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <motion.div
        className="relative h-3 w-full overflow-hidden rounded-full bg-[#e5e5e5]"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[#0066FF]"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 20,
            delay: 0.15,
          }}
        />
      </motion.div>

      {/* Milestones list */}
      {showMilestones && milestones.length > 0 && (
        <ul className="space-y-2">
          {milestones.map((m, i) => (
            <motion.li
              key={m.id}
              className={cn(
                "flex items-center gap-2 text-sm",
                m.completed ? "text-[#0a0a0a]" : "text-[#737373]"
              )}
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  m.completed
                    ? "border-[#0066FF] bg-[#0066FF] text-white"
                    : "border-border bg-card"
                )}
              >
                {m.completed ? (
                  <Check className="size-3" strokeWidth={2.5} />
                ) : (
                  <span className="text-[10px] font-medium text-[#a3a3a3]">
                    {m.points}
                  </span>
                )}
              </span>
              <span>{m.label}</span>
              {m.completed && (
                <span className="ml-auto text-xs font-medium text-[#0066FF]">
                  +{m.points}
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
