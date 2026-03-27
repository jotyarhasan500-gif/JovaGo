"use client";

import { useEffect } from "react";
import { unlockNotificationSound } from "@/lib/notification-sound";

/**
 * Registers a one-time listener to unlock notification sound on first user interaction,
 * so that playNotificationSound() works later (browser autoplay policy).
 */
export function NotificationSoundUnlock() {
  useEffect(() => {
    const unlock = () => {
      unlockNotificationSound();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock, { once: true, passive: true });
    document.addEventListener("keydown", unlock, { once: true, passive: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);
  return null;
}
