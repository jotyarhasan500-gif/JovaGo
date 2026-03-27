import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@/components/clerk-provider";
import { AIAssistantButton } from "@/components/ai-assistant-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "@/lib/chat-store";
import { ChatOverlay } from "@/components/chat/chat-overlay";
import { DirectMessageToasts } from "@/components/chat/direct-message-toasts";
import { Header } from "@/components/header";
import { EnsureProfileSync } from "@/app/ensure-profile-sync";
import { NotificationSoundUnlock } from "@/components/notification-sound-unlock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JovaGo — Go Together, Travel Safer",
  description:
    "Explore the world with trusted friends. Find travel buddies, verify identities, and travel safer with JovaGo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider>
            <EnsureProfileSync />
            <NotificationSoundUnlock />
            <TooltipProvider>
              <ChatProvider>
                <DirectMessageToasts />
                <Header />
                {children}
                <ChatOverlay />
                <AIAssistantButton />
                <Toaster richColors position="top-center" />
              </ChatProvider>
            </TooltipProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
