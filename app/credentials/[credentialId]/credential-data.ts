import type { AdaptiveCredential } from "@/lib/types/adaptive-journey";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

/**
 * Server-side fetch of a public credential (used by generateMetadata + the OG
 * image route, which run on the server and can't use the browser axios client).
 * Returns null on any failure so callers render a graceful "not found".
 */
export async function fetchCredentialServer(
  credentialId: string,
): Promise<AdaptiveCredential | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(
      `${API_BASE}/adaptive-journey/api/credentials/${encodeURIComponent(credentialId)}/`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as AdaptiveCredential;
  } catch {
    return null;
  }
}
