import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,hsl(var(--primary)/0.08),transparent_50%)]"
        aria-hidden
      />

      <div className="relative w-full max-w-lg">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-8 text-center shadow-lg shadow-primary/5 backdrop-blur-sm sm:p-10">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Sparkles className="size-8 text-primary" aria-hidden />
          </div>

          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Welcome aboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Thank you
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Your subscription is active. You now have full access—jump into chat and connect with
            other travelers.
          </p>

          {sessionId ? (
            <p className="mt-6 break-all rounded-lg bg-muted/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              Session: {sessionId}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="size-4" aria-hidden />
              Go to Chat
            </Link>
            <Link
              href="/settings/billing"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
