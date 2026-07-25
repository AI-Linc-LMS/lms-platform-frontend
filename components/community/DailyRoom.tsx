"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, {
  type DailyCall,
  type DailyEventObject,
} from "@daily-co/daily-js";
import { Box, CircularProgress, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

// Translate Daily's internal error codes into actionable guidance. The two
// most common "why isn't my call connecting" cases (billing setup, exceeded
// plan limits) are invisible without a clear message.
const FRIENDLY_DAILY_ERRORS: Record<string, string> = {
  "account-missing-payment-method":
    "Daily needs a payment method on file before video rooms can connect. The free tier is still free - go to dashboard.daily.co/billing and add a card to activate.",
  "exp-room": "This room has expired. Create a new one.",
  "exp-token": "Your join token expired. Refresh the page and try again.",
  "not-allowed":
    "Camera or microphone access was blocked. Allow permissions in your browser and try again.",
  ejected: "You were removed from this room by a moderator.",
};

interface DailyRoomProps {
  /** Full Daily room URL (e.g. https://ailinc.daily.co/room-abc). */
  url: string;
  /** Per-user meeting token issued by our backend - carries moderator flag. */
  token?: string;
  /** Optional override for the in-call name. Falls back to token's user_name. */
  displayName?: string;
  /** When true, start with camera off; user can re-enable in-call. */
  audioOnly?: boolean;
  /** Fired once Daily reports the local participant joined. */
  onJoined?: () => void;
  /** Fired when the local participant leaves (hangup, kick, etc.). */
  onLeft?: () => void;
}

/**
 * Embeds a Daily.co video room via the iframe SDK. Drop-in replacement for the
 * old JitsiRoom - same React surface (mount in a container, dispose on unmount).
 *
 * Daily's pre-join screen handles mic/camera permission requests so we don't
 * need the safety timer dance we needed for Jitsi: their iframe is interactive
 * within ~200ms of mount and the `joined-meeting` event fires once the local
 * participant has finished the pre-join flow.
 */
export function DailyRoom({
  url,
  token,
  displayName,
  audioOnly = false,
  onJoined,
  onLeft,
}: DailyRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;
    let cancelled = false;
    let call: DailyCall | null = null;
    // True from the moment our React cleanup begins. Daily's call.destroy()
    // fires a `left-meeting` event *before* tearing down - without this flag
    // we'd bubble that event up to onLeft(), which sets inSession=false on
    // the parent, which re-triggers this cleanup in a loop.
    let teardownInitiatedByUs = false;
    setError(null);
    setLoading(true);

    // Why the deferred + async-aware init:
    //
    // Daily's iframe SDK is a global page singleton. React strict mode (default
    // in Next dev) intentionally double-mounts effects to expose stale state.
    // Sequence in strict mode:
    //   1. mount A → createFrame() succeeds
    //   2. cleanup A → destroy() returns a Promise; the SDK's singleton flag
    //      clears at the END of the async cleanup, not synchronously.
    //   3. mount B fires SYNCHRONOUSLY after cleanup A → createFrame() runs
    //      before destroy()'s promise resolves → throws
    //      "Duplicate DailyIframe instances are not allowed".
    //
    // Workaround: defer createFrame to the next microtask + await any
    // outstanding destroy. The 50ms timer is also a safety net - if the
    // strict-mode cycle is slower than expected, the cleanup fires inside
    // the timer window and never creates a duplicate.
    const setup = async () => {
      // Wait one tick - gives React's strict-mode cleanup time to run first.
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled || !containerRef.current) return;

      // Dispose any leftover global instance and AWAIT - destroy() is async.
      try {
        const existing = DailyIframe.getCallInstance();
        if (existing) await existing.destroy();
      } catch {
        /* no-op - older SDK versions don't expose getCallInstance */
      }
      if (cancelled) return;

      try {
        call = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          showLocalVideo: !audioOnly,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "12px",
          },
        });
        callRef.current = call;
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to initialise Daily");
        setLoading(false);
        return;
      }

      const handleLoaded = () => {
        if (!cancelled) setLoading(false);
      };
      const handleJoined = () => {
        if (!cancelled) {
          setLoading(false);
          onJoined?.();
        }
      };
      const handleLeft = () => {
        // Daily's call.destroy() fires `left-meeting` BEFORE tearing down.
        // The flag stops that synthetic event from bubbling up to onLeft()
        // (which would set inSession=false on the parent and re-trigger this
        // cleanup in a loop). Real leaves (user hangup, moderator kick) still
        // propagate.
        if (teardownInitiatedByUs) return;
        onLeft?.();
      };
      const handleError = (e: DailyEventObject) => {
        if (cancelled) return;
        const rawMsg =
          (e as { errorMsg?: string; error?: { msg?: string } }).errorMsg ??
          (e as { error?: { msg?: string } }).error?.msg ??
          "Video room error";
        setError(FRIENDLY_DAILY_ERRORS[rawMsg] ?? rawMsg);
        setLoading(false);
      };

      call.on("loaded", handleLoaded);
      call.on("joined-meeting", handleJoined);
      call.on("left-meeting", handleLeft);
      call.on("error", handleError);

      // Single source of truth: pass url+token+identity to join().
      try {
        await call.join({
          url,
          token: token || undefined,
          userName: displayName,
          startVideoOff: audioOnly,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not join the room");
          setLoading(false);
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      teardownInitiatedByUs = true;
      // call may be null if cleanup runs before async setup finished - that's
      // the normal strict-mode path and means there's nothing to tear down.
      if (call) {
        // destroy() is async but we don't await it in cleanup (React doesn't
        // allow async cleanups). The next effect's setup awaits any leftover
        // via getCallInstance().
        call.destroy().catch(() => {});
      }
      callRef.current = null;
    };
    // We deliberately re-mount on url/token change. Other props read live from
    // closure but Daily doesn't expose hot-updates for displayName/audioOnly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: "60vh", md: "calc(100vh - 220px)" },
        minHeight: 420,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#0f172a",
        border: "1px solid var(--border-default)",
      }}
    >
      <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />

      {loading && !error && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            backgroundColor: "rgba(15,23,42,0.92)",
            color: "#cbd5e1",
            pointerEvents: "none",
          }}
        >
          <CircularProgress sx={{ color: "#a78bfa" }} />
          <Typography variant="body2">Connecting to the room…</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, mt: 1 }}>
            If this stays, allow camera/microphone in your browser.
          </Typography>
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
            backgroundColor: "#0f172a",
            color: "#fca5a5",
            p: 3,
            textAlign: "center",
          }}
        >
          <IconWrapper icon="mdi:alert-circle-outline" size={40} color="#f87171" />
          <Typography variant="body1" fontWeight={600}>
            Couldn&apos;t connect to the room
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
