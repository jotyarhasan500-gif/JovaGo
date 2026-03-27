"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/chat-data";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  className?: string;
}

function MessageBubble({
  text,
  sender,
  sentAt,
  isRead,
  showSeen,
}: {
  text: string;
  sender: "me" | "them";
  sentAt: string;
  isRead?: boolean;
  showSeen: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full",
        sender === "me" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          sender === "me"
            ? "bg-[#0066FF] text-white rounded-br-md"
            : "bg-[#f0f0f0] text-[#0a0a0a] rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            sender === "me" ? "text-white/80" : "text-[#737373]"
          )}
        >
          {sentAt}
        </p>
        {showSeen && sender === "me" && isRead === true && (
          <p className="mt-0.5 text-[10px] text-white/60">Seen</p>
        )}
      </div>
    </div>
  );
}

export function ChatMessages({ messages, className }: ChatMessagesProps) {
  const list = Array.isArray(messages) ? messages : [];
  const lastFromMeIndex = (() => {
    let idx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].sender === "me") {
        idx = i;
        break;
      }
    }
    return idx;
  })();

  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      {list.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          text={msg.text}
          sender={msg.sender}
          sentAt={msg.sentAt}
          isRead={msg.isRead}
          showSeen={i === lastFromMeIndex}
        />
      ))}
    </div>
  );
}
