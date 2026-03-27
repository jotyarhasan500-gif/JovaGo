import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardMatchesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[#1e293b]">My Matches</h1>
      <p className="mt-2 text-[#64748b]">
        View and manage your travel buddy matches.
      </p>
      <Link href="/" className="mt-4 inline-block">
        <Button variant="outline">Discover travelers</Button>
      </Link>
    </div>
  );
}
