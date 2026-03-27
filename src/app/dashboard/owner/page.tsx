import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getGroupsByOwnerId } from "@/app/actions/groups";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Settings, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OwnerPanelIndexPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const groups = await getGroupsByOwnerId();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-semibold text-slate-100">Owner Panel</h1>
      <p className="mb-6 text-sm text-slate-400">
        Manage your trips. Only you can access the owner dashboard for each trip you created.
      </p>

      {groups.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/80">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="size-12 text-slate-600" aria-hidden />
            <p className="mt-4 text-sm font-medium text-slate-300">No trips created yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Create a group from Explore to see its Owner Panel here.
            </p>
            <Link
              href="/explore"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-6 inline-flex border-slate-600"
              )}
            >
              Explore trips
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/dashboard/groups/${g.id}/owner`}>
                <Card className="border-slate-800 bg-slate-900/80 transition-colors hover:border-cyan-500/30 hover:bg-slate-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                      <MapPin className="size-4 text-cyan-400" aria-hidden />
                      {g.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Trip dashboard · Manage members, details & route
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
