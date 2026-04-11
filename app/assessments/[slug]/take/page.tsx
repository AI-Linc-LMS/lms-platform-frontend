"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  use,
  lazy,
  Suspense,
  startTransition,
  memo,
} from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AssessmentFloatingTools } from "@/components/assessment/tools/AssessmentFloatingTools";
import { AssessmentToolbarTools } from "@/components/assessment/tools/AssessmentToolbarTools";
import { useToast } from "@/components/common/Toast";
import { useAssessmentProctoring } from "@/lib/hooks/useAssessmentProctoring";
import { useLiveProctoringPublisher } from "@/lib/hooks/useLiveProctoringPublisher";
import { useAssessmentData } from "@/lib/hooks/useAssessmentData";
import { useAssessmentTimer } from "@/lib/hooks/useAssessmentTimer";
import { useAssessmentNavigation } from "@/lib/hooks/useAssessmentNavigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { useAssessmentSubmission } from "@/lib/hooks/useAssessmentSubmission";
import { useFullscreenHandler } from "@/lib/hooks/useFullscreenHandler";
import { useAssessmentSecurity } from "@/lib/hooks/useAssessmentSecurity";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { AssessmentTimerBar } from "@/components/assessment/AssessmentTimerBar";
import { AssessmentNavigation } from "@/components/assessment/AssessmentNavigation";
import { StartAssessmentButton } from "@/components/assessment/StartAssessmentButton";
import { AssessmentQuizLayout } from "@/components/assessment/AssessmentQuizLayout";
import { AssessmentCodingLayout } from "@/components/assessment/AssessmentCodingLayout";
import { AssessmentSubjectiveLayout } from "@/components/assessment/AssessmentSubjectiveLayout";
import {
  mergeAssessmentSections,
  normalizeSubjectiveAnswer,
} from "@/utils/assessment.utils";
import {
  getResponseForQuestion,
  isAssessmentQuestionCompleted,
} from "@/lib/utils/assessmentQuestionCompletion";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";
import { getProctoringService } from "@/lib/services/proctoring.service";
import { config } from "@/lib/config";
import { uploadFile } from "@/lib/services/file-upload.service";
import type { ViolationScreenshotSample } from "@/lib/services/assessment.service";
import { captureViolationScreenshotFile } from "@/lib/utils/assessment-violation-screenshot.utils";

// Lazy load dialogs only
const SubmissionDialog = lazy(() =>
  import("@/components/assessment/SubmissionDialog").then((m) => ({
    default: m.SubmissionDialog,
  }))
);
const FullscreenWarningDialog = lazy(() =>
  import("@/components/assessment/FullscreenWarningDialog").then((m) => ({
    default: m.FullscreenWarningDialog,
  }))
);
const FullscreenExitConfirmDialog = lazy(() =>
  import("@/components/assessment/FullscreenExitConfirmDialog").then((m) => ({
    default: m.FullscreenExitConfirmDialog,
  }))
);

const MAX_VIOLATIONS = 100;
const MAX_VIOLATION_SCREENSHOT_EVIDENCE = 5;
const VIOLATION_SCREENSHOT_DEBOUNCE_MS = 400;

function getAssessmentWindowStream(): MediaStream | null {
  if (typeof window === "undefined") return null;
  const s = (window as unknown as { __assessmentStream?: unknown })
    .__assessmentStream;
  return s instanceof MediaStream ? s : null;
}

/** Resolves when the mounted proctoring video has a stream with live video + audio (or global stream does). */
async function waitForLiveCameraAndMicOnVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const el = videoRef.current;
    const stream =
      (el?.srcObject instanceof MediaStream ? el.srcObject : null) ??
      getAssessmentWindowStream();
    if (stream) {
      const vOk = stream
        .getVideoTracks()
        .some((t) => t.readyState === "live");
      const aOk = stream
        .getAudioTracks()
        .some((t) => t.readyState === "live");
      if (vOk && aOk) return true;
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  return false;
}

