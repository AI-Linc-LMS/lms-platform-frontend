"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { safeFrom, withFrom } from "@/lib/utils/return-to";
import { attachCameraStream } from "@/lib/utils/attachCameraStream";
import { useTranslation } from "react-i18next";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  assessmentService,
  type AssessmentDetail,
} from "@/lib/services/assessment.service";
import { isCurrentDeviceAllowedForAssessment } from "@/lib/utils/assessment-device";
import { canEnterFullscreen } from "@/lib/fullscreen/fullscreenSupport";
import { AssessmentDeviceStatusPanel } from "@/components/assessment/AssessmentDeviceStatusPanel";
import { useProctoring } from "@/lib/hooks/useProctoring";
import {
  pickAlternateCamera,
  watchPictureLiveness,
  watchVideoTrack,
  type Stoppable,
} from "@/lib/utils/cameraHealth";
import { resetFaceModelCache } from "@/lib/services/face-model-loader";
import { LoadingButton } from "@/components/common/LoadingButton";
import { StatusChip, type ChipTone } from "@/components/admin/assessment/shared";
import { stripHtmlTags } from "@/lib/utils/html-utils";

interface DeviceStatus {
  camera: boolean;
  microphone: boolean;
  browserSupported: boolean;
}

/** Maps a StatusChip tone to its token-backed foreground color (icon-tile tint + icon). */
const ROW_TONE_COLOR: Record<ChipTone, string> = {
  success: "var(--success-500)",
  warning: "var(--warning-500)",
  error: "var(--error-500)",
  info: "var(--accent-indigo)",
  neutral: "var(--font-secondary)",
  ai: "var(--ai-pink)",
  proctored: "var(--tone-proctored)",
};

/**
 * How long to wait for the camera/microphone grant before telling the student something.
 *
 * Not a verdict on the hardware: a prompt answered after this still completes the check. It is
 * only the point at which an unanswered prompt stops looking like progress. Fifteen seconds is
 * long enough to read a permission dialog and short enough that nobody concludes the page is
 * dead -- which is what happened when there was no bound at all.
 */
const DEVICE_REQUEST_TIMEOUT_MS = 15000;

const DEVICE_REQUEST_TIMEOUT_MESSAGE =
  "We are still waiting for permission to use your camera and microphone. Allow access in your " +
  "browser's prompt, and close any other app using the camera (Zoom, Teams, Meet), then try again.";

