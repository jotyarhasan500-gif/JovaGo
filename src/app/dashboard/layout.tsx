import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ensureProfileForCurrentUser } from "@/app/actions/profile";
import { DashboardSidebar, DashboardBottomNav } from "@/components/dashboard/dashboard-sidebar";
import { GroupMessageToasts } from "@/components/group-message-toasts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    console.log("Redirecting because...", "Dashboard layout: no userId");
    redirect("/sign-in");
  }
  await ensureProfileForCurrentUser();

  return (
    <div className="dark min-h-screen bg-slate-950">
      <GroupMessageToasts />
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="min-h-screen flex-1 pb-20 lg:pb-0 bg-slate-950">
          {children}
        </main>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
