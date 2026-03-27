import { SignIn } from "@clerk/nextjs";
import { sanitizePostSignInRedirect } from "@/lib/redirect-url";

type Props = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const forceRedirectUrl = sanitizePostSignInRedirect(params.redirect_url);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 py-8">
      <SignIn
        {...(forceRedirectUrl ? { forceRedirectUrl } : {})}
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-[400px]",
            card: "shadow-xl border border-border rounded-xl bg-background",
          },
        }}
      />
    </div>
  );
}
