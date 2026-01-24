import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { assessmentService } from "@/lib/services/assessment.service";
import { AssessmentMetadata } from "@/lib/services/assessment.service";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";
import { getProctoringService } from "@/lib/services/proctoring.service";
import { formatAssessmentResponses } from "@/utils/assessment.utils";

interface UseAssessmentSubmissionOptions {
  assessment: any;
  slug: string;
  responses: Record<string, Record<string, any>>;
  sections: any[];
  metadata: AssessmentMetadata;
  navigation: { totalQuestions: number };
  stopProctoring: () => void;
  setSubmitting: (value: boolean) => void;
  setShowFullscreenWarning: (value: boolean) => void;
  setShowSubmitDialog?: (value: boolean) => void;
}

export function useAssessmentSubmission({
  assessment,
  slug,
  responses,
  sections,
  metadata,
  navigation,
  stopProctoring,
  setSubmitting,
  setShowFullscreenWarning,
  setShowSubmitDialog,
}: UseAssessmentSubmissionOptions) {
  const router = useRouter();
  const { showToast } = useToast();
  const isSubmittingRef = useRef(false);
  const hasNavigatedRef = useRef(false); // Prevent multiple navigations

  // Comprehensive camera stop function - optimized to be fast and non-blocking
  const stopCameraCompletely = useCallback(async () => {
    try {
      // 1. Stop proctoring hook (synchronous, fast)
      stopProctoring();

      // 2. Stop proctoring service (synchronous, fast)
      try {
        const proctoringService = getProctoringService();
        proctoringService.stopProctoring();
      } catch (error) {
        // Continue
      }

      // 3. Stop all media tracks utility (synchronous, fast)
      stopAllMediaTracks();

      // 4. Explicitly stop all video element tracks (synchronous, fast)
      try {
        const videoElements = document.querySelectorAll("video");
        videoElements.forEach((video) => {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              if (track.readyState === "live" || track.readyState === "ended") {
                track.stop();
              }
            });
            video.srcObject = null;
          }
        });
      } catch (error) {
        // Continue
      }

      // 5. Stop all audio tracks (synchronous, fast)
      try {
        const audioElements = document.querySelectorAll("audio");
        audioElements.forEach((audio) => {
          if (audio.srcObject) {
            const stream = audio.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              if (track.readyState === "live" || track.readyState === "ended") {
                track.stop();
              }
            });
            audio.srcObject = null;
          }
        });
      } catch (error) {
        // Continue
      }

      // 6. Quick cleanup pass (minimal delay)
      await new Promise((resolve) => setTimeout(resolve, 50));
      stopAllMediaTracks();

      // 7. Final pass for any missed streams (minimal delay)
      document.querySelectorAll("video").forEach((video) => {
        if (video.srcObject) {
          (video.srcObject as MediaStream).getTracks().forEach((track) => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    } catch (error) {
      // Even if cleanup fails, try one more quick pass
      try {
        stopAllMediaTracks();
        document.querySelectorAll("video").forEach((video) => {
          if (video.srcObject) {
            (video.srcObject as MediaStream).getTracks().forEach((track) => {
              track.stop();
            });
            video.srcObject = null;
          }
        });
      } catch (finalError) {
        // Last resort - at least we tried
      }
    }
  }, [stopProctoring]);

  const handleFinalSubmit = useCallback(async () => {
    // SECURITY: Prevent multiple submissions and manipulation
    if (!assessment || isSubmittingRef.current || hasNavigatedRef.current) {
      return;
    }

    try {
      // Lock submission immediately - prevent any manipulation
      isSubmittingRef.current = true;
      setSubmitting(true);
      
      // SECURITY: Remove beforeunload handler immediately to prevent browser prompt
      // This prevents the "leave site" dialog from appearing
      window.onbeforeunload = null;
      
      // SECURITY: Disable all user interactions during submission
      document.body.style.pointerEvents = "none";
      document.body.style.userSelect = "none";
      
      // Close all modals immediately
      setShowFullscreenWarning(false);
      if (setShowSubmitDialog) {
        setShowSubmitDialog(false);
      }

      // CRITICAL: Capture responses as deep copy - original state is NEVER modified
      // This ensures if submission fails, all student answers remain intact for retry
      const currentResponses = JSON.parse(JSON.stringify(responses));

      // Calculate total duration
      const totalDurationSeconds =
        (new Date().getTime() -
          new Date(metadata.timing.started_at).getTime()) /
        1000;

      // Calculate completed questions
      const completedQuestions = Object.values(currentResponses as Record<string, Record<string, any>>).reduce(
        (count: number, sectionResponses: Record<string, any>) => {
          return count + Object.keys(sectionResponses).length;
        },
        0
      );

      const totalQuestions = navigation.totalQuestions;

      // Extract proctoring data
      const faceValidationFailures = metadata.proctoring.face_violations.filter(
        (v) => v.type === "NO_FACE" || v.type === "MULTIPLE_FACES"
      ).length;
      const multipleFaceDetections = metadata.proctoring.face_violations.filter(
        (v) => v.type === "MULTIPLE_FACES"
      ).length;
      const fullscreenExits = metadata.proctoring.fullscreen_exits.length;

      // Format responses using helper function (uses actual section IDs)
      const { quizSectionId, codingProblemSectionId } = formatAssessmentResponses(
        currentResponses,
        sections
      );

      // Prepare metadata for transcript
      const transcriptMetadata = {
        timing: {
          started_at: metadata.timing.started_at,
        },
        proctoring: {
          tab_switches: metadata.proctoring.tab_switches,
          face_violations: metadata.proctoring.face_violations,
          eye_movement_violations: metadata.proctoring.eye_movement_violations || [],
          eye_movement_count: metadata.proctoring.eye_movement_count || 0,
          fullscreen_exits: metadata.proctoring.fullscreen_exits,
          total_violation_count: metadata.proctoring.total_violation_count,
          violation_threshold_reached: metadata.proctoring.violation_threshold_reached,
        },
        total_questions: totalQuestions,
        fullscreen_exits: fullscreenExits,
        completed_questions: completedQuestions,
        face_validation_failures: faceValidationFailures,
        multiple_face_detections: multipleFaceDetections,
        eye_movement_count: metadata.proctoring.eye_movement_count || 0,
      };

      // Prepare request body according to API format
      const requestBody = {
        metadata: {
          transcript: {
            logs: [],
            metadata: transcriptMetadata,
            total_duration_seconds: totalDurationSeconds,
          },
        },
        quizSectionId,
        codingProblemSectionId,
      };

      // Submit assessment - THIS IS THE CRITICAL STEP
      // SECURITY: Ensure submission actually succeeds before proceeding
      try {
        await assessmentService.finalSubmit(slug, requestBody);
        // If we get here, submission was successful (API throws on error)
        
        // Mark as navigated to prevent duplicate navigation
        hasNavigatedRef.current = true;
      } catch (submitError: any) {
        // SECURITY: If submission fails, throw error to prevent navigation
        throw new Error(submitError?.message || "Submission failed. Please try again.");
      }

      // Show success immediately
      showToast("Assessment submitted successfully!", "success");

      // Stop camera and cleanup in background (non-blocking)
      // Don't wait for this - navigate immediately
      Promise.resolve().then(() => {
        try {
          stopProctoring();
          try {
            const proctoringService = getProctoringService();
            proctoringService.stopProctoring();
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
      });

      // Exit fullscreen (non-blocking)
      Promise.resolve().then(() => {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen().catch(() => {});
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen().catch(() => {});
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen().catch(() => {});
          }
        } catch (error) {
          // Silently fail
        }
      });

      // Navigate immediately - no delay to prevent freezing
      // Use window.location for reliable navigation (ensures clean state)
      // SECURITY: Only navigate if submission was successful
      if (hasNavigatedRef.current) {
        // Use requestAnimationFrame for smooth, non-blocking navigation
        requestAnimationFrame(() => {
          window.location.href = `/assessments/${slug}/submission-success`;
        });
      }
    } catch (error: any) {
      // SECURITY: Re-enable interactions on error (allow retry)
      document.body.style.pointerEvents = "";
      document.body.style.userSelect = "";
      
      // Reset submission flags to allow retry
      hasNavigatedRef.current = false;
      
      // On error, stop camera in background (non-blocking)
      stopCameraCompletely().catch(() => {
        // Silently fail - don't block error handling
      });
      
      // IMPORTANT: We do NOT clear responses state on error
      // All student answers remain intact - they can retry submission
      // The payload will be recalculated from current responses state on next attempt
      showToast(error?.message || "Failed to submit assessment. Please try again.", "error");
      setSubmitting(false);
      isSubmittingRef.current = false;
      // Note: responses state is preserved - student can retry without losing work
    }
  }, [
    assessment,
    slug,
    responses,
    sections,
    metadata,
    navigation,
    stopProctoring,
    setSubmitting,
    setShowFullscreenWarning,
    setShowSubmitDialog,
    router,
    showToast,
    stopCameraCompletely,
  ]);

  return { handleFinalSubmit };
}

