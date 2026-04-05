"use client";

import { useEffect, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { livekitService } from "@/lib/services/livekit.service";

export type LiveStreamStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

function getAssessmentStreamFromWindow(): MediaStream | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { __assessmentStream?: MediaStream };
  return w.__assessmentStream ?? null;
}

function findLiveVideoStream(): MediaStream | null {
  if (typeof document === "undefined") return null;
  const videos = document.querySelectorAll("video");
  for (const v of videos) {
    const src = v.srcObject;
    if (src instanceof MediaStream) {
      const vt = src.getVideoTracks()[0];
      if (vt && vt.readyState === "live") return src;
    }
  }
  return null;
}

export interface UseLiveProctoringPublisherOptions {
  assessmentId: number;
  /** When false, no LiveKit connection is attempted */
  enabled: boolean;
  /** When false (e.g. before start or during submit), disconnect */
  active: boolean;
}

/**
 * Publishes the existing assessment camera/mic stream to LiveKit for admin live proctoring.
 * Non-blocking: failures set status to `error` but do not block the assessment.
 */
export function useLiveProctoringPublisher(
  options: UseLiveProctoringPublisherOptions
): { status: LiveStreamStatus; errorMessage: string | null } {
  const { assessmentId, enabled, active } = options;
  const shouldPublish = enabled && active && assessmentId > 0;
  /** Connection phase while `shouldPublish` is true; ignored for UI when not publishing */
  const [phase, setPhase] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const status: LiveStreamStatus = shouldPublish ? phase : "idle";

  useEffect(() => {
    if (!shouldPublish) {
      return;
    }

    let cancelled = false;
    let room: Room | null = null;

    const run = async () => {
      setPhase("connecting");
      setErrorMessage(null);
      try {
        const creds = await livekitService.getToken({
          assessment_id: assessmentId,
          role: "publisher",
        });
        const serverUrl =
          (creds.livekit_url && creds.livekit_url.trim()) ||
          livekitService.getLivekitUrl();
        if (!serverUrl) {
          if (!cancelled) {
            setPhase("error");
            setErrorMessage("Live stream URL not configured");
          }
          return;
        }

        let mediaStream =
          getAssessmentStreamFromWindow() || findLiveVideoStream();
        if (!mediaStream) {
          await new Promise((r) => setTimeout(r, 1000));
          mediaStream =
            getAssessmentStreamFromWindow() || findLiveVideoStream();
        }
        if (!mediaStream || cancelled) {
          if (!cancelled) {
            setPhase("error");
            setErrorMessage("No camera stream available for live proctoring");
          }
          return;
        }

        const r = new Room();
        room = r;

        r.on(RoomEvent.Reconnecting, () => {
          if (!cancelled) setStatus("reconnecting");
        });
        r.on(RoomEvent.Reconnected, () => {
          if (!cancelled) setStatus("connected");
        });

        await r.connect(serverUrl, creds.token);
        if (cancelled) {
          await r.disconnect();
          return;
        }

        for (const t of mediaStream.getTracks()) {
          if (t.readyState !== "live") continue;
          if (t.kind === "video") {
            await r.localParticipant.publishTrack(t, {
              source: Track.Source.Camera,
            });
          } else if (t.kind === "audio") {
            await r.localParticipant.publishTrack(t, {
              source: Track.Source.Microphone,
            });
          }
        }

        if (!cancelled) setPhase("connected");
      } catch (e) {
        if (!cancelled) {
          setPhase("error");
          setErrorMessage(
            e instanceof Error ? e.message : "Live proctoring connection failed"
          );
          console.error("[live-proctoring] publisher", e);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (room) {
        void room.disconnect();
      }
    };
  }, [shouldPublish, assessmentId]);

  return { status, errorMessage };
}
