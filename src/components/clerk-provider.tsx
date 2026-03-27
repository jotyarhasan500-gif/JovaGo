"use client";

import { ClerkProvider as Clerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const lightVariables = {
  colorPrimary: "#0066FF",
  colorBackground: "#fafafa",
  colorInputBackground: "#ffffff",
  colorInputText: "#18181b",
  colorText: "#18181b",
  colorTextSecondary: "#71717a",
  borderRadius: "0.625rem",
};

const darkVariables = {
  colorPrimary: "#0066FF",
  colorBackground: "#020617",
  colorInputBackground: "#0f172a",
  colorInputText: "#f4f4f5",
  colorText: "#f4f4f5",
  colorTextSecondary: "#94a3b8",
  borderRadius: "0.625rem",
};

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const appearance = useMemo(
    () => ({
      variables: resolvedTheme === "dark" ? darkVariables : lightVariables,
      elements: {
        rootBox: "w-full",
        card: "bg-background border-border shadow-xl",
        headerTitle: "text-foreground",
        headerSubtitle: "text-muted-foreground",
        socialButtonsBlockButton: "border-border bg-background hover:bg-muted",
        formFieldLabel: "text-foreground",
        formFieldInput: "bg-input/50 border-border text-foreground",
        footerActionLink: "text-primary hover:text-primary/90",
        identityPreviewEditButton: "text-primary",
        formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
        userButtonBox: "text-foreground",
        userButtonTrigger: "focus:shadow-none",
      },
    }),
    [resolvedTheme]
  );

  return (
    <Clerk
      appearance={appearance}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/"
    >
      {children}
    </Clerk>
  );
}
