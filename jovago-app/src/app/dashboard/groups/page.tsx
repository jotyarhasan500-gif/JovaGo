import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getGroupsByOwnerId } from "@/app/actions/groups";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/explore/group-card";
import { Plus } from "lucide-react";
import { JoinGroupForm } from "./join-group-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardGroupsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const groups = await getGroupsByOwnerId();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">My Groups</h1>
          <p className="mt-2 text-slate-400">
            Groups you own or belong to. Open a group to view chat and manage it.
          </p>
        </div>
        <Link href="/explore" className="shrink-0">
          <Button className="gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700">
            <Plus className="size-4" aria-hidden />
            Create New Group
          </Button>
        </Link>
      </div>

      <Card className="mt-6 border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100">Join a group</CardTitle>
          <CardDescription className="text-slate-400">
            Enter an invite code to join a group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm />
        </CardContent>
      </Card>

      <div className="mt-6">
        {groups.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">You haven&apos;t joined any groups yet. Create one or join with an invite code above.</p>
              <Link href="/explore" className="mt-4 inline-block">
                <Button className="gap-2 border-slate-700">
                  Create Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} isDashboardView={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