export default function DeviceCheckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = useTranslation("common");
  const { slug } = use(params);
  const router = useRouter();
  // Carried on to the player, and back to the detail page: the device check sits in the middle of
  // the chain, so dropping `from` here strands the learner at the end of it just the same.
  const returnTo = safeFrom(useSearchParams()?.get("from"));
  const [, setLoading] = useState(false); // Start with false - don't block initial render
  const [checking, setChecking] = useState(false);
  /**
   * True when the camera reported a LIVE track but no frame ever reached the preview.
   *
   * Advisory, never a gate: the hardware is present and permitted, so refusing entry would be
   * the detector-opinion mistake this page already learned once. What it changes is the words --
   * "Camera is working properly" over a black rectangle is the sentence that sends a student
   * looking for a fault they cannot find.
   */
  const [noCameraPicture, setNoCameraPicture] = useState(false);
  /** Which device check is current, so a late grant from an abandoned one is released. */
  const deviceAttemptRef = useRef(0);
  /** The track watcher and the picture-liveness loop for the CURRENT stream. */
  const trackWatchRef = useRef<Stoppable | null>(null);
  const livenessRef = useRef<Stoppable | null>(null);
  /** Camera device ids tried this visit, so "try another camera" never loops between two dead ones. */
  const triedCamerasRef = useRef<Set<string>>(new Set());
  const stopCameraWatchers = useCallback(() => {
    trackWatchRef.current?.stop();
    trackWatchRef.current = null;
    livenessRef.current?.stop();
    livenessRef.current = null;
  }, []);
  const mountedRef = useRef(true);
  const [deviceAccessDenied, setDeviceAccessDenied] = useState(false);
  const [deniedAssessment, setDeniedAssessment] =
    useState<AssessmentDetail | null>(null);
  // Loaded detail - used only for the header subtitle (title). Does not gate flow.
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: false,
    microphone: false,
    browserSupported: false,
  });
  /**
   * Whether this browser has a Fullscreen API at all. Read on the client only, so the first render
   * matches the server's. Used for COPY and for the readiness row; it never gates `canProceed`.
   */
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  useEffect(() => {
    setFullscreenSupported(canEnterFullscreen());
  }, []);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const [networkSpeed, setNetworkSpeed] = useState<number | null>(null);
    const [networkStatus, setNetworkStatus] = useState<
      "good" | "moderate" | "poor" | "testing" | null
    >(null);

  const [mobileAssessmentGate, setMobileAssessmentGate] = useState<
    "pending" | "ok"
  >("pending");

  // ✅ FACE VALIDATION STATE
  const [faceValidationPassed, setFaceValidationPassed] = useState(false);
  const [faceValidationMessage, setFaceValidationMessage] = useState<string>("");
  const [isRetryingFaceCheck, setIsRetryingFaceCheck] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isNavigatingToAssessmentRef = useRef(false);
  const [isNavigatingToAssessment, setIsNavigatingToAssessment] = useState(false);
  const hasAutoTestedRef = useRef(false);
  /**
   * The camera stream, held in STATE as well as in streamRef.
   *
   * streamRef alone cannot drive a re-render, and the <video> is not always mounted when the
   * stream arrives — this page returns a spinner while `mobileAssessmentGate === "pending"`,
   * which is resolved by a network call. So the element can appear *after* getUserMedia
   * resolves, and something has to notice and attach the stream then.
   */
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const faceDetectionStartedRef = useRef(false);
  const { showToast } = useToast();

  // Face detection proctoring - use its videoRef
  const {
    isActive: isFaceDetectionActive,
    isInitializing: isFaceDetectionInitializing,
    faceCount,
    status: faceStatus,
    latestViolation,
    // The camera check could not RUN, as opposed to running and not seeing a face. This was
    // returned by the hook all along and never read here, so every startProctoring() rejection -
    // a blocked model download, no usable GPU backend, a camera held by another app - rendered as
    // "No face detected. Please position yourself in front of the camera." That one omission is
    // why students filed hundreds of tickets swearing their camera was working. It was.
    error: faceCheckError,
    startProctoring: startFaceDetection,
    stopProctoring: stopFaceDetection,
    videoRef,
  } = useProctoring({
    autoStart: false,
    detectionInterval: 600,
    violationCooldown: 2000,
    minFaceSize: 20, // Strictly reject faces beyond 2-3 meters
    maxFaceSize: 75,
    lookingAwayThreshold: 0.3,
    // Permissive thresholds for the device-check screen: this is just verifying
    // "camera works and we can see a face" - not anti-cheat. On low-end devices
    // and grainy 640x480 webcams BlazeFace returns lower-confidence boxes and
    // noisier landmarks for real faces, which previously read as "No face".
    // The take/proctoring pages keep their own (stricter) thresholds.
    minConfidence: 0.2,
    smoothFrameCount: 3,
    poorLightingThreshold: 0.4,
    minConfidenceForValidFace: 0.5,
    minEyeSpreadRatio: 0.18,
    onViolation: (violation) => {
      // Once the user has committed to starting the assessment, freeze
      // validation state - stopping the detector for hand-off to the take
      // page produces transient "no face / violation" events that would
      // otherwise flash a misleading error during the countdown.
      if (isNavigatingToAssessmentRef.current) return;
      setFaceValidationPassed(false);
      setFaceValidationMessage(violation.message);
    },
    onStatusChange: () => {
      // Status change will trigger useEffect below to update validation
    },
    onFaceCountChange: (count) => {
      if (isNavigatingToAssessmentRef.current) return;
      if (count === 0) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(t("assessments.deviceCheck.noFaceDetected"));
      } else if (count > 1) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(t("assessments.deviceCheck.multipleFaces", { count }));
      }
      // For count === 1, useEffect below will check status
    },
  });

  // Update face validation status when faceCount or faceStatus changes
  useEffect(() => {
    if (isNavigatingToAssessmentRef.current) return;
    if (faceCount === 1 && faceStatus === "NORMAL" && !latestViolation) {
      setFaceValidationPassed(true);
      setFaceValidationMessage("Face detected and positioned correctly");
    } else {
      setFaceValidationPassed(false);
      // Update message based on current state
      if (faceCount === 0) {
        setFaceValidationMessage("No face detected. Please position yourself in front of the camera.");
      } else if (faceCount > 1) {
        setFaceValidationMessage(`${faceCount} faces detected. Only one person should be visible.`);
      } else if (latestViolation) {
        setFaceValidationMessage(latestViolation.message);
      } else if (faceStatus !== "NORMAL") {
        setFaceValidationMessage("Please adjust your position - look at the screen and maintain proper distance.");
      }
    }
  }, [faceCount, faceStatus, latestViolation]);

  // ✅ INTERNET SPEED TEST
  const testInternetSpeed = useCallback(async () => {
    setNetworkStatus("testing");

    const TEST_URL = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg";
    const ATTEMPTS = 2;
    const MAX_BYTES = 150 * 1024;
    const ATTEMPT_TIMEOUT_MS = 4000;
    const speeds: number[] = [];

    for (let i = 0; i < ATTEMPTS; i++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
      try {
        const start = performance.now();
        const res = await fetch(TEST_URL, {
          cache: "no-store",
          headers: { Range: `bytes=0-${MAX_BYTES - 1}` },
          signal: controller.signal,
        });

        // some servers may ignore Range - read what we get and measure length
        const buf = await res.arrayBuffer();
        const end = performance.now();
        const duration = (end - start) / 1000;
        if (duration > 0 && buf && buf.byteLength > 0) {
          const bits = buf.byteLength * 8;
          const mbps = bits / duration / (1024 * 1024);
          if (isFinite(mbps) && mbps > 0) speeds.push(mbps);
        }
      } catch (e) {
      } finally {
        clearTimeout(timeout);
      }
    }

    if (speeds.length === 0) {
      setNetworkStatus("poor");
      setNetworkSpeed(null);
      return;
    }

    speeds.sort((a, b) => a - b);
    const median = speeds[Math.floor(speeds.length / 2)];
    setNetworkSpeed(median);

    if (median > 5) setNetworkStatus("good");
    else if (median >= 1.0) setNetworkStatus("moderate");
    else setNetworkStatus("poor");
  }, []);


  /**
   * Attach the camera stream to the <video> and start face detection. Order-independent.
   *
   * The bug this replaces: the stream was attached inline inside `testDevices` behind a bare
   * `if (videoRef.current)`, with no retry. When getUserMedia resolved before the element
   * mounted, `srcObject` was never set and never set later — the camera stayed live (the
   * browser's green indicator on, because the tracks are held by streamRef) while the panel
   * rendered black forever. Face detection never started either, because its trigger lived
   * inside the same block, so the learner also could not pass the check.
   *
   * Whether that race is lost depends on how fast getUserMedia resolves against a network
   * fetch, which is why it hit only some people: a first-time user waits on the permission
   * prompt and the fetch wins, while a returning user whose browser already remembers the
   * grant resolves in milliseconds and loses. Edge persists permissions per site, so repeat
   * takers there are the most likely to see it.
   *
   * Safe to call repeatedly: re-attaching the same stream is a no-op, and face detection is
   * started once per stream.
   */
  const attachStreamToVideo = useCallback(
    (stream: MediaStream | null, hasVideo = true) => {
      attachCameraStream({
        el: videoRef.current,
        stream,
        hasVideo,
        onNoFrames: () => setNoCameraPicture(true),
        onReady: () => {
          setNoCameraPicture(false);
          // Frames are arriving now. Keep checking that they are a PICTURE: a shutter, antivirus
          // webcam protection or an idle virtual camera all deliver frames that are simply black,
          // which "frames arrived" cannot see and the face detector reports as "no face".
          livenessRef.current?.stop();
          if (videoRef.current) {
            livenessRef.current = watchPictureLiveness(videoRef.current, {
              onNoPicture: () => setNoCameraPicture(true),
              onPicture: () => setNoCameraPicture(false),
            });
          }
          if (faceDetectionStartedRef.current) return;
          faceDetectionStartedRef.current = true;
          setTimeout(() => {
            startFaceDetection().catch((err) => {
              console.error("Failed to start face detection:", err);
              setFaceValidationMessage("Face detection failed to initialize");
            });
          }, 500);
        },
      });
    },
    [startFaceDetection, videoRef]
  );

  /**
   * The other half of the race: the element mounting after the stream arrived. The callback
   * ref below covers the mount itself; this covers a stream that lands while the element is
   * already on screen, and re-attaches if anything detaches srcObject underneath us.
   */
  useEffect(() => {
    if (cameraStream) attachStreamToVideo(cameraStream);
  }, [cameraStream, attachStreamToVideo, mobileAssessmentGate, deviceAccessDenied]);

  /**
   * Take ownership of a granted stream: wire the preview, publish readiness, name any gap.
   *
   * Split out because there are now TWO ways a stream arrives -- promptly, and after the wait
   * below has already given up -- and the second must leave the page in exactly the state the
   * first does. Keeping one copy is what stops a late grant producing a half-configured check.
   */
  const adoptStream = useCallback(
    (stream: MediaStream) => {
      stopCameraWatchers();
      streamRef.current = stream;

      const videoTracks = stream.getVideoTracks();
      const hasVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";

      if (hasVideo) {
        const track = videoTracks[0];
        const id = track.getSettings?.().deviceId;
        if (id) triedCamerasRef.current.add(id);
        // A live track at grant time says nothing about a second later. Another application
        // taking the device MUTES the track; unplugging it ENDS it. Both leave the browser's
        // own "camera with a slash" in the preview, under a readiness row that would otherwise
        // go on saying "working properly".
        trackWatchRef.current = watchVideoTrack(track, {
          onMuted: () => setNoCameraPicture(true),
          onUnmuted: () => setNoCameraPicture(false),
          onEnded: () => setNoCameraPicture(true),
        });
      }
      const audioTracks = stream.getAudioTracks();
      const hasAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      // Hand the stream to the <video>. attachStreamToVideo is deliberately order-independent:
      // the element may not exist yet (see the comment on that function).
      setCameraStream(stream);
      attachStreamToVideo(stream, hasVideo);

      setDeviceStatus({
        camera: hasVideo,
        microphone: hasAudio,
        browserSupported: true,
      });

      // A late grant has to clear the message the timeout left behind, or the student reads an
      // error over a working camera.
      setCameraError(hasVideo ? null : "Camera is not accessible or not working properly");
      setMicError(hasAudio ? null : "Microphone is not accessible or not working properly");
      if (hasVideo) setNoCameraPicture(false);

      return { hasVideo, hasAudio, audioTracks };
    },
    [attachStreamToVideo, stopCameraWatchers]
  );

  // Test devices
  const testDevices = useCallback(async (opts?: { videoDeviceId?: string }) => {
    setChecking(true);
    setCameraError(null);
    setMicError(null);
    setNoCameraPicture(false);

    const attempt = ++deviceAttemptRef.current;
    // Release whatever we hold before asking again: a camera held by this page is exactly as
    // unavailable as one held by Zoom.
    stopCameraWatchers();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    try {
      /**
       * `getUserMedia` CAN HANG, and when it did the student was stranded.
       *
       * It does not always reject. A permission prompt that is never answered -- dismissed,
       * opened behind another window, or on a machine where the camera is held exclusively by
       * another application -- leaves the promise pending for ever. `setChecking(false)` lives in
       * the `finally` below, so the page sat on a disabled "Checking devices..." button with no
       * begin button beneath it (`canProceed` needs the camera), no error, and nothing to click.
       * That is the state in the report: the learner gave up on their laptop and sat the paper on
       * a phone instead.
       *
       * So the wait is bounded. Losing the race is not a verdict on the hardware: if the prompt
       * is answered late the stream is adopted below and the check simply completes, which is why
       * the original promise is kept rather than abandoned.
       */
      const request = navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          // A specific camera when retrying with another one; otherwise the front-facing default.
          ...(opts?.videoDeviceId
            ? { deviceId: { exact: opts.videoDeviceId } }
            : { facingMode: "user" }),
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const stream = await Promise.race([
        request,
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), DEVICE_REQUEST_TIMEOUT_MS)
        ),
      ]);

      if (stream === null) {
        // Still pending. Adopt it if it lands later and this is still the newest attempt;
        // otherwise release it, so a camera is never left running for a page that moved on.
        void request
          .then((late) => {
            if (attempt !== deviceAttemptRef.current || !mountedRef.current) {
              late.getTracks().forEach((t) => t.stop());
              return;
            }
            adoptStream(late);
          })
          .catch(() => undefined);
        setCameraError(DEVICE_REQUEST_TIMEOUT_MESSAGE);
        setMicError(DEVICE_REQUEST_TIMEOUT_MESSAGE);
        return;
      }

      const { hasVideo, hasAudio, audioTracks } = adoptStream(stream);

      // Test microphone levels (visual feedback)
      if (hasAudio && audioTracks.length > 0) {
        try {
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          // Monitor audio levels - throttled to reduce CPU usage
          let lastUpdate = 0;
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;

            const now = Date.now();
            // Only update every 100ms to reduce CPU usage
            if (now - lastUpdate < 100) {
              animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
              return;
            }
            lastUpdate = now;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(average / 100, 1); // Normalize to 0-1
            setAudioLevel(normalizedLevel);

            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };

          updateAudioLevel();
        } catch (error) {
          // Fail silently or handle appropriately
        }
      }

       testInternetSpeed();


      setLoading(false);
    } catch (error: any) {
      setLoading(false);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera/microphone access denied. Please allow access and try again."
        );
        setMicError(
          "Camera/microphone access denied. Please allow access and try again."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setCameraError(
          "No camera found. Please connect a camera and try again."
        );
        setMicError(
          "No microphone found. Please connect a microphone and try again."
        );
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setCameraError("Camera is already in use by another application.");
        setMicError("Microphone is already in use by another application.");
      } else {
        setCameraError(
          "Failed to access camera. Please check your device settings."
        );
        setMicError(
          "Failed to access microphone. Please check your device settings."
        );
      }
    } finally {
      setChecking(false);
    }
  }, [adoptStream, stopCameraWatchers, testInternetSpeed]);

  /**
   * The retry for a camera that is granted but shows nothing.
   *
   * First choice is a DIFFERENT camera, when the machine has one we have not tried: laptops with
   * a virtual camera installed (OBS, DroidCam, ManyCam) often default to it, and an idle virtual
   * camera is a live, empty track -- the student cannot discover that from the browser's prompt,
   * which never offered a choice. With no untried camera left, the same one is asked for again,
   * which is the right move after they close Zoom or open the shutter.
   */
  const retryCamera = useCallback(async () => {
    const other = await pickAlternateCamera(triedCamerasRef.current);
    await testDevices(other ? { videoDeviceId: other } : undefined);
  }, [testDevices]);

  /**
   * Actually re-attempt the failed step, rather than just re-rendering.
   *
   * `resetFaceModelCache()` is the part that matters. The loader memoises its in-flight promise so
   * concurrent callers share one download; without clearing it, a retry after a failure would
   * replay the SAME rejected promise and appear to do nothing. Stopping proctoring first releases
   * the camera so `testDevices` can reacquire it cleanly.
   */
  const retryFaceCheck = useCallback(async () => {
    setIsRetryingFaceCheck(true);
    setFaceValidationMessage("");
    try {
      resetFaceModelCache();
      stopFaceDetection();
      await testDevices();
    } finally {
      setIsRetryingFaceCheck(false);
    }
  }, [stopFaceDetection, testDevices]);

  // A late grant must not configure a page the student has already left, and the watchers must
  // not outlive it either.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCameraWatchers();
    };
  }, [stopCameraWatchers]);

  // Check browser support and auto-test devices on mount
  useEffect(() => {
    // Check if browser supports media devices
    const browserSupported = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );

    if (!browserSupported) {
      setDeviceStatus({
        camera: false,
        microphone: false,
        browserSupported: false,
      });
      return;
    }

    // Set browser as supported
    setDeviceStatus((prev) => ({
      ...prev,
      browserSupported: true,
    }));

    // Auto-test devices once on mount
    if (!hasAutoTestedRef.current) {
      hasAutoTestedRef.current = true;
      testDevices();
    }
  }, [testDevices]);

  // Cleanup on unmount - but only stop camera if NOT navigating to assessment
  useEffect(() => {
    return () => {
      // Always cleanup animation frame and audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Only stop camera if NOT navigating to the assessment page
      // This keeps camera on for assessment flow, but turns it off if navigating elsewhere
      if (!isNavigatingToAssessmentRef.current) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        faceDetectionStartedRef.current = false;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        // Clean up global stream reference if not navigating to assessment
        if (typeof window !== "undefined") {
          delete (window as any).__assessmentStream;
          delete (window as any).__assessmentVideoStream;
        }
      } else {
        // Navigating to assessment - ensure stream is preserved
        // Don't clear videoRef.srcObject - let take page reuse it
        // Stream is already stored globally in handleStartAssessment
      }

      analyserRef.current = null;
      setAudioLevel(0);
    };
  }, [stopFaceDetection]);

  // Load assessment details - simplified, don't block on it
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const data = await assessmentService.getAssessmentDetail(slug);
        setAssessment(data);

        if (!isCurrentDeviceAllowedForAssessment(data)) {
          setDeniedAssessment(data);
          setDeviceAccessDenied(true);
          return;
        }

        // Check if assessment is already submitted - block re-entry.
        // (`is_attempted` is true for in-progress too; only redirect when
        // actually submitted so resume-in-progress still works.)
        // EXCEPTION: if admin has granted an unconsumed retake, the
        // start-assessment endpoint will consume it and create a fresh
        // in-progress submission once the user reaches the take page, so we
        // let the device-check flow proceed.
        if (
          (data.status === "submitted" || data.status === "finalized") &&
          !data.can_reattempt
        ) {
          showToast("This assessment has already been submitted", "warning");
          // replace, not push: don't leave device-check in history so
          // back-navigation can't return here.
          router.replace(withFrom(`/assessments/${slug}`, returnTo));
          return;
        }

        // Redirect to take page if proctoring is disabled
        if (data.proctoring_enabled === false) {
          router.push(withFrom(`/assessments/${slug}/take`, returnTo));
          return;
        }
      } catch (error: any) {
        // Don't block on error, just show toast
        showToast("Failed to load assessment details", "error");
      } finally {
        setLoading(false);
        setMobileAssessmentGate("ok");
      }
    };

    if (slug) {
      loadAssessment();
    }
  }, [slug, router, showToast, t]);

  const handleStartAssessment = () => {
    if (!deviceStatus.camera || !deviceStatus.microphone) {
      showToast("Please complete all device checks", "error");
      return;
    }

    if (!faceValidationPassed) {
      showToast("Please position your face correctly before starting", "error");
      return;
    }

    const networkTooSlow = networkSpeed !== null && networkSpeed < 0.1;
    if (networkTooSlow) {
      showToast("Connection too slow (<100 kbps). Please switch network.", "error");
      return;
    }

    if (networkStatus === "poor") {
      showToast("Your connection is slow - you may start, but video may buffer.", "warning");
    }

    // Mark that we're navigating to assessment (so cleanup won't stop camera)
    isNavigatingToAssessmentRef.current = true;
    setIsNavigatingToAssessment(true);

    // Store the stream globally so take page can access it (prevents camera from turning off)
    if (streamRef.current) {
      (window as any).__assessmentStream = streamRef.current;
      // Also store on video element for proctoring service to find
      if (videoRef.current && videoRef.current.srcObject) {
        // Keep the stream attached to video element
        (window as any).__assessmentVideoStream = videoRef.current.srcObject;
      }
    }

    // Stop face detection only - keep camera/mic tracks live for the take page (same MediaStream as __assessmentStream)
    stopFaceDetection({ preserveMediaStream: true });
    // Likewise our own watchers: the exam owns the stream from here. The tracks stay live.
    stopCameraWatchers();

    // Navigate to take assessment page immediately
    router.push(withFrom(`/assessments/${slug}/take`, returnTo));
  };

  const networkAllowsProceed = !(networkSpeed !== null && networkSpeed < 0.1);

  const devicesAndBrowserReady =
    deviceStatus.camera &&
    deviceStatus.microphone &&
    deviceStatus.browserSupported;

  /**
   * The line here is between a DEVICE and a DETECTOR, and it is the whole fix.
   *
   * A proctored assessment genuinely requires a camera and a microphone: if the hardware is not
   * there and permitted, there is nothing to proctor, and that is a real precondition the
   * institution is entitled to enforce. So `deviceStatus.camera` and `deviceStatus.microphone`
   * remain gates when `proctoring_enabled` is on.
   *
   * What must NEVER gate entry is our detector's OPINION about that working camera. The gate used
   * to also require `faceValidationPassed && !faceCheckError` — our BlazeFace pipeline saying it
   * could presently see exactly one face. That is a wholly different claim from "a camera exists",
   * and it is the one that failed: weights fetched from a third-party CDN at exam time, a CPU
   * fallback that froze the tab, a detection loop that gave up silently, an error the page never
   * rendered. Each produced a student sitting in front of a working, permitted camera being told
   * "No face detected" with no way forward. 126 support tickets, ~38% of everything ever filed
   * (docs/audits/ticket-module-rca.md in ai-linc-backend).
   *
   * Fixing those causes made it rarer. Only removing the detector from the gate makes the OUTCOME
   * impossible — and the next unforeseen detector bug is then a degraded signal, not a cohort that
   * cannot sit its paper. Network speed comes out for the same reason: a slow link is a warning,
   * not grounds for refusal.
   *
   * So: hardware is required, judgement about the hardware is advisory. Violations are still
   * recorded against the attempt throughout; this changes who gets through the door, not what is
   * logged once they are.
   */
  const proctoringRequired = assessment?.proctoring_enabled !== false;

  const canProceed =
    deviceStatus.browserSupported &&
    (!proctoringRequired || (deviceStatus.camera && deviceStatus.microphone));

  /**
   * The advisory signals: things that are not right but must not stop the student.
   *
   * Deliberately excludes camera and microphone — for a proctored assessment those are real
   * preconditions and appear as blocking errors elsewhere on this page, with their own retry. What
   * lands here is our JUDGEMENT about a camera that is present and permitted, plus link speed.
   * Surfaced honestly so nobody discovers mid-exam that face monitoring was never running.
   */
  const degradedSignals: string[] = [];
  if (noCameraPicture) degradedSignals.push("no picture is reaching us from your camera");
  else if (faceCheckError) degradedSignals.push("the camera check could not run");
  else if (deviceStatus.camera && !faceValidationPassed)
    degradedSignals.push("we cannot see your face clearly");
  if (!networkAllowsProceed) degradedSignals.push("your connection is very slow");

  if (deviceAccessDenied && deniedAssessment) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, px: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <IconWrapper
                icon="mdi:cellphone-off"
                size={40}
                color="var(--ats-warning-muted)"
              />
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "var(--font-primary-dark)", mb: 1 }}
            >
              {t("assessmentDevice.deviceCheckBlockedTitle")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)", mb: 3, maxWidth: 480, mx: "auto" }}
            >
              {t("assessmentDevice.deviceCheckBlockedSubtitle")}
            </Typography>
            <Box sx={{ textAlign: "left", mb: 3 }}>
              <AssessmentDeviceStatusPanel
                assessment={deniedAssessment}
                sx={{ mb: 0 }}
              />
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
              onClick={() => router.push(withFrom(`/assessments/${slug}`, returnTo))}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {t("assessmentDevice.backToAssessment")}
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  // Don't show loading screen - render immediately for better UX

  if (mobileAssessmentGate === "pending") {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 360,
            py: 8,
          }}
        >
          <CircularProgress size={40} sx={{ color: "var(--accent-indigo)" }} />
        </Box>
      </MainLayout>
    );
  }

  // ---- Derived, render-only readiness descriptors (no flow gating) ----
  const cameraReady = deviceStatus.camera;
  const micReady = deviceStatus.microphone;

  const cameraTone: ChipTone = cameraReady ? "success" : "error";
  const micTone: ChipTone = micReady ? "success" : "error";
  const netTone: ChipTone =
    networkStatus === "testing" || networkStatus === null
      ? "neutral"
      : !networkAllowsProceed
      ? "error"
      : networkStatus === "poor"
      ? "warning"
      : "success";
  /**
   * The "Fullscreen support" row used to report `deviceStatus.browserSupported`, which is the
   * getUserMedia check - nothing to do with fullscreen. On an iPhone it therefore said "Ready /
   * Browser compatible" and the learner was then handed a fullscreen modal their browser cannot
   * satisfy. It now reports the real capability, and reports it as information rather than a
   * failure: this row has never gated entry and must not start.
   */
  const fsTone: ChipTone = !deviceStatus.browserSupported
    ? "error"
    : fullscreenSupported
    ? "success"
    : "neutral";

  const netSub =
    networkStatus === "testing"
      ? "Checking connection..."
      : networkSpeed !== null
      ? `${networkSpeed.toFixed(1)} Mbps - ${
          networkStatus === "good"
            ? "stable"
            : networkStatus === "moderate"
            ? "usable"
            : "slow"
        }`
      : "Connection check required";

  const netChip =
    netTone === "neutral"
      ? "Checking"
      : netTone === "success"
      ? "Ready"
      : netTone === "warning"
      ? "Slow"
      : "Too slow";

  const checklistRows: {
    key: string;
    icon: string;
    name: string;
    sub: string;
    tone: ChipTone;
    chip: string;
  }[] = [
    {
      key: "camera",
      icon: "mdi:camera-outline",
      name: "Camera",
      // "Working properly" is a claim about a PICTURE, and a live track is not one: a lens cover,
      // a privacy shutter or another app holding the device all leave the track live and every
      // frame black. Saying it anyway, over a black preview, sends the student hunting for a
      // fault they cannot find -- which is what the screenshot in the report shows.
      sub: cameraReady
        ? noCameraPicture
          ? "Camera is allowed, but no picture is reaching us. Close any other app using it."
          : "Camera is working properly"
        : cameraError || "Camera check required",
      tone: cameraReady && noCameraPicture ? "warning" : cameraTone,
      chip: cameraReady ? (noCameraPicture ? "No picture" : "Ready") : "Pending",
    },
    {
      key: "microphone",
      icon: "mdi:microphone-outline",
      name: "Microphone",
      sub: micReady
        ? "Microphone is working properly"
        : micError || "Microphone check required",
      tone: micTone,
      chip: micReady ? "Ready" : "Pending",
    },
    {
      key: "internet",
      icon: "mdi:wifi",
      name: "Internet connection",
      sub: netSub,
      tone: netTone,
      chip: netChip,
    },
    {
      key: "fullscreen",
      icon: "mdi:fullscreen",
      name: "Fullscreen support",
      sub: !deviceStatus.browserSupported
        ? "Browser not supported"
        : fullscreenSupported
        ? "Browser compatible"
        : "This browser has no fullscreen mode - your assessment runs without it",
      tone: fsTone,
      chip: !deviceStatus.browserSupported
        ? "Unsupported"
        : fullscreenSupported
        ? "Ready"
        : "Not available",
    },
  ];

  const assessmentTitle = stripHtmlTags(assessment?.title || "").trim();

  return (
    <MainLayout fullWidthContent>
      <Box
        sx={{
          backgroundColor: "var(--canvas)",
          minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
          width: "100%",
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          {/* Eyebrow + title + subtitle */}
          <Box
            sx={{
              textAlign: "center",
              mb: { xs: 3, md: 4 },
              maxWidth: 640,
              mx: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ai-pink)",
                mb: 1.25,
              }}
            >
              Before you begin
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 1.25,
                fontSize: { xs: "1.55rem", md: "2.05rem" },
                color: "var(--font-primary-dark)",
                lineHeight: 1.2,
              }}
            >
              Let&apos;s make sure everything works
            </Typography>
            <Typography
              sx={{
                color: "var(--font-secondary)",
                maxWidth: 540,
                mx: "auto",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              {assessmentTitle || "This assessment"} is proctored - a quick
              systems check keeps your attempt from being interrupted.
            </Typography>
          </Box>

          {!deviceStatus.browserSupported && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: "var(--radius-card)" }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Browser not supported
              </Typography>
              <Typography variant="body2">
                Your browser does not support camera/microphone access. Please
                use a modern browser like Chrome, Firefox, Safari, or Edge.
              </Typography>
            </Alert>
          )}

          {/* Two columns: camera preview + readiness checklist */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
              gap: { xs: 2.5, md: 3 },
              alignItems: "start",
            }}
          >
            {/* LEFT - camera preview */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <IconWrapper
                  icon="mdi:camera-outline"
                  size={18}
                  color="var(--font-secondary)"
                />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--font-primary-dark)",
                  }}
                >
                  Camera preview
                </Typography>
              </Box>

              <Box
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--assessment-video-letterbox-bg)",
                  aspectRatio: "16 / 10",
                }}
              >
                {!deviceStatus.camera && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        "color-mix(in srgb, var(--font-dark) 72%, transparent)",
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--font-light)" }}
                    >
                      Camera preview will appear here
                    </Typography>
                  </Box>
                )}

                {(isFaceDetectionInitializing || isNavigatingToAssessment) && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        "color-mix(in srgb, var(--font-dark) 86%, transparent)",
                      zIndex: 3,
                    }}
                  >
                    <CircularProgress
                      size={26}
                      sx={{ color: "var(--font-light)" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--font-light)" }}
                    >
                      {isNavigatingToAssessment
                        ? "Starting assessment..."
                        : "Initializing face detection..."}
                    </Typography>
                  </Box>
                )}

                <Box
                  component="video"
                  // A callback ref, not `ref={videoRef}`, so the stream is attached at the
                  // exact moment this element enters the DOM. The element can mount well
                  // after getUserMedia resolved (the page renders a spinner until the
                  // mobile gate clears), and an effect would not fire until after paint.
                  ref={(el: HTMLVideoElement | null) => {
                    videoRef.current = el;
                    if (el) attachStreamToVideo(streamRef.current);
                  }}
                  autoPlay
                  playsInline
                  muted
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                    backgroundColor: "var(--assessment-video-letterbox-bg)",
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(() => {
                        // Handle play error
                      });
                    }
                  }}
                />

                {faceValidationPassed && !isNavigatingToAssessment && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      zIndex: 2,
                      borderRadius: 999,
                      boxShadow:
                        "0 4px 14px -4px color-mix(in srgb, var(--font-dark) 55%, transparent)",
                    }}
                  >
                    <StatusChip
                      label="Face detected"
                      tone="success"
                      icon="mdi:check"
                    />
                  </Box>
                )}
              </Box>

              {/* The camera check could not run at all. Shown INSTEAD of the position-yourself
                  hint, because telling someone to move their face when we never managed to look
                  is the exact failure that sent hundreds of students to support. No bypass is
                  offered: this is a proctored, graded assessment, and letting someone through
                  with proctoring dead would be a worse bug than the one being fixed. */}
              {faceCheckError && !isNavigatingToAssessment && (
                <Box
                  sx={{
                    mt: 1.25,
                    display: "flex",
                    gap: 0.75,
                    alignItems: "flex-start",
                    color: "var(--error-500)",
                  }}
                >
                  <IconWrapper
                    icon="mdi:camera-off-outline"
                    size={16}
                    color="var(--error-500)"
                  />
                  <Box>
                    <Typography sx={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                      {faceCheckError}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        lineHeight: 1.5,
                        color: "var(--text-secondary)",
                        mt: 0.5,
                      }}
                    >
                      This is not a problem with your face or your position. If retrying does not
                      help, try a different browser or network, then contact support.
                    </Typography>
                    <LoadingButton
                      size="small"
                      variant="outlined"
                      loading={isRetryingFaceCheck}
                      onClick={retryFaceCheck}
                      sx={{ mt: 1 }}
                    >
                      Retry camera check
                    </LoadingButton>
                  </Box>
                </Box>
              )}

              {deviceStatus.camera &&
                !faceCheckError &&
                !isFaceDetectionInitializing &&
                !isNavigatingToAssessment &&
                !faceValidationPassed && (
                  <Box
                    sx={{
                      mt: 1.25,
                      display: "flex",
                      gap: 0.75,
                      alignItems: "flex-start",
                      color: "var(--warning-500)",
                    }}
                  >
                    <IconWrapper
                      icon="mdi:alert-circle-outline"
                      size={16}
                      color="var(--warning-500)"
                    />
                    <Typography sx={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                      {faceValidationMessage ||
                        "Position your face in the frame - look at the screen, one person only."}
                    </Typography>
                  </Box>
                )}

              {/* Mic level */}
              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.75,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--font-primary-dark)",
                    }}
                  >
                    Mic level
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: "var(--font-secondary)",
                    }}
                  >
                    {audioLevel > 0.1 ? "Sounds good" : "Speak to test your mic"}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={audioLevel * 100}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "var(--border-default)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "var(--success-500)",
                      borderRadius: 999,
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* RIGHT - readiness checklist */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "var(--font-primary-dark)",
                  mb: 2,
                }}
              >
                System readiness
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
              >
                {checklistRows.map((row) => {
                  const toneColor = ROW_TONE_COLOR[row.tone];
                  return (
                    <Box
                      key={row.key}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.25,
                        borderRadius: 12,
                        border: "1px solid var(--border-default)",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `color-mix(in srgb, ${toneColor} 14%, var(--surface) 86%)`,
                        }}
                      >
                        <IconWrapper
                          icon={row.icon}
                          size={20}
                          color={toneColor}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--font-primary-dark)",
                          }}
                        >
                          {row.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: "var(--font-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.sub}
                        </Typography>
                      </Box>
                      <StatusChip label={row.chip} tone={row.tone} />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>

          {/* Amber tip banner */}
          <Box
            sx={{
              mt: 3,
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
              p: 2,
              borderRadius: "var(--radius-card)",
              backgroundColor:
                "color-mix(in srgb, var(--warning-500) 10%, var(--card-bg))",
              border:
                "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
            }}
          >
            <IconWrapper
              icon="mdi:lightbulb-on-outline"
              size={20}
              color="var(--warning-500)"
            />
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "var(--font-primary-dark)",
                lineHeight: 1.6,
              }}
            >
              <Box component="span" sx={{ fontWeight: 700 }}>
                Tip:
              </Box>{" "}
              {fullscreenSupported
                ? "find a quiet, well-lit spot. Once you start, leaving fullscreen or switching tabs will be flagged and may pause your timer."
                : "find a quiet, well-lit spot. This browser has no fullscreen mode, so your assessment runs in the normal window - stay on this page, because leaving the app or switching tabs will be flagged and may pause your timer."}
            </Typography>
          </Box>

          {/* Actions */}
          <Box
            sx={{
              mt: 3,
              mx: "auto",
              maxWidth: 520,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              alignItems: "stretch",
            }}
          >
            {/* Advisory, never a barrier. The student is told what is degraded and then given the
                same button as everyone else. Before this, each of these conditions silently
                removed the button and left them with nothing to click. */}

            {/* The button FIRST, then what is degraded. On a 1366x768 laptop the warning pushed the
                only button below the fold, so a student reading "No face detected" above saw no
                way forward even though the page was not blocking them. */}
            {canProceed ? (
              <Button
                fullWidth
                size="large"
                onClick={handleStartAssessment}
                startIcon={
                  <IconWrapper
                    icon={fullscreenSupported ? "mdi:fullscreen" : "mdi:play"}
                    size={22}
                    color="var(--font-light)"
                  />
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  py: 1.5,
                  borderRadius: "var(--radius-card)",
                  background: "var(--gradient-ai)",
                  color: "var(--font-light)",
                  boxShadow:
                    "0 14px 30px -12px color-mix(in srgb, var(--ai-pink) 65%, transparent)",
                  "&:hover": {
                    background: "var(--gradient-ai)",
                    filter: "brightness(1.05)",
                  },
                }}
              >
                {fullscreenSupported
                  ? "Enter fullscreen & begin"
                  : "Begin assessment"}
              </Button>
            ) : (
              <>
                {devicesAndBrowserReady &&
                  faceValidationPassed &&
                  !networkAllowsProceed && (
                    <Alert
                      severity={networkStatus === "poor" ? "error" : "info"}
                      sx={{ borderRadius: "var(--radius-card)" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {networkStatus === "testing" || networkStatus === null
                          ? t("assessments.deviceCheck.networkWaitTest")
                          : t("assessments.deviceCheck.networkPoorCannotStart")}
                      </Typography>
                    </Alert>
                  )}

                {devicesAndBrowserReady &&
                  faceValidationPassed &&
                  !networkAllowsProceed && (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => void testInternetSpeed()}
                      disabled={networkStatus === "testing"}
                      startIcon={
                        networkStatus === "testing" ? (
                          <CircularProgress size={20} />
                        ) : (
                          <IconWrapper icon="mdi:wifi-refresh" size={22} />
                        )
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.4,
                        borderRadius: "var(--radius-card)",
                        borderColor: "var(--accent-indigo)",
                        color: "var(--accent-indigo-dark)",
                      }}
                    >
                      {t("assessments.deviceCheck.recheckInternet")}
                    </Button>
                  )}

                {(!deviceStatus.camera || !deviceStatus.microphone || noCameraPicture) && (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => void (noCameraPicture ? retryCamera() : testDevices())}
                    disabled={checking || !deviceStatus.browserSupported}
                    startIcon={
                      checking ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <IconWrapper
                          icon="mdi:camera-retake-outline"
                          size={22}
                        />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      py: 1.4,
                      borderRadius: "var(--radius-card)",
                      backgroundColor: "var(--accent-indigo)",
                      "&:hover": {
                        backgroundColor: "var(--accent-indigo-dark)",
                      },
                    }}
                  >
                    {checking
                      ? "Checking devices..."
                      : noCameraPicture
                        ? "Try the camera again"
                        : "Test camera & microphone"}
                  </Button>
                )}

              </>
            )}

            {canProceed && degradedSignals.length > 0 && (
              <Alert
                severity="warning"
                sx={{ borderRadius: "var(--radius-card)" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  You can still start your assessment
                </Typography>
                <Typography variant="body2">
                  {`We noticed ${degradedSignals.join(", and ")}. You do not need to fix this to begin — your assessment will not be blocked. If your institution requires camera monitoring, tell your supervisor before you start.`}
                </Typography>
              </Alert>
            )}

            <Button
              variant="text"
              onClick={() => router.push(withFrom(`/assessments/${slug}`, returnTo))}
              startIcon={
                <IconWrapper
                  icon="mdi:arrow-left"
                  size={18}
                  color="var(--font-secondary)"
                />
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "var(--font-secondary)",
                alignSelf: "center",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "var(--font-primary-dark)",
                },
              }}
            >
              Back to assessment
            </Button>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
