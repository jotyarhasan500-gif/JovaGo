/**
 * Safe return path after sign-in from `redirect_url` query (open-redirect hardening).
 */
export function sanitizePostSignInRedirect(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return undefined;
  }
  if (decoded.length > 2048) return undefined;
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return undefined;
  if (decoded.includes("\\") || decoded.includes("\0")) return undefined;
  return decoded;
}