// Memoized question component to prevent unnecessary re-renders
const MemoizedQuizLayout = memo(AssessmentQuizLayout);
const MemoizedCodingLayout = memo(AssessmentCodingLayout);
const MemoizedSubjectiveLayout = memo(AssessmentSubjectiveLayout);

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  // State
  const [submitting, setSubmitting] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showFullscreenExitConfirm, setShowFullscreenExitConfirm] =
    useState(false);
  const [mediaInterrupted, setMediaInterrupted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [responses, setResponses] = useState<
    Record<string, Record<string, any>>
  >({});

  // Refs
  const timeUpCallbackRef = useRef<(() => void) | null>(null);
  const isProctoringActiveRef = useRef(false);
  const isInitializingRef = useRef(false);
  const hasCheckedSubmission = useRef(false);
  const hasLoadedResponses = useRef(false);
  const answerChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const violationScreenshotEvidenceRef = useRef<ViolationScreenshotSample[]>(
    []
  );
  const violationScreenshotLastCountRef = useRef(-1);
  const violationScreenshotDebounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const violationScreenshotUploadingRef = useRef(false);
  const totalViolationCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);
  const latestViolationTypeRef = useRef<string | null>(null);
  const lastTabSwitchCountAtScreenshotRef = useRef(-1);
  const handleFinalSubmitRef = useRef<() => void>(() => {});
  const mediaGraceUntilRef = useRef(0);

  // Data hooks
  const { assessment, loading } = useAssessmentData(slug);

  // Preload proctoring model in background (non-blocking)
  useEffect(() => {
    if (assessment && !loading) {
      // Use requestIdleCallback if available, otherwise setTimeout
      const schedulePreload = () => {
        import("@/lib/services/proctoring.service").then(
          ({ getProctoringService }) => {
            const service = getProctoringService();
            service.initializeModel().catch(() => {
              // Silently fail - will load on demand
            });
          }
        );
      };

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(schedulePreload, { timeout: 2000 });
      } else {
        setTimeout(schedulePreload, 1000);
      }
    }
  }, [assessment, loading]);

  // Timer setup - ALWAYS use remaining_time if available
  const initialTimeSeconds = useMemo(() => {
    if (assessment?.remaining_time !== undefined && assessment?.remaining_time !== null) {
      return assessment.remaining_time * 60; // Convert minutes to seconds
    }
    if (assessment?.duration_minutes) {
      return assessment.duration_minutes * 60;
    }
    return 3600;
  }, [assessment?.remaining_time, assessment?.duration_minutes]);

  const timer = useAssessmentTimer({
    initialTimeSeconds,
    autoStart: false,
    onTimeUp: () => {
      if (timeUpCallbackRef.current) {
        timeUpCallbackRef.current();
      }
    },
  });

  // Sections - memoized to prevent unnecessary recalculations
  // Calculate immediately but use startTransition for updates to prevent blocking
  const sections = useMemo(() => {
    if (!assessment) return [];
    const merged = mergeAssessmentSections(
      assessment.quizSection || [],
      assessment.codingProblemSection || [],
      assessment.subjectiveQuestionSection || []
    );
    // Debug: Log sections to help diagnose issues
    if (merged.length === 0) {
      console.warn("No sections found in assessment:", {
        quizSection: assessment.quizSection,
        codingProblemSection: assessment.codingProblemSection,
        subjectiveQuestionSection: assessment.subjectiveQuestionSection,
        assessment: assessment
      });
    }
    return merged;
  }, [assessment]);

  // Proctoring
  const handleViolationThresholdReached = useCallback(() => {
    // Handled by proctoring system
  }, []);

  // Track eye movement violations for warnings
  const eyeMovementCountRef = useRef(0);
  const lastEyeMovementWarningRef = useRef(0);

  const {
    isActive: isProctoringActive,
    isInitializing,
    faceCount,
    status,
    metadata,
    latestViolation,
    tabSwitchCount,
    totalViolationCount,
    startProctoring,
    stopProctoring,
    enterFullscreen,
    videoRef,
  } = useAssessmentProctoring({
    assessmentId: assessment?.id || 0,
    maxViolations: MAX_VIOLATIONS,
    onViolationThresholdReached: handleViolationThresholdReached,
    autoStart: false,
    tabSwitchDetectionEnabled:
      assessmentStarted && assessment?.proctoring_enabled !== false,
  });
  const { clientInfo } = useClientInfo();
  const liveProctoringEnabled = clientInfo?.live_proctoring_enabled === true;

  const { status: liveStreamStatus } = useLiveProctoringPublisher({
    assessmentId: assessment?.id ?? 0,
    enabled:
      liveProctoringEnabled &&
      Boolean(assessment?.id) &&
      assessment?.proctoring_enabled !== false,
    active: assessmentStarted && !submitting && assessment?.status !== "submitted",
  });

  totalViolationCountRef.current = totalViolationCount;
  tabSwitchCountRef.current = tabSwitchCount;
  latestViolationTypeRef.current = latestViolation?.type ?? null;

  // Baseline violation count when the assessment session starts (ignore pre-start noise)
  useEffect(() => {
    if (!assessmentStarted) {
      violationScreenshotLastCountRef.current = -1;
      lastTabSwitchCountAtScreenshotRef.current = -1;
      return;
    }
    if (violationScreenshotLastCountRef.current === -1) {
      violationScreenshotLastCountRef.current = totalViolationCount;
      lastTabSwitchCountAtScreenshotRef.current = tabSwitchCount;
    }
  }, [assessmentStarted, totalViolationCount, tabSwitchCount]);

  // On proctoring violation increases: debounced full-page screenshot → S3 (assessment_screenshots)
  useEffect(() => {
    if (!assessmentStarted || submitting) return;
    if (violationScreenshotLastCountRef.current < 0) return;
    if (
      violationScreenshotEvidenceRef.current.length >=
      MAX_VIOLATION_SCREENSHOT_EVIDENCE
    ) {
      return;
    }
    if (totalViolationCount <= violationScreenshotLastCountRef.current) return;

    if (violationScreenshotDebounceRef.current) {
      clearTimeout(violationScreenshotDebounceRef.current);
    }

    violationScreenshotDebounceRef.current = setTimeout(() => {
      violationScreenshotDebounceRef.current = null;
      const countAtFire = totalViolationCountRef.current;
      if (countAtFire <= violationScreenshotLastCountRef.current) return;
      violationScreenshotLastCountRef.current = countAtFire;

      void (async () => {
        if (violationScreenshotUploadingRef.current) return;
        if (
          violationScreenshotEvidenceRef.current.length >=
          MAX_VIOLATION_SCREENSHOT_EVIDENCE
        ) {
          return;
        }

        violationScreenshotUploadingRef.current = true;
        try {
          const file = await captureViolationScreenshotFile();
          if (!file) return;

          const result = await uploadFile(
            Number(config.clientId),
            file,
            "assessment_screenshots"
          );

          if (
            violationScreenshotEvidenceRef.current.length >=
            MAX_VIOLATION_SCREENSHOT_EVIDENCE
          ) {
            return;
          }

          const tabNow = tabSwitchCountRef.current;
          const hadTabSwitch =
            lastTabSwitchCountAtScreenshotRef.current >= 0 &&
            tabNow > lastTabSwitchCountAtScreenshotRef.current;
          lastTabSwitchCountAtScreenshotRef.current = tabNow;

          violationScreenshotEvidenceRef.current.push({
            id: result.id,
            file_id: result.id,
            url: result.url,
            screenshot_url: result.url,
            filename: result.filename,
            module: result.module,
            created_at: result.created_at,
            captured_at: result.created_at,
            total_violation_count_at_capture: countAtFire,
            latest_violation_type: hadTabSwitch
              ? "TAB_SWITCH"
              : latestViolationTypeRef.current,
            tab_switch_count_at_capture: tabNow,
          });
        } catch (err) {
          console.error(
            "[assessment] Violation screenshot upload failed:",
            err
          );
        } finally {
          violationScreenshotUploadingRef.current = false;
        }
      })();
    }, VIOLATION_SCREENSHOT_DEBOUNCE_MS);

    return () => {
      if (violationScreenshotDebounceRef.current) {
        clearTimeout(violationScreenshotDebounceRef.current);
        violationScreenshotDebounceRef.current = null;
      }
    };
  }, [totalViolationCount, assessmentStarted, submitting]);

  // Track last violation timestamp per type to avoid duplicate toasts
  const lastViolationToastRef = useRef<Map<string, number>>(new Map());
  const prevTabSwitchCountRef = useRef(0);
  const lastTabSwitchToastRef = useRef(0);
  const TAB_SWITCH_TOAST_COOLDOWN_MS = 4000;

  // Show toast when tab switch is detected (user left and returned to the assessment tab)
  useEffect(() => {
    if (!assessmentStarted || submitting) return;
    if (tabSwitchCount <= prevTabSwitchCountRef.current) return;
    prevTabSwitchCountRef.current = tabSwitchCount;
    const now = Date.now();
    if (now - lastTabSwitchToastRef.current < TAB_SWITCH_TOAST_COOLDOWN_MS) return;
    lastTabSwitchToastRef.current = now;
    showToast(
      "Tab switch detected. Please stay on the assessment tab for the duration of the test.",
      "warning"
    );
  }, [tabSwitchCount, assessmentStarted, submitting, showToast]);

  // Show toast notifications for proctoring violations
  useEffect(() => {
    if (!assessmentStarted || submitting || !latestViolation) return;

    // Skip NORMAL status violations
    if (latestViolation.type === "NORMAL") return;
    // TRACKPAD_SWIPE toast is shown from useTrackpadSwipeDetector to avoid duplicate
    if (latestViolation.type === "TRACKPAD_SWIPE") return;

    const now = Date.now();
    const violationType = latestViolation.type;
    const lastToastTime = lastViolationToastRef.current.get(violationType) || 0;

    // Map violation types to user-friendly messages and toast types
    const violationMessages: Record<string, { message: string; toastType: "warning" | "error" | "info"; cooldown: number }> = {
      LOOKING_AWAY: {
        message: "Please look at the screen",
        toastType: "warning",
        cooldown: 3000,
      },
      NO_FACE: {
        message: "Face not detected. Please position yourself in front of the camera",
        toastType: "error",
        cooldown: 4000,
      },
      MULTIPLE_FACES: {
        message: "Multiple faces detected. Please ensure only you are visible",
        toastType: "warning",
        cooldown: 4000,
      },
      FACE_NOT_VISIBLE: {
        message: "Face not clearly visible. Please remove any obstructions (mask, hand, etc.)",
        toastType: "error",
        cooldown: 4000,
      },
      FACE_TOO_CLOSE: {
        message: "Please move back from the camera",
        toastType: "warning",
        cooldown: 3000,
      },
      FACE_TOO_FAR: {
        message: "Please move closer to the camera (within 2-3 meters)",
        toastType: "warning",
        cooldown: 3000,
      },
      POOR_LIGHTING: {
        message: "Poor lighting detected. Please improve lighting conditions",
        toastType: "warning",
        cooldown: 5000,
      },
    };

    const violationConfig = violationMessages[violationType];
    
    if (violationConfig) {
      // Check cooldown for this specific violation type
      const timeSinceLastToast = now - lastToastTime;
      if (timeSinceLastToast < violationConfig.cooldown) {
        return; // Still in cooldown period
      }
      
      // Update last toast time for this violation type
      lastViolationToastRef.current.set(violationType, now);
      
      // Show toast with violation message
      showToast(violationConfig.message, violationConfig.toastType);
    } else if (latestViolation.message) {
      // Fallback to violation's own message if no custom message defined
      const defaultCooldown = 3000;
      const timeSinceLastToast = now - lastToastTime;
      
      if (timeSinceLastToast < defaultCooldown) {
        return; // Still in cooldown period
      }
      
      const toastType = latestViolation.severity === "high" ? "error" : 
                       latestViolation.severity === "medium" ? "warning" : "info";
      lastViolationToastRef.current.set(violationType, now);
      showToast(latestViolation.message, toastType);
    }
  }, [latestViolation, assessmentStarted, submitting, showToast]);

  // Show warning when eye movement violations occur (kept for backward compatibility)
  useEffect(() => {
    const eyeMovementCount = metadata.proctoring.eye_movement_count || 0;
    
    if (eyeMovementCount > eyeMovementCountRef.current) {
      eyeMovementCountRef.current = eyeMovementCount;
      
      // Show warning every 3 violations to avoid spam
      const now = Date.now();
      if (now - lastEyeMovementWarningRef.current > 5000) { // 5 second cooldown
        lastEyeMovementWarningRef.current = now;
        // Note: Eye movement toasts are now handled by latestViolation effect above
      }
    }
  }, [metadata.proctoring.eye_movement_count]);

  // Navigation
  const navigation = useAssessmentNavigation({
    currentSectionIndex,
    currentQuestionIndex,
    sections,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
  });

  // Security measures - disable beforeunload during submission
  useAssessmentSecurity({ enabled: assessmentStarted, submitting });
  useKeyboardShortcuts({ enabled: assessmentStarted });

  // Check if already submitted
  useEffect(() => {
    if (assessment && !hasCheckedSubmission.current) {
      hasCheckedSubmission.current = true;
      if (assessment.status === "submitted") {
        showToast("This assessment has already been submitted", "warning");
        router.push(`/assessments/${slug}`);
      }
    }
  }, [assessment, slug, router, showToast]);

  // Proctored attempts: if no usable stream, try to acquire one. Only redirect as last resort.
  useEffect(() => {
    if (!assessment || loading) return;
    if (assessment.status === "submitted") return;
    if (assessment.proctoring_enabled === false) return;

    const stream = getAssessmentWindowStream();
    const hasLiveVideo =
      stream?.getVideoTracks().some((t) => t.readyState === "live") ?? false;
    const hasLiveAudio =
      stream?.getAudioTracks().some((t) => t.readyState === "live") ?? false;

    if (hasLiveVideo && hasLiveAudio) return;

    // Attempt to get a fresh stream before falling back to device-check
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((freshStream) => {
        if (typeof window !== "undefined") {
          (window as any).__assessmentStream = freshStream;
        }
      })
      .catch(() => {
        router.replace(`/assessments/${slug}/device-check`);
      });
  }, [assessment, loading, slug, router]);

  // Load saved responses from responseSheet - ASYNC and DEFERRED to prevent freeze
  useEffect(() => {
    if (assessment && sections.length > 0 && !hasLoadedResponses.current) {
      hasLoadedResponses.current = true;

      // Initialize empty structure immediately (non-blocking)
      const initialResponses: Record<string, Record<string, any>> = {};
      sections.forEach((section: any) => {
        const sectionType = section.section_type || "quiz";
        if (!initialResponses[sectionType]) {
          initialResponses[sectionType] = {};
        }
      });
      setResponses(initialResponses);

      // Set initial section and question immediately - use first section by order
      if (sections.length > 0) {
        setCurrentSectionIndex(0);
        setCurrentQuestionIndex(0);
      }

      // Parse responseSheet asynchronously after initial render (deferred with longer delay)
      if (assessment.responseSheet) {
        // Use requestIdleCallback or setTimeout to defer heavy parsing - longer delay to prevent freeze
        const parseResponseSheet = () => {
          try {
            const responseSheet = assessment.responseSheet;
            const loadedResponses: Record<string, Record<string, any>> = {};

            // Process quizSectionId array - structure: quizSectionId[0]["75"]["84205"] = "a"
            if (responseSheet.quizSectionId && Array.isArray(responseSheet.quizSectionId)) {
              if (!loadedResponses["quiz"]) {
                loadedResponses["quiz"] = {};
              }

              responseSheet.quizSectionId.forEach((sectionData: any) => {
                // sectionData is like: { "75": { "84205": "a", "84206": "a", ... } }
                Object.keys(sectionData).forEach((sectionIdKey) => {
                  const questionResponses = sectionData[sectionIdKey];
                  
                  // Map each question response - bind ALL responses including null
                  Object.keys(questionResponses).forEach((questionIdKey) => {
                    const response = questionResponses[questionIdKey];
                    const questionId = Number(questionIdKey);
                    
                    // Bind ALL responses including null (null means question was cleared/unanswered)
                    // Store with multiple ID formats for compatibility
                    if (response !== undefined) {
                      loadedResponses["quiz"][questionId] = response;
                      loadedResponses["quiz"][String(questionId)] = response;
                    }
                  });
                });
              });
            }

            // Process codingProblemSectionId array - similar structure
            if (responseSheet.codingProblemSectionId && Array.isArray(responseSheet.codingProblemSectionId)) {
              if (!loadedResponses["coding"]) {
                loadedResponses["coding"] = {};
              }

              responseSheet.codingProblemSectionId.forEach((sectionData: any) => {
                Object.keys(sectionData).forEach((sectionIdKey) => {
                  const questionResponses = sectionData[sectionIdKey];
                  
                  Object.keys(questionResponses).forEach((questionIdKey) => {
                    const response = questionResponses[questionIdKey];
                    const questionId = Number(questionIdKey);
                    
                    if (response !== undefined) {
                      loadedResponses["coding"][questionId] = response;
                      loadedResponses["coding"][String(questionId)] = response;
                    }
                  });
                });
              });
            }

            if (responseSheet.subjectiveQuestionSectionId && Array.isArray(responseSheet.subjectiveQuestionSectionId)) {
              if (!loadedResponses["subjective"]) {
                loadedResponses["subjective"] = {};
              }

              responseSheet.subjectiveQuestionSectionId.forEach((sectionData: any) => {
                Object.keys(sectionData).forEach((sectionIdKey) => {
                  const questionResponses = sectionData[sectionIdKey];
                  Object.keys(questionResponses).forEach((questionIdKey) => {
                    const response = questionResponses[questionIdKey];
                    const questionId = Number(questionIdKey);
                    if (response !== undefined) {
                      const text = normalizeSubjectiveAnswer(response);
                      loadedResponses["subjective"][questionId] = text;
                      loadedResponses["subjective"][String(questionId)] = text;
                    }
                  });
                });
              });
            }

            // Merge into existing section buckets so a partial response_sheet never wipes other section types
            if (Object.keys(loadedResponses).length > 0) {
              startTransition(() => {
                setResponses((prev) => {
                  const next = { ...prev };
                  if (loadedResponses.quiz) {
                    next.quiz = { ...(prev.quiz || {}), ...loadedResponses.quiz };
                  }
                  if (loadedResponses.coding) {
                    next.coding = { ...(prev.coding || {}), ...loadedResponses.coding };
                  }
                  if (loadedResponses.subjective) {
                    next.subjective = {
                      ...(prev.subjective || {}),
                      ...loadedResponses.subjective,
                    };
                  }
                  return next;
                });
              });
            }
          } catch (error) {
            console.error("Error parsing responseSheet:", error);
            // Silently fail - already initialized empty structure
          }
        };

        // Defer parsing with much longer delay to prevent blocking UI and camera
        // Parse after camera has initialized and UI is interactive (3+ seconds)
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(parseResponseSheet, { timeout: 8000 });
        } else {
          setTimeout(parseResponseSheet, 3000);
        }
      }
    }
  }, [assessment, sections]);

  // Auto-save
  useAutoSave({
    enabled: assessmentStarted && !submitting,
    slug,
    responses,
    sections,
    metadata,
  });

  // Track proctoring state
  useEffect(() => {
    isProctoringActiveRef.current = isProctoringActive;
  }, [isProctoringActive]);

  // Stop camera immediately when submission starts
  useEffect(() => {
    if (submitting) {
      // Stop camera as soon as submission starts
      try {
        stopProctoring();
        try {
          const proctoringService = getProctoringService();
          if (proctoringService) {
            proctoringService.stopProctoring();
          }
        } catch (error) {
          // Continue
        }
        stopAllMediaTracks();
        document.querySelectorAll("video, audio").forEach((element) => {
          const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
          if (mediaElement.srcObject) {
            (mediaElement.srcObject as MediaStream).getTracks().forEach((track) => {
              track.stop();
            });
            mediaElement.srcObject = null;
          }
        });
      } catch (error) {
        // Silently fail
      }
    }
  }, [submitting, stopProctoring]);

  const openFullscreenExitPrompt = useCallback(() => {
    setShowFullscreenExitConfirm(true);
  }, []);

  // Prompt submit vs continue when user leaves fullscreen (must run before submission hook)
  const {
    showFullscreenWarning,
    setShowFullscreenWarning,
    handleReEnterFullscreen,
    isDocumentFullscreen,
  } = useFullscreenHandler({
    enabled: assessmentStarted,
    submitting,
    enterFullscreen,
    promptOnFullscreenExit: true,
    onLeftFullscreen: openFullscreenExitPrompt,
    onEscapePressed: openFullscreenExitPrompt,
    suppressEscapeInterceptor: showFullscreenExitConfirm,
  });

  // Submission handler
  const { handleFinalSubmit } = useAssessmentSubmission({
    assessment,
    slug,
    responses,
    sections,
    metadata: metadata as any, // Type compatibility - both types have same structure
    navigation,
    stopProctoring,
    setSubmitting,
    setShowFullscreenWarning,
    setShowSubmitDialog,
    violationScreenshotSamplesRef: violationScreenshotEvidenceRef,
  });

  useEffect(() => {
    handleFinalSubmitRef.current = () => {
      void handleFinalSubmit();
    };
  }, [handleFinalSubmit]);

  // Detect camera/mic loss during the exam (proctored only)
  useEffect(() => {
    if (
      !assessmentStarted ||
      submitting ||
      assessment?.proctoring_enabled === false
    ) {
      setMediaInterrupted(false);
      return;
    }
    mediaGraceUntilRef.current = Date.now() + 10000;

    const id = window.setInterval(() => {
      if (Date.now() < mediaGraceUntilRef.current) return;
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const vOk =
        stream?.getVideoTracks().some((t) => t.readyState === "live") ?? false;
      const aOk =
        stream?.getAudioTracks().some((t) => t.readyState === "live") ?? false;
      setMediaInterrupted(!stream || !vOk || !aOk);
    }, 3000);

    return () => clearInterval(id);
  }, [
    assessmentStarted,
    submitting,
    assessment?.proctoring_enabled,
    videoRef,
  ]);

  // Preload proctoring model so it's ready when assessment starts (does NOT start camera)
  // Camera is started in handleStartAssessment by attaching __assessmentStream from device-check.

  const handleFullscreenExitCancel = useCallback(async () => {
    setShowFullscreenExitConfirm(false);
    if (isDocumentFullscreen()) {
      return;
    }
    try {
      await enterFullscreen();
      await new Promise((r) => setTimeout(r, 150));
      if (!isDocumentFullscreen()) {
        setShowFullscreenWarning(true);
      }
    } catch {
      setShowFullscreenWarning(true);
    }
  }, [enterFullscreen, isDocumentFullscreen, setShowFullscreenWarning]);

  const handleFullscreenExitSubmit = useCallback(() => {
    setShowFullscreenExitConfirm(false);
    handleFinalSubmitRef.current();
  }, []);

  const handleRetryProctoringMedia = useCallback(() => {
    setMediaInterrupted(false);
    mediaGraceUntilRef.current = Date.now() + 10000;
    startProctoring().catch(() => {
      showToast(
        "Could not restore camera or microphone. Please use device check again.",
        "error"
      );
      router.replace(`/assessments/${slug}/device-check`);
    });
  }, [startProctoring, showToast, router, slug]);

  // Start assessment - require live camera + mic before timer (proctored)
  const handleStartAssessment = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setShowStartButton(false);

    const failProctoredStart = (toastMessage: string) => {
      flushSync(() => setAssessmentStarted(false));
      isInitializingRef.current = false;
      showToast(toastMessage, "error");
      router.replace(`/assessments/${slug}/device-check`);
    };

    try {
      if (assessment?.proctoring_enabled !== false) {
        // Try to use the stream from device-check; if missing/incomplete, request fresh
        let stream = getAssessmentWindowStream();
        const hasLiveVideo =
          stream?.getVideoTracks().some((t) => t.readyState === "live") ??
          false;
        const hasLiveAudio =
          stream?.getAudioTracks().some((t) => t.readyState === "live") ??
          false;

        if (!stream || !hasLiveVideo || !hasLiveAudio) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
              audio: { echoCancellation: true, noiseSuppression: true },
            });
            if (typeof window !== "undefined") {
              (window as any).__assessmentStream = stream;
            }
          } catch {
            failProctoredStart(
              "Camera and microphone are required.\nPlease allow access and complete device check."
            );
            return;
          }
        }

        // Mount UI so <video ref={videoRef}> in timer bar is available
        flushSync(() => setAssessmentStarted(true));

        // Attach the live stream to the video element immediately
        await new Promise<void>((resolve) => {
          const tryAttach = () => {
            const el = videoRef.current;
            if (el) {
              if (el.srcObject !== stream) {
                el.srcObject = stream;
                el.autoplay = true;
                el.playsInline = true;
                el.muted = true;
                el.play().catch(() => {});
              }
              resolve();
            } else {
              requestAnimationFrame(tryAttach);
            }
          };
          tryAttach();
        });

        // Start face detection in the background — do NOT await.
        startProctoring().catch(() => {
          showToast(
            "Face detection could not start, but your camera is active.",
            "warning"
          );
        });
      } else {
        setAssessmentStarted(true);
      }

      timer.start();

      setTimeout(() => {
        enterFullscreen()
          .then(() => {
            setTimeout(() => {
              const isFS =
                !!document.fullscreenElement ||
                !!(document as any).webkitFullscreenElement ||
                !!(document as any).mozFullScreenElement ||
                !!(document as any).msFullscreenElement;

              if (!isFS) {
                setShowFullscreenWarning(true);
              }
            }, 100);
          })
          .catch(() => {
            setShowFullscreenWarning(true);
          });
      }, 100);
    } catch (error: any) {
      showToast(error.message || "Failed to start assessment.", "error");
      setShowStartButton(true);
      isInitializingRef.current = false;
    }
  }, [
    timer,
    startProctoring,
    enterFullscreen,
    showToast,
    setShowFullscreenWarning,
    assessment,
    videoRef,
    router,
    slug,
  ]);

  // Time up handler
  useEffect(() => {
    timeUpCallbackRef.current = () => {
      showToast("Time is up! Submitting assessment...", "warning");
      handleFinalSubmit();
    };
  }, [handleFinalSubmit, showToast]);
  
  // Track if timer has been initialized to prevent multiple resets
  const timerInitializedRef = useRef(false);
  const lastRemainingTimeRef = useRef<number | null>(null);
  
  // Update timer when remaining_time changes (for resuming assessments) - DEFERRED to prevent freeze
  useEffect(() => {
    if (assessment?.remaining_time !== undefined && assessment?.remaining_time !== null) {
      const newTimeSeconds = assessment.remaining_time * 60;
      
      // If remaining_time is 0, auto-submit immediately
      if (assessment.remaining_time === 0 && assessmentStarted && !submitting) {
        showToast("Time is up! Submitting assessment...", "warning");
        handleFinalSubmit();
        return;
      }
      
      // Only reset if time actually changed (not just on every render)
      if (lastRemainingTimeRef.current !== assessment.remaining_time) {
        lastRemainingTimeRef.current = assessment.remaining_time;
        
        // Defer timer reset to prevent blocking initial render
        const resetTimer = () => {
          const timeDifference = Math.abs(timer.remainingSeconds - newTimeSeconds);
          // Only reset if difference is significant (more than 10 seconds) or not initialized
          if (!timerInitializedRef.current || timeDifference > 10) {
            timerInitializedRef.current = true;
            timer.reset(newTimeSeconds);
            if (assessmentStarted) {
              timer.start();
            }
          }
        };
        
        // Defer with longer delay to prevent freeze
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(resetTimer, { timeout: 1000 });
        } else {
          setTimeout(resetTimer, 300);
        }
      }
    }
  }, [assessment?.remaining_time, assessment?.status, assessmentStarted, submitting, timer, showToast, handleFinalSubmit]);
  
  // Auto-start when assessment loads (if not submitted) - deferred to prevent freeze
  useEffect(() => {
    if (
      assessment &&
      !loading &&
      assessment.status !== "submitted" &&
      !assessmentStarted &&
      !showStartButton &&
      sections.length > 0
    ) {
      // Defer auto-start to allow initial render, timer, and camera pre-warming
      const startTimer = setTimeout(() => {
        handleStartAssessment();
      }, 150);
      
      return () => clearTimeout(startTimer);
    }
  }, [assessment, loading, assessmentStarted, showStartButton, sections.length, handleStartAssessment]);

  // Cleanup on unmount - ensure camera is always stopped
  useEffect(() => {
    return () => {
      // Aggressively stop camera on unmount
      try {
        // Stop proctoring hook
        if (isProctoringActiveRef.current) {
          stopProctoring();
        }

        // Stop proctoring service
        try {
          const proctoringService = getProctoringService();
          if (proctoringService) {
            proctoringService.stopProctoring();
          }
        } catch (error) {
          // Continue
        }

        // Stop all media tracks utility
        try {
          stopAllMediaTracks();
        } catch (error) {
          // Continue
        }

        // Force stop all video and audio elements
        document.querySelectorAll("video, audio").forEach((element) => {
          const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
          if (mediaElement.srcObject) {
            const stream = mediaElement.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              track.stop(); // Stop regardless of state
            });
            mediaElement.srcObject = null;
            mediaElement.pause();
          }
        });

        // Additional cleanup: stop any getUserMedia streams
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
              stream.getTracks().forEach((track) => track.stop());
            })
            .catch(() => {
              // Ignore - this is just cleanup
            });
        }
      } catch (error) {
        // Silently fail - but try one more pass
        try {
          document.querySelectorAll("video, audio").forEach((element) => {
            const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
            if (mediaElement.srcObject) {
              (mediaElement.srcObject as MediaStream).getTracks().forEach((track) => {
                track.stop();
              });
              mediaElement.srcObject = null;
            }
          });
        } catch (finalError) {
          // Last resort
        }
      }

      // Clear debounce timer
      if (answerChangeDebounceRef.current) {
        clearTimeout(answerChangeDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const applyAnswerToResponses = useCallback(
    (
      prev: Record<string, Record<string, any>>,
      sectionType: string,
      questionId: string | number,
      answer: any
    ) => {
      if (answer === null || answer === undefined) {
        const newSectionResponses = { ...prev[sectionType] };
        delete newSectionResponses[questionId];
        if (prev[sectionType]?.[questionId] !== undefined) {
          return {
            ...prev,
            [sectionType]: newSectionResponses,
          };
        }
        return prev;
      }

      const currentAnswer = prev[sectionType]?.[questionId];
      if (
        currentAnswer === answer ||
        (typeof answer === "object" &&
          typeof currentAnswer === "object" &&
          JSON.stringify(currentAnswer) === JSON.stringify(answer))
      ) {
        return prev;
      }

      return {
        ...prev,
        [sectionType]: {
          ...prev[sectionType],
          [questionId]: answer,
        },
      };
    },
    []
  );

  // Debounce quiz/coding only. Subjective uses a controlled TextField — delayed setState
  // would reset the input on every keystroke before the timeout fires.
  const handleAnswerChange = useCallback(
    (sectionType: string, questionId: string | number, answer: any) => {
      if (sectionType === "subjective") {
        if (answerChangeDebounceRef.current) {
          clearTimeout(answerChangeDebounceRef.current);
          answerChangeDebounceRef.current = null;
        }
        setResponses((prev) =>
          applyAnswerToResponses(prev, sectionType, questionId, answer)
        );
        return;
      }

      if (answerChangeDebounceRef.current) {
        clearTimeout(answerChangeDebounceRef.current);
      }

      answerChangeDebounceRef.current = setTimeout(() => {
        setResponses((prev) =>
          applyAnswerToResponses(prev, sectionType, questionId, answer)
        );
      }, 100);
    },
    [applyAnswerToResponses]
  );

  // Dialog handlers
  const handleShowSubmitDialog = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleCloseSubmitDialog = useCallback(() => {
    setShowSubmitDialog(false);
  }, []);

  // Section change handler - IMMEDIATE, never block navigation
  const handleSectionChange = useCallback((sectionIndex: number) => {
    // Never block navigation - update immediately
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(0);
    // Don't use transition state - it blocks navigation
  }, []);

  // Computed values - heavily memoized
  const currentSection = useMemo(
    () => (sections.length > 0 ? sections[currentSectionIndex] : null),
    [sections, currentSectionIndex]
  );

  const sectionType = useMemo(
    () => currentSection?.section_type || "quiz",
    [currentSection]
  );

  const quizQuestions = useMemo(() => {
    if (!currentSection || sectionType !== "quiz") return [];
    return currentSection.questions || [];
  }, [currentSection, sectionType]);

  const subjectiveQuestions = useMemo((): Array<{
    id: number;
    question_text: string;
    max_marks?: number;
    question_type?: string;
  }> => {
    if (!currentSection || sectionType !== "subjective") return [];
    return (currentSection.questions || []) as Array<{
      id: number;
      question_text: string;
      max_marks?: number;
      question_type?: string;
    }>;
  }, [currentSection, sectionType]);

  // Optimized mappedQuizQuestions - cache with ref to prevent recalculation on navigation
  const mappedQuizQuestionsRef = useRef<any[]>([]);
  const lastMappedHashRef = useRef<string>("");
  
  const mappedQuizQuestions = useMemo(() => {
    if (!quizQuestions.length) {
      mappedQuizQuestionsRef.current = [];
      return [];
    }
    
    const sectionResponses = responses[sectionType] || {};
    
    // Create a hash of only the relevant responses for this section
    const relevantResponses = quizQuestions.map((q: any) => ({
      id: q.id,
      answered: !!sectionResponses[q.id]
    }));
    const hash = JSON.stringify(relevantResponses);
    
    // Only recalculate if responses for this section actually changed
    if (hash === lastMappedHashRef.current && mappedQuizQuestionsRef.current.length > 0) {
      return mappedQuizQuestionsRef.current;
    }
    
    lastMappedHashRef.current = hash;
    
    const mapped = quizQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answered: !!sectionResponses[q.id],
    }));
    
    mappedQuizQuestionsRef.current = mapped;
    return mapped;
  }, [quizQuestions, responses, sectionType]);

  const mappedSubjectiveQuestionsRef = useRef<any[]>([]);
  const lastMappedSubjectiveHashRef = useRef<string>("");

  const mappedSubjectiveQuestions = useMemo(() => {
    if (!subjectiveQuestions.length) {
      mappedSubjectiveQuestionsRef.current = [];
      return [];
    }
    const sectionResponses = responses[sectionType] || {};
    const relevantResponses = subjectiveQuestions.map((q: any) => {
      const raw = sectionResponses[q.id] ?? sectionResponses[String(q.id)];
      const text =
        typeof raw === "string" ? raw : normalizeSubjectiveAnswer(raw);
      return {
        id: q.id,
        answered: text.trim().length > 0,
      };
    });
    const hash = JSON.stringify(relevantResponses);
    if (
      hash === lastMappedSubjectiveHashRef.current &&
      mappedSubjectiveQuestionsRef.current.length > 0
    ) {
      return mappedSubjectiveQuestionsRef.current;
    }
    lastMappedSubjectiveHashRef.current = hash;
    const mapped = subjectiveQuestions.map((q: any) => {
      const raw = sectionResponses[q.id] ?? sectionResponses[String(q.id)];
      const text =
        typeof raw === "string" ? raw : normalizeSubjectiveAnswer(raw);
      return {
        id: q.id,
        question: q.question_text,
        answered: text.trim().length > 0,
      };
    });
    mappedSubjectiveQuestionsRef.current = mapped;
    return mapped;
  }, [subjectiveQuestions, responses, sectionType]);

  // Optimized section status - use ref to prevent recalculation on every navigation
  const sectionStatusRef = useRef<any[]>([]);
  const lastResponsesHashRef = useRef<string>("");
  
  const sectionStatus = useMemo(() => {
    // Create a simple hash of responses to detect actual changes
    const responsesHash = JSON.stringify(Object.keys(responses).map(key => ({
      key,
      count: Object.keys(responses[key] || {}).length
    })));
    
    // Only recalculate if responses actually changed
    if (responsesHash === lastResponsesHashRef.current && sectionStatusRef.current.length > 0) {
      return sectionStatusRef.current;
    }
    
    lastResponsesHashRef.current = responsesHash;
    
    const status = sections.map((section: any) => {
      const sectionType = section.section_type || "quiz";
      const sectionResponses = responses[sectionType] || {};
      const sectionQuestions = section.questions || [];
      
      // Count answered questions for THIS specific section only
      let answered = 0;
      sectionQuestions.forEach((question: any) => {
        const questionId = question.id;
        const response = getResponseForQuestion(
          responses as Record<string, Record<string, unknown>>,
          sectionType,
          questionId,
        );
        if (isAssessmentQuestionCompleted(sectionType, response)) {
          answered++;
        }
      });
      
      return {
        sectionName: section.title || section.section_type || "Section",
        sectionType: sectionType,
        answered,
        total: sectionQuestions.length,
      };
    });
    
    sectionStatusRef.current = status;
    return status;
  }, [sections, responses]);

  // totalAnswered must match section breakdown (sum of sectionStatus.answered)
  // so "Questions Visited" and section breakdown are always consistent
  const totalAnswered = useMemo(() => {
    return sectionStatus.reduce((sum, s) => sum + s.answered, 0);
  }, [sectionStatus]);

  // Handlers - memoized
  const handleQuizAnswerSelect = useCallback(
    (answerId: string | number) => {
      const question = quizQuestions[currentQuestionIndex];
      if (question) {
        handleAnswerChange(sectionType, question.id, answerId);
      }
    },
    [quizQuestions, currentQuestionIndex, sectionType, handleAnswerChange]
  );

  const handleClearAnswer = useCallback(() => {
    const question = quizQuestions[currentQuestionIndex];
    if (question) {
      // Clear the answer by setting it to null
      handleAnswerChange(sectionType, question.id, null);
    }
  }, [quizQuestions, currentQuestionIndex, sectionType, handleAnswerChange]);

  const handleQuizQuestionClick = useCallback(
    (questionId: string | number) => {
      // Don't block on isTransitioning for question clicks - allow rapid navigation
      const index = quizQuestions.findIndex((q: any) => q.id === questionId);
      if (index !== -1 && index !== currentQuestionIndex) {
        // Use requestIdleCallback for non-blocking updates
        const updateQuestion = () => {
          startTransition(() => {
            setCurrentQuestionIndex(index);
          });
        };
        
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(updateQuestion, { timeout: 30 });
        } else {
          setTimeout(updateQuestion, 0);
        }
      }
    },
    [quizQuestions, currentQuestionIndex]
  );

  const currentQuizQuestion = useMemo(
    () => quizQuestions[currentQuestionIndex],
    [quizQuestions, currentQuestionIndex]
  );

  const currentSubjectiveQuestion = useMemo(() => {
    if (!subjectiveQuestions.length) return null;
    return subjectiveQuestions[currentQuestionIndex] || null;
  }, [subjectiveQuestions, currentQuestionIndex]);

  const currentAnswer = useMemo(() => {
    if (!currentQuizQuestion) return undefined;
    return responses[sectionType]?.[currentQuizQuestion.id];
  }, [currentQuizQuestion, responses, sectionType]);

  // Get current coding question details - memoized
  const currentCodingQuestion = useMemo(() => {
    if (!currentSection || sectionType !== "coding") return null;
    return (currentSection as any).questions?.[currentQuestionIndex] || null;
  }, [currentSection, sectionType, currentQuestionIndex]);

  const currentCodingResponse = useMemo(() => {
    if (!currentCodingQuestion) return null;
    return responses["coding"]?.[currentCodingQuestion.id] || null;
  }, [currentCodingQuestion, responses]);

  const currentSubjectiveAnswer = useMemo(() => {
    if (!currentSubjectiveQuestion) return "";
    const raw =
      responses["subjective"]?.[currentSubjectiveQuestion.id] ??
      responses["subjective"]?.[String(currentSubjectiveQuestion.id)];
    if (typeof raw === "string") return raw;
    return normalizeSubjectiveAnswer(raw);
  }, [currentSubjectiveQuestion, responses]);

  // Get coding questions for navigation - optimized
  const codingQuestions = useMemo(() => {
    if (!currentSection || sectionType !== "coding") return [];
    const codingResponses = responses["coding"] || {};
    return (currentSection.questions || []).map((q: any) => {
      const response = codingResponses[q.id] ?? codingResponses[String(q.id)];
      // Only show tick if user explicitly submitted OR ran code and got some passed (tc_passed > 0)
      // Unattempted (tc_passed=0 from payload) should NOT show tick
      const isSubmitted = response?.submitted === true;
      const passedCount = response?.tc_passed ?? response?.passed ?? 0;
      const totalCount = response?.total_tc ?? response?.total_test_cases ?? 0;
      const hasAttempted = isSubmitted || (totalCount > 0 && passedCount > 0);
      return {
        id: q.id,
        title: q.title,
        answered: !!hasAttempted,
      };
    });
  }, [currentSection, sectionType, responses]);

  // Handle coding question click
  const handleCodingQuestionClick = useCallback(
    (questionId: string | number) => {
      // IMMEDIATE navigation - never block
      const index = codingQuestions.findIndex((q: any) => q.id === questionId);
      if (index !== -1 && index !== currentQuestionIndex) {
        // Update immediately - no delays
        setCurrentQuestionIndex(index);
      }
    },
    [codingQuestions, currentQuestionIndex]
  );

  const handleSubjectiveQuestionClick = useCallback(
    (questionId: string | number) => {
      const index = subjectiveQuestions.findIndex((q: any) => q.id === questionId);
      if (index !== -1 && index !== currentQuestionIndex) {
        const updateQuestion = () => {
          startTransition(() => {
            setCurrentQuestionIndex(index);
          });
        };
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(updateQuestion, { timeout: 30 });
        } else {
          setTimeout(updateQuestion, 0);
        }
      }
    },
    [subjectiveQuestions, currentQuestionIndex]
  );

  // Early return
  if (!assessment) {
    return null;
  }

  // Check if assessment has no sections/questions
  if (sections.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          p: 4,
        }}
      >
        <Typography variant="h5" sx={{ color: "#ef4444", fontWeight: 600 }}>
          No Questions Available
        </Typography>
        <Typography variant="body1" sx={{ color: "#6b7280", textAlign: "center" }}>
          This assessment does not have any questions configured. Please contact the administrator.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push(`/assessments/${slug}`)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        position: "relative",
        overflow: "hidden",
        pb: 0.5,
        userSelect: assessmentStarted && !submitting ? "none" : "auto",
        WebkitUserSelect: assessmentStarted && !submitting ? "none" : "auto",
        MozUserSelect: assessmentStarted && !submitting ? "none" : "auto",
        msUserSelect: assessmentStarted && !submitting ? "none" : "auto",
        pointerEvents: submitting ? "none" : "auto",
      }}
      onContextMenu={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
      onCopy={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
      onCut={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
      onPaste={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
    >
      {assessmentStarted && (
        <>
          {mediaInterrupted &&
            !submitting &&
            assessment?.proctoring_enabled !== false && (
              <Box
                sx={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 1999,
                  bgcolor: "rgba(15, 23, 42, 0.78)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                }}
              >
                <Paper
                  elevation={4}
                  sx={{
                    maxWidth: 440,
                    p: 3,
                    textAlign: "center",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Camera or microphone unavailable
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", mb: 2, lineHeight: 1.6 }}
                  >
                    Your session requires an active camera and microphone.
                    Restore permissions or reconnect your devices to continue.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleRetryProctoringMedia}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Retry
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() =>
                        router.push(`/assessments/${slug}/device-check`)
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Back to device check
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}

          <AssessmentTimerBar
            title={assessment.title}
            formattedTime={timer.formattedTime}
            isLastQuestion={navigation.isLastQuestion}
            submitting={submitting}
            onSubmit={handleShowSubmitDialog}
            proctoringVideoRef={assessment?.proctoring_enabled !== false ? videoRef : undefined}
            proctoringStatus={assessment?.proctoring_enabled !== false ? status : undefined}
            faceCount={assessment?.proctoring_enabled !== false ? faceCount : undefined}
            liveStreamStatus={
              assessment?.proctoring_enabled !== false ? liveStreamStatus : undefined
            }
            assessmentToolsSlot={
              <AssessmentToolbarTools
                calculatorOpen={calculatorOpen}
                notepadOpen={notepadOpen}
                onToggleCalculator={() => setCalculatorOpen((o) => !o)}
                onToggleNotepad={() => setNotepadOpen((o) => !o)}
              />
            }
          />

          <AssessmentFloatingTools
            slug={slug}
            enabled={assessmentStarted && !submitting}
            calculatorOpen={calculatorOpen}
            notepadOpen={notepadOpen}
            onToggleCalculator={() => setCalculatorOpen((o) => !o)}
            onToggleNotepad={() => setNotepadOpen((o) => !o)}
          />

          <AssessmentNavigation
            currentSectionIndex={currentSectionIndex}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={navigation.totalQuestions}
            sections={sections}
            currentSectionQuestionCount={navigation.currentSectionQuestionCount}
            isLastQuestion={navigation.isLastQuestion}
            onPrevious={navigation.handlePrevious}
            onNext={navigation.handleNext}
            onSectionChange={handleSectionChange}
          />

          <Box
            sx={{
              pt: 18.5,
              pb: 2,
              px: { xs: 2, md: 4 },
              maxWidth: "100%",
              height: "100vh",
              overflow: "auto",
              boxSizing: "border-box",
            }}
          >
            {currentSection ? (
              <Box
                sx={{
                  position: "relative",
                }}
              >
                {sectionType === "quiz" && currentQuizQuestion && (
                  <MemoizedQuizLayout
                    currentQuestionIndex={currentQuestionIndex}
                    currentQuestion={currentQuizQuestion as any}
                    selectedAnswer={currentAnswer}
                    questions={mappedQuizQuestions}
                    totalQuestions={quizQuestions.length}
                    onAnswerSelect={handleQuizAnswerSelect}
                    onClearAnswer={handleClearAnswer}
                    onNextQuestion={navigation.handleNext}
                    onPreviousQuestion={navigation.handlePrevious}
                    onQuestionClick={handleQuizQuestionClick}
                  />
                )}

                {sectionType === "coding" && currentCodingQuestion && (
                  <MemoizedCodingLayout
                    key={`coding-${currentCodingQuestion.id}-${currentQuestionIndex}`}
                    slug={slug}
                    questionId={currentCodingQuestion.id}
                    problemData={{
                      content_title: currentCodingQuestion.title,
                      details: currentCodingQuestion,
                    }}
                    initialCode={
                      currentCodingResponse?.code ||
                      currentCodingQuestion.template_code?.python ||
                      currentCodingQuestion.template_code?.python3 ||
                      ""
                    }
                    initialLanguage={
                      currentCodingResponse?.language || "python"
                    }
                    questions={codingQuestions}
                    totalQuestions={codingQuestions.length}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionClick={handleCodingQuestionClick}
                    onNextQuestion={navigation.handleNext}
                    onPreviousQuestion={navigation.handlePrevious}
                    onCodeChange={(code, language) => {
                      handleAnswerChange(
                        "coding",
                        currentCodingQuestion.id,
                        {
                          code,
                          language,
                          ...(currentCodingResponse || {}),
                        }
                      );
                    }}
                    onCodeSubmit={(result) => {
                      setResponses((prev) => ({
                        ...prev,
                        coding: {
                          ...prev.coding,
                          [currentCodingQuestion.id]: {
                            ...prev.coding?.[currentCodingQuestion.id],
                            code:
                              result.best_code ||
                              prev.coding?.[currentCodingQuestion.id]?.code ||
                              "",
                            language:
                              prev.coding?.[currentCodingQuestion.id]
                                ?.language || "python",
                            tc_passed: result.tc_passed ?? result.passed ?? 0,
                            total_tc:
                              result.total_tc ?? result.total_test_cases ?? 0,
                            submitted: true, // Mark as submitted
                          },
                        },
                      }));
                    }}
                  />
                )}

                {sectionType === "subjective" && currentSubjectiveQuestion && (
                  <MemoizedSubjectiveLayout
                    key={`subjective-${currentSubjectiveQuestion.id}-${currentQuestionIndex}`}
                    currentQuestionIndex={currentQuestionIndex}
                    currentQuestion={{
                      id: currentSubjectiveQuestion.id,
                      question_text: currentSubjectiveQuestion.question_text,
                      max_marks: currentSubjectiveQuestion.max_marks,
                      question_type: currentSubjectiveQuestion.question_type,
                    }}
                    answerText={currentSubjectiveAnswer}
                    questions={mappedSubjectiveQuestions}
                    totalQuestions={subjectiveQuestions.length}
                    onAnswerChange={(text) =>
                      handleAnswerChange(
                        "subjective",
                        currentSubjectiveQuestion.id,
                        text
                      )
                    }
                    onNextQuestion={navigation.handleNext}
                    onPreviousQuestion={navigation.handlePrevious}
                    onQuestionClick={handleSubjectiveQuestionClick}
                  />
                )}

                {/* Show message if section exists but has no questions */}
                {sectionType === "quiz" && !currentQuizQuestion && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#6b7280" }}>
                      No questions available in this section
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      This section does not contain any questions.
                    </Typography>
                  </Box>
                )}

                {sectionType === "coding" && !currentCodingQuestion && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#6b7280" }}>
                      No coding problems available in this section
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      This section does not contain any coding problems.
                    </Typography>
                  </Box>
                )}

                {sectionType === "subjective" && !currentSubjectiveQuestion && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#6b7280" }}>
                      No subjective questions in this section
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      This section does not contain any subjective questions.
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="h6" sx={{ color: "#6b7280" }}>
                  No section available
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Unable to load assessment sections. Please refresh the page.
                </Typography>
              </Box>
            )}
          </Box>

          <Suspense fallback={null}>
            {showSubmitDialog && (
              <SubmissionDialog
                open={showSubmitDialog}
                sections={sections}
                responses={responses}
                totalQuestions={navigation.totalQuestions}
                totalAnswered={totalAnswered}
                onClose={handleCloseSubmitDialog}
                onConfirm={handleFinalSubmit}
                submitting={submitting}
              />
            )}

            {showFullscreenWarning && !submitting && (
              <FullscreenWarningDialog
                open={showFullscreenWarning}
                onReEnterFullscreen={handleReEnterFullscreen}
              />
            )}

            {showFullscreenExitConfirm && !submitting && (
              <FullscreenExitConfirmDialog
                open={showFullscreenExitConfirm}
                onCancel={handleFullscreenExitCancel}
                onSubmit={handleFullscreenExitSubmit}
              />
            )}
          </Suspense>
        </>
      )}

      {/* Auto-start assessment - no start button needed */}
    </Box>
  );
}
