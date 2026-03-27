import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardSavedTripsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[#1e293b]">Saved Trips</h1>
      <p className="mt-2 text-[#64748b]">
        Trips you&apos;ve saved for later.
      </p>
      <Link href="/explore" className="mt-4 inline-block">
        <Button variant="outline">Explore trips</Button>
      </Link>
    </div>
  );
}
