import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Checkout canceled</h1>
        <p className="mt-2 text-sm text-[#737373]">
          No charge was made. You can try again whenever you are ready.
        </p>
        <Link
          href="/settings/billing"
          className="mt-8 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Return to billing
        </Link>
      </div>
    </div>
  );
}
