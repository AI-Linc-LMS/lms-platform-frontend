import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getTranslatedAssessmentTitle,
  getTranslatedAssessmentDescription,
} from "../../../utils/assessmentTranslations";
import {
  getInstructions,
  startAssessment,
  AssessmentDetails,
} from "../../../services/assesment/assesmentApis";
import { getReferralCode } from "../../../utils/referralUtils";

const InstructionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { assessmentId, ref } = useParams<{
    assessmentId: string;
    ref?: string;
  }>();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [searchParams] = useSearchParams();

  // Get referral code from URL path parameter first, then from search params as fallback
  const referralCode = ref || getReferralCode(searchParams);

  // Use assessment ID from URL params or redirect to assessments list
  const currentAssessmentId = assessmentId;

  // Camera and mic permission check state
  const [deviceCheckStatus, setDeviceCheckStatus] = useState<{
    camera: "checking" | "success" | "error" | "not_started";
    mic: "checking" | "success" | "error" | "not_started";
    errorMessage: string;
  }>({
    camera: "not_started",
    mic: "not_started",
    errorMessage: "",
  });
  const [isDeviceCheckComplete, setIsDeviceCheckComplete] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // If no assessment ID is provided, redirect to assessments list
  useEffect(() => {
    if (!currentAssessmentId) {
      navigate("/assessments");
      return;
    }
  }, [currentAssessmentId, navigate]);

  const {
    data: assessmentData,
    isLoading,
    error,
  } = useQuery<AssessmentDetails>({
    queryKey: ["assessment-instructions", currentAssessmentId],
    queryFn: () =>
      currentAssessmentId
        ? getInstructions(clientId, currentAssessmentId)
        : Promise.reject(new Error("No assessment ID")),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!currentAssessmentId,
  });

  // Check camera and mic permissions (for both new assessments and resuming)
  useEffect(() => {
    if (
      !currentAssessmentId ||
      isDeviceCheckComplete ||
      !assessmentData ||
      assessmentData?.status === "submitted"
    )
      return;

    const checkDevices = async () => {
      try {
        // Check camera
        setDeviceCheckStatus((prev) => ({
          ...prev,
          camera: "checking",
        }));

        // Check microphone
        setDeviceCheckStatus((prev) => ({
          ...prev,
          mic: "checking",
        }));

        // Request both camera and mic access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        // Check if video track exists and is active
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack && videoTrack.readyState === "live") {
          setDeviceCheckStatus((prev) => ({
            ...prev,
            camera: "success",
          }));
        } else {
          setDeviceCheckStatus((prev) => ({
            ...prev,
            camera: "error",
            errorMessage: "Camera is not accessible",
          }));
        }

        if (audioTrack && audioTrack.readyState === "live") {
          setDeviceCheckStatus((prev) => ({
            ...prev,
            mic: "success",
          }));
        } else {
          setDeviceCheckStatus((prev) => ({
            ...prev,
            mic: "error",
            errorMessage: prev.errorMessage || "Microphone is not accessible",
          }));
        }

        // Store stream for cleanup
        streamRef.current = stream;

        // Mark check as complete
        setIsDeviceCheckComplete(true);

        // Keep the stream running until navigation
        // Don't stop it immediately - let it run until user clicks Start/Resume
        // This maintains permissions and makes transition smoother
      } catch (error: any) {
        const errorMessage =
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
            ? "Camera and microphone permissions are required. Please allow access and try again."
            : error.name === "NotFoundError" ||
              error.name === "DevicesNotFoundError"
            ? "No camera or microphone found. Please connect a camera and microphone."
            : error.message || "Failed to access camera and microphone.";

        setDeviceCheckStatus({
          camera: "error",
          mic: "error",
          errorMessage,
        });
        setIsDeviceCheckComplete(true);
      }
    };

    checkDevices();

    // Cleanup on unmount - don't stop stream if it's been passed to assessment
    return () => {
      // Only stop stream if it hasn't been passed to assessment page
      // The stream should continue running in the assessment
      if (streamRef.current && !(window as any).__assessmentCameraStream) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      // If stream was passed to assessment, don't stop it - let assessment handle it
    };
  }, [currentAssessmentId, isDeviceCheckComplete, assessmentData]);

  const startAssessmentMutation = useMutation({
    mutationFn: () =>
      startAssessment(
        clientId,
        currentAssessmentId!,
        undefined,
        referralCode || undefined
      ),
    onSuccess: () => {
      // Store stream globally so ShortAssessment can access it
      // MediaStream cannot be serialized in navigation state
      if (streamRef.current) {
        (window as any).__assessmentCameraStream = streamRef.current;
        // Clear the ref so cleanup doesn't stop it
        streamRef.current = null;
      }
      navigate("/assessment/quiz", {
        state: {
          assessmentId: currentAssessmentId,
        },
      });
    },
    onError: () => {
      alert("Failed to start assessment. Please try again.");
    },
  });

  // Early return if no assessment ID - component will redirect
  if (!currentAssessmentId) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--neutral-500)] mb-2">
              Error Loading Assessment
            </h2>
            <p className="text-[var(--neutral-300)] mb-4">{error.message}</p>
            <button
              onClick={() => navigate("/assessments")}
              className="bg-[var(--primary-500)] text-[var(--font-light)] px-6 py-2 rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
            >
              View All Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartAssessment = () => {
    if (
      currentAssessmentId &&
      deviceCheckStatus.camera === "success" &&
      deviceCheckStatus.mic === "success"
    ) {
      startAssessmentMutation.mutate();
    }
  };

  const handleRetryDeviceCheck = () => {
    setIsDeviceCheckComplete(false);
    setDeviceCheckStatus({
      camera: "not_started",
      mic: "not_started",
      errorMessage: "",
    });
  };

  const handleResumeAssessment = () => {
    // Check devices before resuming (same as starting)
    if (
      currentAssessmentId &&
      deviceCheckStatus.camera === "success" &&
      deviceCheckStatus.mic === "success"
    ) {
      // Store stream globally so ShortAssessment can access it
      // MediaStream cannot be serialized in navigation state
      if (streamRef.current) {
        (window as any).__assessmentCameraStream = streamRef.current;
        // Clear the ref so cleanup doesn't stop it
        streamRef.current = null;
      }
      navigate("/assessment/quiz", {
        state: {
          assessmentId: currentAssessmentId,
        },
      });
    }
  };

  const handleViewResults = () => {
    navigate(`/roadmap/${currentAssessmentId}`);
  };

  // Show preloader for new assessments and in_progress (not for submitted)
  const shouldCheckDevices = assessmentData?.status !== "submitted";

  // Show preloader while checking devices or if there's an error (for new assessments and resuming)
  const showPreloader =
    shouldCheckDevices &&
    (!isDeviceCheckComplete ||
      deviceCheckStatus.camera === "checking" ||
      deviceCheckStatus.mic === "checking" ||
      deviceCheckStatus.camera === "error" ||
      deviceCheckStatus.mic === "error");

  return (
    <div className="min-h-screen bg-[var(--neutral-50)] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Preloader for device check */}
        {showPreloader && (
          <div className="bg-white rounded-3xl w-full border border-gray-200 shadow-lg p-6 lg:p-8 mb-4">
            <div className="flex flex-col items-center justify-center py-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--primary-500)] mb-6 text-center">
                Checking Your Devices
              </h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                We need to verify that your camera and microphone are working
                before starting the assessment.
              </p>

              <div className="w-full max-w-md space-y-4">
                {/* Camera Check */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {deviceCheckStatus.camera === "checking" ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                      ) : deviceCheckStatus.camera === "success" ? (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Camera</p>
                      <p className="text-sm text-gray-500">
                        {deviceCheckStatus.camera === "checking"
                          ? "Checking..."
                          : deviceCheckStatus.camera === "success"
                          ? "Camera ready"
                          : "Camera not accessible"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Microphone Check */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {deviceCheckStatus.mic === "checking" ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                      ) : deviceCheckStatus.mic === "success" ? (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Microphone</p>
                      <p className="text-sm text-gray-500">
                        {deviceCheckStatus.mic === "checking"
                          ? "Checking..."
                          : deviceCheckStatus.mic === "success"
                          ? "Microphone ready"
                          : "Microphone not accessible"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {deviceCheckStatus.errorMessage &&
                  (deviceCheckStatus.camera === "error" ||
                    deviceCheckStatus.mic === "error") && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-700">
                        {deviceCheckStatus.errorMessage}
                      </p>
                    </div>
                  )}

                {/* Retry Button */}
                {isDeviceCheckComplete &&
                  (deviceCheckStatus.camera === "error" ||
                    deviceCheckStatus.mic === "error") && (
                    <button
                      onClick={handleRetryDeviceCheck}
                      className="w-full mt-4 py-3 px-6 bg-[var(--primary-500)] text-white rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
                    >
                      Retry Device Check
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-3xl w-full border border-gray-200 shadow-lg p-6 lg:p-8">
          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary-500)] mb-4">
                {assessmentData?.title
                  ? getTranslatedAssessmentTitle(assessmentData.title, t)
                  : t("assessments.kakatiyaAssessment.title")}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {assessmentData?.instructions || assessmentData?.description
                  ? getTranslatedAssessmentDescription(
                      assessmentData?.title ||
                        "Kakatiya University Entrance Assessment",
                      assessmentData?.instructions ||
                        assessmentData?.description ||
                        "",
                      t
                    )
                  : t("assessments.kakatiyaAssessment.description")}
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t(
                      "assessments.kakatiyaAssessment.details.totalQuestions",
                      {
                        totalQuestions:
                          assessmentData?.number_of_questions || "10",
                      }
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t("assessments.kakatiyaAssessment.details.duration", {
                      duration: assessmentData?.duration_minutes,
                    })}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">
                      {t("assessments.kakatiyaAssessment.details.topics")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.aiFundamentals"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.javascript"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.react"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.nodejs"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.htmlCss"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.cloudDatabase"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.logicAptitude"
                      ),
                    ].map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-[var(--primary-50)] text-gray-700 rounded-full text-sm border border-[var(--primary-200)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  {assessmentData?.status === "submitted" ? (
                    <button
                      onClick={handleViewResults}
                      className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      {t("assessments.kakatiyaAssessment.buttons.viewResults")}
                    </button>
                  ) : assessmentData?.status === "in_progress" ? (
                    <button
                      onClick={handleResumeAssessment}
                      disabled={
                        !isDeviceCheckComplete ||
                        deviceCheckStatus.camera !== "success" ||
                        deviceCheckStatus.mic !== "success"
                      }
                      className="w-full py-3 px-6 bg-[var(--primary-500)] text-white rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {!isDeviceCheckComplete ||
                      deviceCheckStatus.camera !== "success" ||
                      deviceCheckStatus.mic !== "success"
                        ? "Please complete device check"
                        : t(
                            "assessments.kakatiyaAssessment.buttons.resumeTest"
                          )}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartAssessment}
                      disabled={
                        startAssessmentMutation.isPending ||
                        !isDeviceCheckComplete ||
                        deviceCheckStatus.camera !== "success" ||
                        deviceCheckStatus.mic !== "success"
                      }
                      className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {startAssessmentMutation.isPending
                        ? "Starting..."
                        : !isDeviceCheckComplete ||
                          deviceCheckStatus.camera !== "success" ||
                          deviceCheckStatus.mic !== "success"
                        ? "Please complete device check"
                        : t(
                            "assessments.kakatiyaAssessment.buttons.startAssessment"
                          )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
