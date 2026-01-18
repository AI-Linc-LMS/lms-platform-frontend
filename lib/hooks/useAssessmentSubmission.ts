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
}: UseAssessmentSubmissionOptions) {
  const router = useRouter();
  const { showToast } = useToast();
  const isSubmittingRef = useRef(false);

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
    if (!assessment || isSubmittingRef.current) return;

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);
      setShowFullscreenWarning(false);

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
          fullscreen_exits: metadata.proctoring.fullscreen_exits,
          total_violation_count: metadata.proctoring.total_violation_count,
          violation_threshold_reached: metadata.proctoring.violation_threshold_reached,
        },
        total_questions: totalQuestions,
        fullscreen_exits: fullscreenExits,
        completed_questions: completedQuestions,
        face_validation_failures: faceValidationFailures,
        multiple_face_detections: multipleFaceDetections,
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
      await assessmentService.finalSubmit(slug, requestBody);

      // Show success immediately - don't wait for camera cleanup
      showToast("Assessment submitted successfully!", "success");

      // Stop camera in background - don't block navigation
      // Use Promise.race with timeout to ensure it doesn't hang
      Promise.race([
        stopCameraCompletely(),
        new Promise((resolve) => setTimeout(resolve, 2000)), // 2 second timeout
      ]).catch(() => {
        // Silently fail - camera cleanup shouldn't block submission
      });

      // Exit fullscreen (non-blocking)
      Promise.resolve().then(async () => {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
        } catch (error) {
          // Silently fail
        }
      });

      // Navigate immediately - don't wait for camera cleanup
      router.replace(`/assessments/${slug}/submission-success`);
    } catch (error: any) {
      // On error, stop camera in background (non-blocking)
      stopCameraCompletely().catch(() => {
        // Silently fail - don't block error handling
      });
      
      // IMPORTANT: We do NOT clear responses state on error
      // All student answers remain intact - they can retry submission
      // The payload will be recalculated from current responses state on next attempt
      showToast("Failed to submit assessment. Please try again.", "error");
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
    router,
    showToast,
    stopCameraCompletely,
  ]);

  return { handleFinalSubmit };
}

