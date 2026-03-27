"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatStore = {
  activeChatUserId: string | null;
  isChatOverlayOpen: boolean;
  openChat: (userId: string) => void;
  openChatOverlay: () => void;
  closeChatOverlay: () => void;
  unreadCount: number;
  incrementUnreadCount: () => void;
  clearUnreadCount: () => void;
  setUnreadCount: (n: number) => void;
};

const ChatContext = createContext<ChatStore | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((c) => c + 1);
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const openChat = useCallback((userId: string) => {
    setActiveChatUserId(userId);
    setIsChatOverlayOpen(true);
  }, []);

  const openChatOverlay = useCallback(() => {
    setIsChatOverlayOpen(true);
  }, []);

  const closeChatOverlay = useCallback(() => {
    setIsChatOverlayOpen(false);
  }, []);

  const value = useMemo<ChatStore>(
    () => ({
      activeChatUserId,
      isChatOverlayOpen,
      openChat,
      openChatOverlay,
      closeChatOverlay,
      unreadCount,
      incrementUnreadCount,
      clearUnreadCount,
      setUnreadCount,
    }),
    [
      activeChatUserId,
      isChatOverlayOpen,
      openChat,
      openChatOverlay,
      closeChatOverlay,
      unreadCount,
      incrementUnreadCount,
      clearUnreadCount,
      setUnreadCount,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStore(): ChatStore {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatStore must be used within ChatProvider");
  }
  return ctx;
}

export function useChatStoreOptional(): ChatStore | null {
  return useContext(ChatContext);
}
