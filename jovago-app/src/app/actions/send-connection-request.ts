"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export type SendConnectionRequestInput = {
  toUserId: string;
  messageTemplateType: "destination" | "interest" | "coffee";
  messageText: string;
};

export type SendConnectionRequestResult =
  | { success: true }
  | { success: false; error: string };

/** Accept any non-empty profile id (UUID or custom auth string e.g. Clerk). */
function isValidProfileId(id: string): boolean {
  return typeof id === "string" && id.trim().length > 0;
}

export async function sendConnectionRequest(
  input: SendConnectionRequestInput
): Promise<SendConnectionRequestResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in to connect." };
    }
    const supabase = await createClient();
    const isRealProfile = isValidProfileId(input.toUserId);

    if (isRealProfile) {
      if (input.toUserId === userId) {
        return { success: false, error: "You cannot send a request to yourself." };
      }
      const { error } = await supabase.from("connection_requests").insert({
        from_user_id: userId,
        to_user_id: input.toUserId,
        message_template_type: input.messageTemplateType,
        message_text: input.messageText,
        status: "pending",
      });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
