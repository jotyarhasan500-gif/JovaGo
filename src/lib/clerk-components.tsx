"use client";

import { Show } from "@clerk/nextjs";

/**
 * Renders children only when the user is signed in.
 * Uses Clerk's official Show component (when="signed-in") for Next.js 16 / Turbopack compatibility.
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

/**
 * Renders children only when the user is signed out.
 * Uses Clerk's official Show component (when="signed-out") for Next.js 16 / Turbopack compatibility.
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  return <Show when="signed-out">{children}</Show>;
}
