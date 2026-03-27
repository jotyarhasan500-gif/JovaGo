"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export type SubmitSafetyReportInput = {
  locationName: string;
  safetyRating: number;
  category: string;
  comment?: string | null;
  isAnonymous: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

export type SubmitSafetyReportResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function submitSafetyReport(
  input: SubmitSafetyReportInput
): Promise<SubmitSafetyReportResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Please sign in to submit a safety report.",
      };
    }
    const supabase = await createClient();
  const tags = [input.category];

  const { data, error } = await supabase
    .from("safety_reports")
    .insert({
      user_id: userId,
      location_name: input.locationName,
      safety_rating: input.safetyRating,
      tags,
      comment: input.comment ?? null,
      is_anonymous: input.isAnonymous,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
