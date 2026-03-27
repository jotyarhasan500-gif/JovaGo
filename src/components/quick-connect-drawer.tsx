"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { sendConnectionRequest } from "@/app/actions/send-connection-request";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export type QuickConnectTraveler = {
  id: string;
  name: string;
  destination: string;
  avatarInitials: string;
  interests: string[];
  matchScore?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traveler: QuickConnectTraveler | null;
};

const TEMPLATES: {
  type: "destination" | "interest" | "coffee";
  icon: string;
  label: string;
  build: (destination: string, interest: string) => string;
}[] = [
  {
    type: "destination",
    icon: "🌍",
    label: "High Match — trip",
    build: (d) =>
      `🌍 High Match! Would love to chat about your trip to ${d || "your destination"}.`,
  },
  {
    type: "interest",
    icon: "👋",
    label: "Shared interest",
    build: (_, i) =>
      `👋 Hey! I see we both love ${i || "travel"}. Ready to plan?`,
  },
  {
    type: "coffee",
    icon: "☕",
    label: "Virtual coffee",
    build: () =>
      `☕ Let's grab a virtual coffee and talk travel!`,
  },
];

export function QuickConnectDrawer({
  open,
  onOpenChange,
  traveler,
}: Props) {
  const [sending, setSending] = useState(false);

  const destination =
    traveler?.destination?.replace(/,.*$/, "").trim() || "your destination";
  const interest = traveler?.interests?.[0] || "travel";
  const matchScore =
    traveler?.matchScore != null
      ? Math.min(100, Math.max(0, traveler.matchScore))
      : null;

  async function handleSend(
    templateType: "destination" | "interest" | "coffee",
    messageText: string
  ) {
    if (!traveler) return;
    setSending(true);
    const result = await sendConnectionRequest({
      toUserId: traveler.id,
      messageTemplateType: templateType,
      messageText,
    });
    setSending(false);
    if (result.success) {
      onOpenChange(false);
      toast.success("Request sent! They'll see your message in their inbox.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent showCloseButton>
        {traveler && (
          <>
            <DrawerHeader className="border-b border-[#e5e7eb]">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#0066FF]/15 text-lg font-semibold text-[#0066FF]">
                  {traveler.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <DrawerTitle className="text-[#1e293b]">
                    Connect with {traveler.name}
                  </DrawerTitle>
                  {matchScore != null && (
                    <p className="mt-1 text-sm font-medium text-[#0066FF]">
                      {matchScore}% Compatibility Match
                    </p>
                  )}
                </div>
              </div>
            </DrawerHeader>
            <DrawerBody className="gap-6 pt-6">
              <div>
                <p className="mb-3 text-sm font-semibold text-[#1e293b]">
                  Smart templates
                </p>
                <div className="flex flex-col gap-2">
                  {TEMPLATES.map((t) => {
                    const text = t.build(destination, interest);
                    return (
                      <Button
                        key={t.type}
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-auto justify-start gap-2 whitespace-normal py-3 text-left font-normal",
                          "border-[#e5e7eb] hover:border-[#0066FF]/40 hover:bg-[#eff6ff]"
                        )}
                        disabled={sending}
                        onClick={() => handleSend(t.type, text)}
                      >
                        <span aria-hidden>{t.icon}</span>
                        <span>{text}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div
                className={cn(
                  "flex gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4"
                )}
                role="alert"
              >
                <ShieldAlert className="size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    JovaGo Safety
                  </p>
                  <p className="mt-0.5 text-sm text-amber-800/90">
                    Never send money or personal documents in the first chat.
                  </p>
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
