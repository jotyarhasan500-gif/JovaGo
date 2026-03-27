import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Clerk v7+ uses `clerkMiddleware` instead of the removed `authMiddleware`.
 * These paths match the old `publicRoutes` option: no auth redirect / protect() here.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/success(.*)",
  "/api/stripe/webhook(.*)",
  "/api/stripe/checkout(.*)",
  "/api/stripe/prices(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
  "/trust",
  "/chat",
  "/owner(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(request)) {
    const pathname = request.nextUrl.pathname;
    try {
      await auth.protect();
    } catch (e) {
      console.log("Redirecting because...", "Middleware protect() threw for", pathname, e);
      throw e;
    }
    if (pathname.startsWith("/owner")) {
      const { userId } = await auth();
      if (userId) {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll() {
                // Read-only in middleware; role check happens in owner layout
              },
            },
          }
        );
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        const profile = data ? { role: data.role } : null;
        console.log("Current user role:", profile?.role ?? "none");
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
