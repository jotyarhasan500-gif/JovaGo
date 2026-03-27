import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/** Chat is protected by middleware; this layout only runs after middleware. If auth() is null here, log and send to sign-in (never to "/"). */
export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    console.log("Redirecting because...", "Chat layout: no userId (do not redirect to /)");
    redirect("/sign-in");
  }
  return <>{children}</>;
}
