export interface Conversation {
  id: string;
  name: string;
  avatarInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  unread?: number;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "me" | "them";
  text: string;
  sentAt: string;
  /** Only real status from DB. true = read (blue), false = sent (gray). undefined = no DB value yet (no optimistic UI). */
  isRead?: boolean;
  /** ISO timestamp from DB; used for pagination (load older). */
  created_at?: string;
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Priya Sharma",
    avatarInitials: "PS",
    lastMessage: "Sounds good! Let's meet at the café near the temple.",
    lastMessageAt: "10:32",
    unread: 0,
  },
  {
    id: "2",
    name: "Alex Chen",
    avatarInitials: "AC",
    lastMessage: "I'll be at the airport around 2pm.",
    lastMessageAt: "Yesterday",
    unread: 2,
  },
  {
    id: "3",
    name: "Emma Wilson",
    avatarInitials: "EW",
    lastMessage: "That co-working space looks perfect.",
    lastMessageAt: "Mon",
  },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "1": [
    { id: "m1", conversationId: "1", sender: "them", text: "Hi! I saw you're heading to Phuket too. Would love to connect!", sentAt: "10:28", isRead: false },
    { id: "m2", conversationId: "1", sender: "me", text: "Hey Priya! Yes, would be great to have a buddy for the temples and beaches.", sentAt: "10:29", isRead: true },
    { id: "m3", conversationId: "1", sender: "them", text: "Sounds good! Let's meet at the café near the temple.", sentAt: "10:32", isRead: false },
  ],
  "2": [
    { id: "m4", conversationId: "2", sender: "them", text: "Tokyo trip is coming up. Still up for the ramen tour?", sentAt: "Yesterday", isRead: false },
    { id: "m5", conversationId: "2", sender: "me", text: "Absolutely! I'll be at the airport around 2pm.", sentAt: "Yesterday", isRead: false },
    { id: "m6", conversationId: "2", sender: "them", text: "I'll be there around 3. Let's sync at the arrival hall.", sentAt: "Yesterday", isRead: false },
  ],
  "3": [
    { id: "m7", conversationId: "3", sender: "me", text: "Found a great co-working spot in Canggu.", sentAt: "Mon", isRead: true },
    { id: "m8", conversationId: "3", sender: "them", text: "That co-working space looks perfect.", sentAt: "Mon", isRead: false },
  ],
};

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  return MOCK_MESSAGES[conversationId] ?? [];
}
