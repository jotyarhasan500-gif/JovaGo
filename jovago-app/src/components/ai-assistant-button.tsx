"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const JOVAAI_SYSTEM_PROMPT =
  "You are JovaAI, a travel safety expert. Help users find buddies based on their interests and give safety tips for their destinations.";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Mock response for demo when no API is configured. Replace with API call using JOVAAI_SYSTEM_PROMPT.
function getMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("safety") || lower.includes("safe")) {
    return "Always meet in public places first—cafés, landmarks, or busy areas. Share your plans with someone you trust and use our in-app chat until you're comfortable. Check the organizer's trust score and verified badge on their profile.";
  }
  if (lower.includes("buddy") || lower.includes("find") || lower.includes("friend")) {
    return "Use our Explore Trips page to filter by destination, budget, and travel style. Look for organizers with a high trust score and read their profile to match interests. You can message them before committing to a trip.";
  }
  if (lower.includes("destination") || lower.includes("place") || lower.includes("country")) {
    return "I can give safety tips for specific destinations. Tell me which country or city you're heading to, and I'll share practical advice—from local customs to areas to avoid and emergency contacts.";
  }
  return "I'm JovaAI, your travel safety expert. I can help you find travel buddies that match your interests and give you safety tips for your destination. What would you like to know?";
}

export function AIAssistantButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm JovaAI. I can help you find travel buddies and share safety tips for your destination. What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    const el = scrollRef.current.querySelector("[data-slot=scroll-area-viewport]");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate API delay; replace with real API call using JOVAAI_SYSTEM_PROMPT
    setTimeout(() => {
      const reply = getMockResponse(text);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", content: reply },
      ]);
      setIsLoading(false);
    }, 600);
  };

  const isMessagesPage = pathname === "/messages" || (pathname?.startsWith("/messages/") ?? false);
  if (isMessagesPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          suppressHydrationWarning
          className="flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/30 transition-colors hover:bg-[#0052CC] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0066FF]/50"
          aria-label="Open JovaAI travel assistant"
        >
          <Sparkles className="size-7" aria-hidden />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="flex h-[420px] w-[380px] flex-col overflow-hidden p-0"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-[#0066FF]/10 bg-[#0066FF]/5 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#0066FF] text-white">
              <Bot className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-[#0a0a0a]">JovaAI</p>
              <p className="text-xs text-[#737373]">Travel safety expert</p>
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3 p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-[#0066FF] text-white rounded-br-md"
                      : "bg-[#f0f0f0] text-[#0a0a0a] rounded-bl-md"
                  )}
                >
                  {m.content}
                </div>
              ))}
              {isLoading && (
                <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-[#f0f0f0] px-3 py-2 text-sm text-[#737373]">
                  Thinking...
                </div>
              )}
            </div>
          </ScrollArea>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex shrink-0 gap-2 border-t border-[#0066FF]/10 p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about safety or finding buddies..."
              disabled={isLoading}
              className="min-w-0 flex-1 border-[#0066FF]/20"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 bg-[#0066FF] text-white hover:bg-[#0052CC]"
            >
              <Send className="size-4" aria-label="Send" />
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
