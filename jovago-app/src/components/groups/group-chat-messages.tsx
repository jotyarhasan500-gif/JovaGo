"use client";

import { memo, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupMessage } from "./group-chat";

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

const isImageUrl = (s: string): boolean => {
  const t = s.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return false;
  try {
    const u = new URL(t);
    const path = u.pathname.toLowerCase();
    return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(path) || path.includes("group-attachments");
  } catch {
    return false;
  }
};

const REACTION_EMOJIS = ["❤️", "👍", "😂"] as const;

const MessageBubble = memo(function MessageBubble({
  msg,
  showAvatar,
  showName,
  isMe,
  currentUserId,
  onReply,
  reactions,
  onReaction,
  onEdit,
  onDelete,
}: {
  msg: GroupMessage;
  showAvatar: boolean;
  showName: boolean;
  isMe: boolean;
  currentUserId: string | null;
  onReply?: (msg: GroupMessage) => void;
  reactions?: string[];
  onReaction?: (msgId: string, emoji: string) => void;
  onEdit?: (msg: GroupMessage) => void;
  onDelete?: (msg: GroupMessage) => void;
}) {
  const time = formatTime(msg.created_at);
  const contentIsImage = !msg.is_deleted && isImageUrl(msg.content);
  const showActions = isMe && !msg.is_deleted && (onEdit || onDelete);

  const displayName = msg.user_name?.trim() || "Unknown";
  const messageUserHref = `/messages?userId=${encodeURIComponent(msg.user_id)}`;

  if (msg.is_deleted) {
    return (
      <div className={cn("group/bubble flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
        {showAvatar ? (
          isMe ? (
            <Avatar className="size-8 shrink-0 border border-slate-700">
              <AvatarImage src={msg.user_image ?? undefined} alt="" />
              <AvatarFallback className="bg-slate-700 text-xs text-slate-200">
                {(msg.user_name?.trim() || msg.user_id).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <Link
                    {...props}
                    href={messageUserHref}
                    className={cn(
                      "block shrink-0 rounded-full ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      props.className
                    )}
                    aria-label={`Message ${displayName}`}
                  >
                    <Avatar className="size-8 border border-slate-700">
                      <AvatarImage src={msg.user_image ?? undefined} alt="" />
                      <AvatarFallback className="bg-slate-700 text-xs text-slate-200">
                        {(msg.user_name?.trim() || msg.user_id).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )}
              />
              <TooltipContent side="top">Message {displayName}</TooltipContent>
            </Tooltip>
          )
        ) : (
          <div className="size-8 shrink-0" aria-hidden />
        )}
        <div className={cn("flex max-w-[75%] flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
          <div className="rounded-lg px-3 py-2 text-sm italic text-slate-500 bg-slate-800/50 border border-slate-700/50">
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group/bubble flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
      {showAvatar ? (
        isMe ? (
          <Avatar className="size-8 shrink-0 border border-slate-700">
            <AvatarImage src={msg.user_image ?? undefined} alt="" />
            <AvatarFallback className="bg-slate-700 text-xs text-slate-200">
              {(msg.user_name?.trim() || msg.user_id).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={(props) => (
                <Link
                  {...props}
                  href={messageUserHref}
                  className={cn(
                    "block shrink-0 rounded-full ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    props.className
                  )}
                  aria-label={`Message ${displayName}`}
                >
                  <Avatar className="size-8 border border-slate-700">
                    <AvatarImage src={msg.user_image ?? undefined} alt="" />
                    <AvatarFallback className="bg-slate-700 text-xs text-slate-200">
                      {(msg.user_name?.trim() || msg.user_id).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}
            />
            <TooltipContent side="top">Message {displayName}</TooltipContent>
          </Tooltip>
        )
      ) : (
        <div className="size-8 shrink-0" aria-hidden />
      )}
      <div className={cn("flex max-w-[75%] flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
        {showName &&
          (isMe ? (
            <span className="text-xs font-medium text-slate-400">{displayName}</span>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <Link
                    {...props}
                    href={messageUserHref}
                    className={cn(
                      "text-xs font-medium text-slate-400 cursor-pointer hover:underline hover:text-slate-300",
                      props.className
                    )}
                    aria-label={`Message ${displayName}`}
                  >
                    {displayName}
                  </Link>
                )}
              />
              <TooltipContent side="top">Message {displayName}</TooltipContent>
            </Tooltip>
          ))}
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isMe ? "bg-[#0066FF] text-white" : "bg-slate-700 text-slate-100"
          )}
          title={time}
        >
          {contentIsImage ? (
            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded">
              <img src={msg.content} alt="Shared" className="max-h-64 max-w-full object-cover" />
            </a>
          ) : (
            <>
              {msg.content}
              {msg.is_edited && <span className="ml-1 text-xs opacity-80">(edited)</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-slate-500">{time}</span>
          {reactions && reactions.length > 0 && (
            <span className="rounded bg-slate-600/80 px-1.5 py-0.5 text-xs">
              {reactions.join(" ")}
            </span>
          )}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
            {showActions && (onEdit || onDelete) && (
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded p-1 text-slate-500 hover:bg-slate-600 hover:text-slate-300"
                    aria-label="Message actions"
                  >
                    <MoreVertical className="size-4" />
                  </div>
                </PopoverTrigger>
                <PopoverContent align={isMe ? "end" : "start"} className="w-40 p-1">
                  {onEdit && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                      onClick={() => onEdit(msg)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(msg)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  )}
                </PopoverContent>
              </Popover>
            )}
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(msg)}
                className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-600 hover:text-slate-300"
              >
                Reply
              </button>
            )}
            {onReaction && REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReaction(msg.id, emoji)}
                className="rounded p-0.5 text-sm hover:bg-slate-600"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

function MessageEditForm({
  msg,
  initialContent,
  onSave,
  onCancel,
  isMe,
}: {
  msg: GroupMessage;
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isMe: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  return (
    <div className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
      <div className="size-8 shrink-0" aria-hidden />
      <div className={cn("flex max-w-[75%] flex-col gap-2", isMe ? "items-end" : "items-start")}>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border-slate-600 bg-slate-800 text-slate-100"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSave(content.trim());
            }
          }}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-slate-200">
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(content.trim())} disabled={!content.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

type GroupChatMessagesProps = {
  messages: GroupMessage[];
  currentUserId: string | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onReply?: (msg: GroupMessage) => void;
  reactionsMap?: Record<string, string[]>;
  onReaction?: (msgId: string, emoji: string) => void;
  onEdit?: (msg: GroupMessage) => void;
  onDelete?: (msg: GroupMessage) => void;
  editingMessageId: string | null;
  editingContent: string;
  setEditingContent: (v: string) => void;
  onSaveEdit: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  className?: string;
};

export function GroupChatMessages({
  messages,
  currentUserId,
  scrollRef,
  onReply,
  reactionsMap,
  onReaction,
  onEdit,
  onDelete,
  editingMessageId,
  editingContent,
  setEditingContent,
  onSaveEdit,
  onCancelEdit,
  className,
}: GroupChatMessagesProps) {
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, scrollRef]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12",
          className
        )}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-slate-800 text-slate-500">
          <svg
            className="size-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-medium text-slate-300">No messages yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Send a message below to start the conversation.
          </p>
        </div>
      </div>
    );
  }

  let lastDateLabel = "";
  const rows: Array<{ type: "divider"; label: string } | { type: "message"; msg: GroupMessage }> = [];
  for (const m of messages) {
    const label = formatDateLabel(m.created_at);
    if (label !== lastDateLabel) {
      rows.push({ type: "divider", label });
      lastDateLabel = label;
    }
    rows.push({ type: "message", msg: m });
  }

  return (
    <ScrollArea className={cn("flex-1 min-h-0", className)}>
      <div className="flex flex-col gap-4 p-4">
        {rows.map((row, i) =>
          row.type === "divider" ? (
            <div key={`d-${row.label}-${i}`} className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-slate-700/50" />
              <span className="text-xs font-medium text-slate-500">{row.label}</span>
              <div className="flex-1 border-t border-slate-700/50" />
            </div>
          ) : (
            (() => {
              const msg = row.msg;
              const prevMsg = rows[i - 1]?.type === "message" ? (rows[i - 1] as { type: "message"; msg: GroupMessage }).msg : null;
              const sameUser = prevMsg && prevMsg.user_id === msg.user_id;
              const showAvatar = !sameUser;
              const showName = !sameUser;
              const isMe = msg.user_id === currentUserId;
              if (editingMessageId === msg.id) {
                return (
                  <MessageEditForm
                    key={msg.id}
                    msg={msg}
                    initialContent={editingContent}
                    onSave={(content) => onSaveEdit(msg.id, content)}
                    onCancel={onCancelEdit}
                    isMe={isMe}
                  />
                );
              }
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  showAvatar={showAvatar}
                  showName={showName}
                  isMe={isMe}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  reactions={reactionsMap?.[msg.id]}
                  onReaction={onReaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })()
          )
        )}
        <div ref={scrollRef} aria-hidden />
      </div>
    </ScrollArea>
  );
}
