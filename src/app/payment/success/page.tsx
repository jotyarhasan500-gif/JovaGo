import Link from "next/link";
import { CheckCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-card p-8 text-center shadow-sm">
        <CheckCircle
          className="mx-auto mb-4 size-12 text-emerald-600"
          aria-hidden
        />
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Payment successful</h1>
        <p className="mt-2 text-sm text-[#737373]">
          Thank you. Your Pro access will activate in a few moments once we confirm your payment.
        </p>
        {sessionId && (
          <p className="mt-4 font-mono text-xs text-muted-foreground break-all">
            Reference: {sessionId}
          </p>
        )}
        <Link
          href="/settings/billing"
          className="mt-8 inline-flex h-8 items-center justify-center rounded-lg bg-[#0066FF] px-2.5 text-sm font-medium text-white hover:bg-[#0052CC]"
        >
          Back to billing
        </Link>
      </div>
    </div>
  );
}
