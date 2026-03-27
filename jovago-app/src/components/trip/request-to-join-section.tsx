"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert } from "lucide-react";

const SAFETY_GUIDELINES = [
  "Meet in public places for the first time.",
  "Never share financial details or send money before meeting.",
  "Use JovaGo in-app chat until you're comfortable.",
  "Tell someone you trust about your plans and share your location.",
  "Verify the organizer's trust score and verified badge.",
];

export function RequestToJoinSection() {
  const [readGuidelines, setReadGuidelines] = useState(false);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-[#0a0a0a]">
          <ShieldAlert className="size-5 text-[#0066FF]" />
          Safety guidelines
        </CardTitle>
        <p className="text-sm text-[#737373]">
          Please read before requesting to join this trip.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-[#525252]">
          {SAFETY_GUIDELINES.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#0066FF]" aria-hidden>•</span>
              {line}
            </li>
          ))}
        </ul>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#0066FF]/20 bg-[#0066FF]/5 p-4">
          <Checkbox
            checked={readGuidelines}
            onCheckedChange={(v) => setReadGuidelines(v === true)}
            aria-describedby="guidelines-desc"
          />
          <span id="guidelines-desc" className="text-sm font-medium text-[#0a0a0a]">
            I have read the Safety Guidelines and agree to follow them.
          </span>
        </label>
        <Button
          disabled={!readGuidelines}
          className="w-full bg-[#0066FF] text-white hover:bg-[#0052CC] disabled:opacity-50"
          onClick={() => alert("Request sent! The organizer will get in touch.")}
        >
          Request to join
        </Button>
      </CardContent>
    </Card>
  );
}
