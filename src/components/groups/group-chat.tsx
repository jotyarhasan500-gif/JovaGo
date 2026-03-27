"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Send, Menu, Paperclip, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GroupChatMessages } from "./group-chat-messages";
import { GroupInfoDrawer } from "./group-info-drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { updateGroupMessage, deleteGroupMessage } from "@/app/actions/groups";
import { playNotificationSound } from "@/lib/notification-sound";

export type GroupMessage = {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string | null;
  user_image: string | null;
  content: string;
  created_at: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  updated_at?: string | null;
};

type GroupChatProps = {
  groupId: string | null | undefined;
  className?: string;
  fillHeight?: boolean;
  onBack?: () => void;
};

export function GroupChat({ groupId: groupIdProp, className, fillHeight, onBack }: GroupChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, string[]>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const wasSendingRef = useRef(false);

  // Restore focus to chat input when send completes so user can keep typing without clicking
  useEffect(() => {
    if (wasSendingRef.current && !sending) {
      requestAnimationFrame(() => chatInputRef.current?.focus());
    }
    wasSendingRef.current = sending;
  }, [sending]);

  const handleReaction = useCallback((msgId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const list = prev[msgId] ?? [];
      const next = list.includes(emoji) ? list.filter((e) => e !== emoji) : [...list, emoji];
      if (next.length === 0) {
        const { [msgId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [msgId]: next };
    });
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const currentUserId = user?.id ?? null;
  const groupId = typeof groupIdProp === "string" && groupIdProp.trim() ? groupIdProp.trim() : null;

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }
    const supabase = createClient();
    const fetchMessages = async () => {
      const groupIdStr = String(groupId);
      const { data, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupIdStr)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[GroupChat] Full Fetch Error:", JSON.stringify(error, null, 2));
        return;
      }
      setMessages((data ?? []) as GroupMessage[]);
    };
    fetchMessages();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const supabase = createClient();
    const channelName = `group_messages:${groupId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const senderId = raw.user_id as string;
          if (currentUserId && senderId !== currentUserId) {
            playNotificationSound({ onlyWhenUnfocusedOrDifferentChat: true, isDifferentChat: false });
          }
          const newRow: GroupMessage = {
            id: raw.id as string,
            group_id: raw.group_id as string,
            user_id: senderId,
            user_name: (raw.user_name as string)?.trim() ?? null,
            user_image: (raw.user_image as string)?.trim() ?? null,
            content: raw.content as string,
            created_at: raw.created_at as string,
            is_edited: raw.is_edited as boolean | undefined,
            is_deleted: raw.is_deleted as boolean | undefined,
            updated_at: raw.updated_at as string | null | undefined,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const id = raw.id as string;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    content: (raw.content as string) ?? m.content,
                    is_edited: (raw.is_edited as boolean) ?? m.is_edited,
                    is_deleted: (raw.is_deleted as boolean) ?? m.is_deleted,
                    updated_at: (raw.updated_at as string | null) ?? m.updated_at,
                  }
                : m
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const id = (payload.old as { id?: string })?.id;
          if (id) setMessages((prev) => prev.filter((m) => m.id !== id));
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[GroupChat] Realtime channel error for group_id:", groupId);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!groupId || !currentUserId) return;
    const supabase = createClient();
    const presenceChannel = supabase.channel(`group_presence:${groupId}`);
    presenceChannelRef.current = presenceChannel;
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const typers: string[] = [];
        Object.entries(state).forEach(([, presences]) => {
          (presences as { user_id?: string; typing?: boolean }[]).forEach((p) => {
            if (p.typing && p.user_id && p.user_id !== currentUserId) typers.push(p.user_id);
          });
        });
        setTypingUsers(typers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: currentUserId,
            user_name: user?.fullName ?? null,
            typing: false,
          });
        }
      });
    return () => {
      presenceChannelRef.current = null;
      supabase.removeChannel(presenceChannel);
    };
  }, [groupId, currentUserId, user?.fullName]);

  const sendTyping = useCallback((typing: boolean) => {
    const ch = presenceChannelRef.current;
    if (!ch || !currentUserId) return;
    ch.track({
      user_id: currentUserId,
      user_name: user?.fullName ?? null,
      typing,
    }).then(() => {});
  }, [currentUserId, user?.fullName]);

  const handleEditMessage = useCallback((msg: GroupMessage) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  }, []);

  const handleSaveEdit = useCallback(async (messageId: string, content: string) => {
    const result = await updateGroupMessage(messageId, content);
    setEditingMessageId(null);
    setEditingContent("");
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Message updated.");
      requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent("");
  }, []);

  const handleDeleteClick = useCallback((msg: GroupMessage) => {
    setDeleteConfirmMessageId(msg.id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmMessageId) return;
    setDeleting(true);
    const result = await deleteGroupMessage(deleteConfirmMessageId);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteConfirmMessageId(null);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Message deleted.");
      requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  }, [deleteConfirmMessageId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !currentUserId || sending || !groupId) return;

    const groupIdStr = String(groupId).trim();
    if (!groupIdStr) {
      toast.error("No group selected. Please reopen this chat.");
      return;
    }

    const user_id = String(currentUserId);
    const user_name = (user?.fullName?.trim() ?? "") || "";
    const user_image = (user?.imageUrl?.trim() ?? "") || "";
    const content = text;

    const newMessage = {
      group_id: groupIdStr,
      user_id,
      user_name,
      user_image,
      content,
    };
    console.log("Sending group message:", newMessage);

    setSending(true);
    setInput("");
    setReplyTo(null);
    sendTyping(false);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("group_messages")
      .insert(newMessage)
      .select("id, group_id, user_id, user_name, user_image, content, created_at")
      .single();

    if (error) {
      console.error("[GroupChat] Insert error details:", JSON.stringify(error, null, 2));
      const errMsg = (error as { message?: string }).message ?? "Failed to send message";
      toast.error(errMsg);
      setSending(false);
      requestAnimationFrame(() => chatInputRef.current?.focus());
      return;
    }

    setSending(false);
    if (data) {
      const newMsg = data as GroupMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    }
    // Restore focus to input after send so user can keep typing (runs after paint so it wins over default focus)
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden border-slate-800 bg-slate-900/80",
        fillHeight && "h-full min-h-0",
        className
      )}
    >
      <CardHeader className="shrink-0 border-b border-slate-800 py-3 px-4 flex flex-row items-center gap-2">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-slate-400 hover:text-slate-100"
            onClick={onBack}
            aria-label="Back to conversations"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-100">Group Chat</h3>
          <p className="text-sm text-slate-400">Messages for this group.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-slate-400 hover:text-slate-100"
          onClick={() => setSidebarOpen(true)}
          aria-label="Group menu"
        >
          <Menu className="size-5" />
        </Button>
      </CardHeader>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-1 flex-col min-h-0">
          <GroupChatMessages
            messages={messages}
            currentUserId={currentUserId}
            scrollRef={scrollRef}
            onReply={setReplyTo}
            reactionsMap={reactionsMap}
            onReaction={handleReaction}
            onEdit={handleEditMessage}
            onDelete={handleDeleteClick}
            editingMessageId={editingMessageId}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            className={cn("flex-1 min-h-0", !fillHeight && "h-[380px]")}
          />
          {typingUsers.length > 0 && (
            <p className="shrink-0 border-t border-slate-800/50 px-4 py-1.5 text-xs text-slate-500">
              {typingUsers.length === 1 ? "Someone is" : `${typingUsers.length} people are`} typing…
            </p>
          )}
          <form
            onSubmit={handleSend}
            className="flex shrink-0 flex-col gap-0 border-t border-slate-800"
          >
            {replyTo && (
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-800/30 px-4 py-2">
                <p className="min-w-0 truncate text-xs text-slate-400">
                  Replying to <span className="font-medium text-slate-300">{replyTo.user_name || "Unknown"}</span>: {replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? "…" : ""}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-slate-500 hover:text-slate-300"
                  onClick={() => setReplyTo(null)}
                  aria-label="Cancel reply"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file || !groupId || !currentUserId) return;
                  const supabase = createClient();
                  const bucket = "group-attachments";
                  const path = `${groupId}/${Date.now()}-${file.name}`;
                  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
                  if (error) {
                    toast.error("Upload failed. Ensure the group-attachments bucket exists in Supabase.");
                    return;
                  }
                  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
                  const url = urlData?.publicUrl ?? "";
                  if (!url) return;
                  const newMessage = {
                    group_id: groupId,
                    user_id: currentUserId,
                    user_name: (user?.fullName?.trim() ?? "") || "",
                    user_image: (user?.imageUrl?.trim() ?? "") || "",
                    content: url,
                  };
                  const { data, error: insertErr } = await supabase
                    .from("group_messages")
                    .insert(newMessage)
                    .select("id, group_id, user_id, user_name, user_image, content, created_at")
                    .single();
                  if (!insertErr && data) {
                    setMessages((prev) => [...prev, data as GroupMessage]);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-400 hover:text-slate-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={!groupId}
                aria-label="Attach image"
              >
                <Paperclip className="size-5" />
              </Button>
              <Input
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => sendTyping(true)}
                onBlur={() => sendTyping(false)}
                placeholder={groupId ? "Type a message..." : "Select a group to chat."}
                className="flex-1 border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
                disabled={sending || !groupId}
                type="text"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !input.trim() || !groupId}
                className="shrink-0"
              >
                <Send className="size-4" aria-hidden />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <GroupInfoDrawer
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        groupId={groupId}
        currentUserId={currentUserId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The message will show as &quot;This message was deleted&quot; for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
