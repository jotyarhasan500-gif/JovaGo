"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CONTINENTS,
  HERO_BG_IMAGES,
  HERO_BG_FALLBACK,
} from "./hero-continents";

type Props = {
  currentIndex: number;
};

export function HeroBackground({ currentIndex }: Props) {
  const continent = CONTINENTS[currentIndex % CONTINENTS.length];
  const imageUrl = HERO_BG_IMAGES[continent];

  useEffect(() => {
    CONTINENTS.forEach((c) => {
      const url = HERO_BG_IMAGES[c];
      const img = new window.Image();
      img.src = url;
    });
    const fallbackImg = new window.Image();
    fallbackImg.src = HERO_BG_FALLBACK;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden>
      {/* Fallback layer: world map so the screen never turns black if a continent image fails or is loading */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG_FALLBACK})` }}
        aria-hidden
      />
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={continent}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </AnimatePresence>
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
        aria-hidden
      />
    </div>
  );
}
