"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSafetyPrivacy } from "@/app/actions/safety-privacy";
import { MapPin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  showApproximateLocation: boolean;
  allowOnlyVerifiedToMessage: boolean;
};

export function SafetyPrivacyForm({
  showApproximateLocation: initialShowLocation,
  allowOnlyVerifiedToMessage: initialAllowVerifiedOnly,
}: Props) {
  const router = useRouter();
  const [showApproximateLocation, setShowApproximateLocation] =
    useState(initialShowLocation);
  const [allowOnlyVerifiedToMessage, setAllowOnlyVerifiedToMessage] =
    useState(initialAllowVerifiedOnly);
  const [saving, setSaving] = useState(false);

  async function handleToggle(
    key: "location" | "verified",
    value: boolean
  ) {
    setSaving(true);
    if (key === "location") setShowApproximateLocation(value);
    else setAllowOnlyVerifiedToMessage(value);
    const result = await updateSafetyPrivacy({
      show_approximate_location: key === "location" ? value : showApproximateLocation,
      allow_only_verified_to_message:
        key === "verified" ? value : allowOnlyVerifiedToMessage,
    });
    setSaving(false);
    if (result.success) {
      router.refresh();
      toast.success("Settings saved.");
    } else {
      if (key === "location") setShowApproximateLocation(!value);
      else setAllowOnlyVerifiedToMessage(!value);
      toast.error(result.error);
    }
  }

  return (
    <Card className="border-[#0066FF]/10">
      <CardHeader>
        <CardTitle className="text-[#0a0a0a]">Privacy toggles</CardTitle>
        <CardDescription>
          These settings are saved to your profile and respected across the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
              <MapPin className="size-5 text-[#0066FF]" />
            </div>
            <div>
              <p className="font-medium text-[#0a0a0a]">
                Show my approximate location on the Global Map
              </p>
              <p className="text-xs text-[#737373]">
                When on, your approximate area may appear on the safety map for other travelers.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showApproximateLocation}
            disabled={saving}
            onClick={() => handleToggle("location", !showApproximateLocation)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 disabled:opacity-50",
              showApproximateLocation ? "bg-[#0066FF]" : "bg-[#e5e5e5]"
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
                showApproximateLocation && "translate-x-5"
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
              <MessageCircle className="size-5 text-[#0066FF]" />
            </div>
            <div>
              <p className="font-medium text-[#0a0a0a]">
                Allow only Verified Travelers to message me
              </p>
              <p className="text-xs text-[#737373]">
                When on, only users with the Verified Traveler badge can send you messages.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowOnlyVerifiedToMessage}
            disabled={saving}
            onClick={() =>
              handleToggle("verified", !allowOnlyVerifiedToMessage)
            }
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 disabled:opacity-50",
              allowOnlyVerifiedToMessage ? "bg-[#0066FF]" : "bg-[#e5e5e5]"
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
                allowOnlyVerifiedToMessage && "translate-x-5"
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
