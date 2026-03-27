/**
 * Notification sound for new messages (group and private chat).
 * Uses a single Audio instance and unlocks on first user interaction for browser autoplay policy.
 */

const NOTIFICATION_SOUND_URL =
  "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
  }
  return audio;
}

/**
 * Call once after first user interaction (click/key/touch) so later play() is allowed.
 * Attach to document in a client component on mount.
 */
export function unlockNotificationSound(): void {
  if (typeof window === "undefined" || unlocked) return;
  try {
    const a = getAudio();
    a.src = NOTIFICATION_SOUND_URL;
    a.volume = 0.5;
    const p = a.play();
    if (p?.then) {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        unlocked = true;
      }).catch(() => {
        // Autoplay blocked; will work after user interaction elsewhere
      });
    } else {
      unlocked = true;
    }
  } catch {
    // Ignore
  }
}

export type PlayNotificationSoundOptions = {
  /**
   * If true, only play when the window is not focused OR the user is viewing a different chat.
   * Use false to always play when the condition (not own message) is met.
   * @default true
   */
  onlyWhenUnfocusedOrDifferentChat?: boolean;
  /**
   * Pass true when the new message belongs to a different conversation than the one currently open.
   */
  isDifferentChat?: boolean;
};

/**
 * Play the notification sound. Call when a new message arrives from another user.
 * Respects browser autoplay: call unlockNotificationSound() after first user interaction.
 */
export function playNotificationSound(options?: PlayNotificationSoundOptions): void {
  if (typeof window === "undefined") return;

  const onlyWhenUnfocusedOrDifferent = options?.onlyWhenUnfocusedOrDifferentChat !== false;
  const isDifferentChat = options?.isDifferentChat === true;
  const windowFocused = document.hasFocus();

  if (onlyWhenUnfocusedOrDifferent && windowFocused && !isDifferentChat) {
    return;
  }

  try {
    const a = getAudio();
    a.src = NOTIFICATION_SOUND_URL;
    a.volume = 0.5;
    a.play().catch(() => {
      // Autoplay blocked or other error; ignore
    });
  } catch {
    // Ignore
  }
}
