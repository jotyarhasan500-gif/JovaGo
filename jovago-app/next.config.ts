import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use old Clerk key names when new ones are not set (CLERK_PUBLISHABLE_KEY → NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      process.env.CLERK_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
