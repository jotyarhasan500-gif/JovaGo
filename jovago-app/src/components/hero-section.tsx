"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TypewriterDestinations } from "@/components/hero/typewriter-destinations";
import { HeroBackground } from "@/components/hero/hero-background";
import { HeroTrustBar } from "@/components/hero/hero-trust-bar";
import { RecentlyJoinedMarquee } from "@/components/hero/recently-joined-marquee";
import {
  CONTINENTS,
  HOLD_AFTER_TYPEWRITER_MS,
} from "@/components/hero/hero-continents";

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypewriterComplete = useCallback(() => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null;
      setIndex((i) => (i + 1) % CONTINENTS.length);
    }, HOLD_AFTER_TYPEWRITER_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* Negative margin pulls hero background under the sticky navbar (h-14 = 56px) */}
      <section className="relative min-h-[90vh] -mt-14 flex flex-col items-center justify-center overflow-hidden pt-14">
        <HeroBackground currentIndex={index} />

        <div className="relative z-10 w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Heading with typewriter – vertical spacing so continent names don't overlap static text */}
          <h1 className="my-4 flex flex-wrap items-baseline justify-center gap-x-1 text-center text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
            <span>Find your travel buddy in</span>
            <TypewriterDestinations
              currentIndex={index}
              onTypewriterComplete={handleTypewriterComplete}
            />
          </h1>

          {/* Sub-heading */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/90 drop-shadow sm:text-xl">
            JovaGo: Go Together, Travel Safer. Connect with verified travelers
            who share your vibe.
          </p>

          {/* CTA */}
          <div className="mt-10 flex justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-12 rounded-full bg-[#0066FF] px-8 text-base font-semibold text-white shadow-[0_0_32px_rgba(0,102,255,0.5)] transition-all hover:bg-[#0052CC] hover:shadow-[0_0_40px_rgba(0,102,255,0.6)] sm:h-14 sm:px-10 sm:text-lg"
              >
                Start Your Journey
              </Button>
            </Link>
          </div>

          {/* Dynamic Trust Bar */}
          <div className="mx-auto mt-8 max-w-2xl">
            <HeroTrustBar />
          </div>
        </div>
      </section>

      {/* Recently Joined marquee */}
      <RecentlyJoinedMarquee />
    </>
  );
}
