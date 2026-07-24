"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Branding & theme was replaced by admin Settings. Colours are now fixed
 * platform-wide (no per-client customization); only logo / favicon / login-page
 * text are editable, which live on /admin/settings. This route redirects there
 * so old links/bookmarks keep working and the retired colour editor is gone.
 */
export default function BrandingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/settings");
  }, [router]);
  return null;
}
