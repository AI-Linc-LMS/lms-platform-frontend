"use client";

import { useEffect } from "react";

/**
 * Self-heal tabs stranded by a deploy.
 *
 * Netlify deploys are atomic: the moment a new deploy publishes, the previous
 * deploy's hashed JS chunks stop being served. A tab that loaded before the
 * deploy keeps navigating with the OLD manifest, so its next lazy chunk or
 * route import 404s — hydration dies mid-boot and the page freezes on
 * whatever state it was painting (usually a loading screen). To the person it
 * reads as "the site is frozen / won't scroll", and it stays broken until
 * they think of a hard refresh themselves.
 *
 * This listens for the failure signature (chunk/module load errors) and
 * reloads the tab once, which fetches the current deploy. The sessionStorage
 * guard makes it reload at most once per 5 minutes per tab, so a genuinely
 * broken deploy can never cause a reload loop.
 */
const RELOAD_GUARD_KEY = "aw-stale-deploy-reload-at";
const RELOAD_MIN_INTERVAL_MS = 5 * 60_000;

const CHUNK_FAILURE = /ChunkLoadError|Loading chunk .+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

function reloadOnce(): void {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - last < RELOAD_MIN_INTERVAL_MS) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode): still reload, just unguarded.
  }
  window.location.reload();
}

export function StaleDeployRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (CHUNK_FAILURE.test(String(event?.message ?? ""))) reloadOnce();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason as { message?: unknown } | string | undefined;
      const msg =
        typeof reason === "string" ? reason : String(reason?.message ?? "");
      if (CHUNK_FAILURE.test(msg)) reloadOnce();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
