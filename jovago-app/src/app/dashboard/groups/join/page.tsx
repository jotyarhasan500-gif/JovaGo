import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JoinGroupForm } from "../join-group-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function JoinGroupPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code.trim() : "";

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/groups"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to My Groups
      </Link>
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100">Join a group</CardTitle>
          <CardDescription className="text-slate-400">
            Enter the invite code to join a group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm initialCode={code} />
        </CardContent>
      </Card>
    </div>
  );
}
