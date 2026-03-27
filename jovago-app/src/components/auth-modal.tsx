"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthMode = "login" | "signup";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial mode when opening (e.g. from "Sign In" vs "Join JovaGo") */
  initialMode?: AuthMode;
}

export function AuthModal({
  open,
  onOpenChange,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  // Sync mode when modal opens with initialMode
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrors({});
      setFullName("");
      setEmail("");
      setPassword("");
    }
  }, [open, initialMode]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (mode === "signup") {
      if (!fullName.trim()) next.fullName = "Full name is required";
      else if (fullName.trim().length < 2)
        next.fullName = "Name must be at least 2 characters";
    }
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_REGEX.test(email.trim()))
      next.email = "Please enter a valid email";
    if (!password) next.password = "Password is required";
    else if (mode === "signup" && password.length < 8)
      next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // TODO: integrate with Supabase auth
    console.log(mode === "login" ? "Login" : "Sign up", { email, password, fullName: mode === "signup" ? fullName : undefined });
    onOpenChange(false);
  };

  const handleSocial = (provider: "google" | "github") => {
    // TODO: Supabase OAuth
    console.log("Continue with", provider);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        backdropClassName="backdrop-blur-md bg-black/40"
        className={cn(
          "max-w-md border-border bg-background shadow-xl",
          "dark:border-white/10"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {mode === "login" ? "Sign in" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "login"
              ? "Enter your email and password to sign in."
              : "Join JovaGo to find travel buddies and plan trips."}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs: Login / Sign Up */}
        <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <label
                htmlFor="auth-fullname"
                className="text-sm font-medium text-foreground"
              >
                Full Name
              </label>
              <Input
                id="auth-fullname"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
                }}
                className={cn(errors.fullName && "border-destructive")}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="auth-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              className={cn(errors.email && "border-destructive")}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="auth-password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="auth-password"
              type="password"
              placeholder={mode === "login" ? "••••••••" : "At least 8 characters"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              className={cn(errors.password && "border-destructive")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Social login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">
              or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 border-border bg-background hover:bg-muted"
            onClick={() => handleSocial("google")}
          >
            <GoogleIcon className="size-4 shrink-0" />
            <span className="truncate">Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 border-border bg-background hover:bg-muted"
            onClick={() => handleSocial("github")}
          >
            <GitHubIcon className="size-4 shrink-0" />
            <span className="truncate">GitHub</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
