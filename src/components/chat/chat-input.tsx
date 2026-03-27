"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onTyping,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [text, setText] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      onTyping?.();
    },
    [onTyping]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onTypingStop?.();
    onSend(trimmed);
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 gap-2 border-t border-border bg-card p-4"
    >
      <Input
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 border-[#0066FF]/20"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !text.trim()}
        className="shrink-0 bg-[#0066FF] text-white hover:bg-[#0052CC]"
      >
        <Send className="size-4" aria-label="Send message" />
      </Button>
    </form>
  );
}
