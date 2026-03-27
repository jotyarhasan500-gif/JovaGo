"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  blockUser,
  unblockUser,
  reportUser,
} from "@/app/actions/safety-privacy";
import { Ban, MessageCircle, Flag } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";

type Props = {
  profileId: string;
  isOwner: boolean;
  canMessage: boolean;
  allowOnlyVerifiedToMessage: boolean;
  viewerVerified: boolean;
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
};

export function ProfileActions({
  profileId,
  isOwner,
  canMessage,
  allowOnlyVerifiedToMessage,
  viewerVerified,
  isBlockedByMe,
  isBlockedByThem,
}: Props) {
  const router = useRouter();
  const { openChat } = useChatStore();
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  async function handleBlock() {
    setBlocking(true);
    const result = await blockUser(profileId);
    setBlocking(false);
    if (result.success) {
      router.refresh();
      toast.success("User blocked.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleUnblock() {
    setBlocking(true);
    const result = await unblockUser(profileId);
    setBlocking(false);
    if (result.success) {
      router.refresh();
      toast.success("User unblocked.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleReport(reason?: string) {
    setReporting(true);
    const result = await reportUser(profileId, reason);
    setReporting(false);
    setReportModalOpen(false);
    if (result.success) {
      router.refresh();
      toast.success("Report submitted. Thanks for helping keep the community safe.");
    } else {
      toast.error(result.error);
    }
  }

  if (isOwner) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {canMessage && (
        <Button
          type="button"
          onClick={() => openChat(profileId)}
          className="gap-2 bg-[#0066FF] hover:bg-[#0052CC]"
        >
          <MessageCircle className="size-4" />
          Message
        </Button>
      )}
      {!canMessage && !isBlockedByMe && isBlockedByThem && (
        <p className="text-sm text-[#737373]">
          You cannot message this user.
        </p>
      )}
      {!canMessage && allowOnlyVerifiedToMessage && !viewerVerified && !isBlockedByThem && (
        <p className="text-sm text-[#737373]">
          Only Verified Travelers can message this user.
        </p>
      )}

      {isBlockedByMe ? (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={blocking}
          onClick={handleUnblock}
        >
          <Ban className="size-4" />
          {blocking ? "Unblocking…" : "Unblock user"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={blocking}
          onClick={handleBlock}
        >
          <Ban className="size-4" />
          {blocking ? "Blocking…" : "Block user"}
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        className="gap-2"
        disabled={reporting}
        onClick={() => setReportModalOpen(true)}
      >
        <Flag className="size-4" />
        {reporting ? "Submitting…" : "Report"}
      </Button>

      {reportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleReport}
          submitting={reporting}
        />
      )}
    </div>
  );
}

function ReportModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (reason?: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
        <h3 id="report-title" className="text-lg font-semibold text-[#0a0a0a]">
          Report user
        </h3>
        <p className="mt-1 text-sm text-[#737373]">
          Your report will be reviewed by our team. Optional reason below.
        </p>
        <textarea
          className="mt-3 w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm"
          placeholder="Reason (optional)"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(reason.trim() || undefined)}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
