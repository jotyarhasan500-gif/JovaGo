"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CONTINENTS,
  TYPEWRITER_CHAR_DELAY_MS,
} from "./hero-continents";

type Props = {
  currentIndex: number;
  onTypewriterComplete?: () => void;
};

/** Split string into grapheme clusters (handles combining characters e.g. accented or RTL). Falls back to code points. */
function splitGraphemes(str: string): string[] {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return [...segmenter.segment(str)].map((s) => s.segment);
  }
  return [...str];
}

/** Min width to fit longest name (e.g. South America) without pushing other UI; inline-block/flex keeps it centered. */
const ROTATING_TEXT_MIN_WIDTH_CLASS =
  "min-w-[13rem] sm:min-w-[15rem] md:min-w-[17rem]";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: TYPEWRITER_CHAR_DELAY_MS / 1000,
      delayChildren: 0,
    },
  },
};

const charVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function TypewriterDestinations({
  currentIndex,
  onTypewriterComplete,
}: Props) {
  const name = CONTINENTS[currentIndex % CONTINENTS.length];
  const chars = useMemo(() => splitGraphemes(name), [name]);

  useEffect(() => {
    if (!onTypewriterComplete) return;
    const typewriterDuration = chars.length * TYPEWRITER_CHAR_DELAY_MS;
    const buffer = 200;
    const t = setTimeout(
      onTypewriterComplete,
      typewriterDuration + buffer
    );
    return () => clearTimeout(t);
  }, [name, chars.length, onTypewriterComplete]);

  return (
    <span
      className={`inline-flex min-h-[1.2em] shrink-0 items-center justify-center text-center whitespace-nowrap ${ROTATING_TEXT_MIN_WIDTH_CLASS}`}
      dir="auto"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="relative flex min-h-[1.2em] w-full min-w-0 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={name}
            className="absolute inset-x-0 flex flex-nowrap items-center justify-center whitespace-nowrap font-bold text-[#0066FF]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily:
                "var(--font-noto-arabic), var(--font-geist-sans), sans-serif",
            }}
          >
            {chars.map((char, i) => (
              <motion.span
                key={`${name}-${i}`}
                variants={charVariants}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
