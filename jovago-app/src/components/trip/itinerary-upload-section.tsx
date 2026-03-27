"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function ItineraryUploadSection() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#0a0a0a]">
          Trip itinerary
        </CardTitle>
        <p className="text-sm text-[#737373]">
          Organizers can upload their itinerary so travelers know the plan.
        </p>
      </CardHeader>
      <CardContent>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#0066FF]/20 bg-[#0066FF]/5 py-10 transition-colors hover:border-[#0066FF]/40 hover:bg-[#0066FF]/10">
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="sr-only"
            onChange={() => setUploaded(true)}
          />
          <Upload className="size-10 text-[#0066FF]" aria-hidden />
          <span className="text-sm font-medium text-[#0066FF]">
            {uploaded ? "File added — upload another?" : "Click to upload or drag and drop"}
          </span>
          <span className="text-xs text-[#737373]">PDF, DOC or images</span>
        </label>
      </CardContent>
    </Card>
  );
}
