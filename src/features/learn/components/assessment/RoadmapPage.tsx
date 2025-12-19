import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CertificateTemplates from "../../../../components/certificate/CertificateTemplates";
import PerformanceReport from "./roadmap/PerformanceReport";
import { useSelector } from "react-redux";
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentToast from "./PaymentToast";

// Import types
import {
  CertificateTemplatesRef,
  UserState,
  ScholarshipRedemptionData,
} from "./types/assessmentTypes";

// Import utilities
import {
  transformToPerformanceReportData,
  transformToAccuracyBarData,
  transformToRatingBarData,
  transformToSkillsData,
  getMentorFeedback,
  getScoreArcData,
} from "./utils/assessmentUtils";

// Import chart components
import {
  AccuracyBarChart,
  RatingBars,
  ScoreArc,
  SkillsSection,
} from "./components/ChartComponents";

// Import fallback data
import { certificateFallbackData } from "./data/assessmentData";
import { redeemScholarship } from "../../../../services/assesment/assesmentApis";

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const location = useLocation();

  const currentAssessmentId = assessmentId || location.state?.assessmentId;
  const clientId = parseInt(import.meta.env.VITE_CLIENT_ID) || 1;

  // FIXED: Set to true to show modal immediately on page load
  //  const [showCongratsModal, setShowCongratsModal] = useState(true);

  const certificateRef = useRef<CertificateTemplatesRef>(null);

  // Payment states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    paymentId?: string;
    orderId?: string;
    amount: number;
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "loading";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  // const showToast = (
  //   type: "success" | "error" | "warning" | "loading",
  //   title: string,
  //   message: string
  // ) => {
  //   setToast({ show: true, type, title, message });
  // };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast.show && toast.type !== "loading") {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.type]);

  const {
    data: redeemData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assessment-results", clientId, currentAssessmentId],
    queryFn: () =>
      currentAssessmentId
        ? redeemScholarship(clientId, currentAssessmentId)
        : Promise.reject(new Error("No assessment ID")),
    refetchOnWindowFocus: false, // Disabled to reduce unnecessary refetches
    refetchOnMount: false, // Only refetch if data is stale
    staleTime: 1000 * 60 * 5, // 5 minutes - cache assessment results
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache
    enabled: !!clientId && !!currentAssessmentId,
  });

  const handleDownloadCertificate = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (certificateRef.current) {
        await certificateRef.current.downloadPDF();
      } else {
        // Certificate ref not found after waiting
      }
    } catch {
      // Download failed
    }
  };

  // const handleCertificatePayment = () => {
  //   if (!currentAssessmentId) {
  //     showToast("error", "Error", "Assessment ID not found");
  //     return;
  //   }

  //   const certificatePrice = redeemData?.assessment_price ?? 49;

  //   initiateAssessmentPayment(clientId, certificatePrice, {
  //     prefill: {
  //       name: user?.full_name || "User",
  //       email: user?.email || "",
  //     },
  //     metadata: {
  //       assessmentId: currentAssessmentId,
  //       type_id: currentAssessmentId,
  //       payment_type: "ASSESSMENT",
  //     },
  //   });
  // };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setPaymentResult(null);
  };

  // Get user data and stats
  const user = useSelector((state: { user: UserState }) => state.user);
  const assessmentStats = redeemData?.stats;

  // Certificate payment hook
  // const { paymentState: assessmentPaymentState, initiateAssessmentPayment } =
  //   useAssessmentPayment({
  //     onSuccess: (result: PaymentResult) => {
  //       setPaymentResult({
  //         paymentId: result.paymentId,
  //         orderId: result.orderId,
  //         amount: result.amount,
  //       });
  //       setShowSuccessModal(true);
  //       showToast(
  //         "success",
  //         "Payment Successful!",
  //         "Your certificate payment is complete. You can now download your certificate."
  //       );

  //       // Invalidate and refetch the assessment results query to get updated payment status
  //       queryClient.invalidateQueries({
  //         queryKey: ["assessment-results", clientId, currentAssessmentId],
  //       });

  //       // Also refetch after a short delay to ensure backend processing is complete
  //       setTimeout(() => {
  //         queryClient.invalidateQueries({
  //           queryKey: ["assessment-results", clientId, currentAssessmentId],
  //         });
  //       }, 2000);
  //     },
  //     onError: (error: string) => {
  //       showToast("error", "Payment Failed", error);
  //     },
  //     onDismiss: () => {
  //       showToast(
  //         "warning",
  //         "Payment Cancelled",
  //         "Payment was cancelled. You can try again anytime."
  //       );
  //     },
  //   });

  // Certificate data for the assessment
  const certificateData = {
    ...certificateFallbackData,
    studentName: user?.full_name || certificateFallbackData.studentName,
    studentEmail: user?.email || certificateFallbackData.studentEmail,
    score: assessmentStats?.accuracy_percent || certificateFallbackData.score,
  };

  // Transform data using utilities
  const perfReportData = transformToPerformanceReportData(assessmentStats);
  const accuracyBarData = transformToAccuracyBarData(assessmentStats);
  const ratingBarData = transformToRatingBarData(assessmentStats);
  const { shineSkills, attentionSkills } =
    transformToSkillsData(assessmentStats);
  const mentorFeedback = getMentorFeedback(assessmentStats);
  const { score: arcScore, max } = getScoreArcData(assessmentStats);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Loading your assessment results...
            </p>
            <p className="text-sm text-gray-500">
              Please wait while we prepare your personalized roadmap
            </p>
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    navigate("/assessments");
  }

  // Extract key metrics from stats
  const score = redeemData?.score || assessmentStats?.score || 0;
  const maxMarks =
    redeemData?.maximum_marks || assessmentStats?.maximum_marks || 10;
  const accuracy = assessmentStats?.accuracy_percent || 0;

  const totalQuestions = assessmentStats?.total_questions || 0;
  const attempted = assessmentStats?.attempted_questions || 0;
  const timeTaken = assessmentStats?.time_taken_minutes || 0;

  // Extract proctoring metadata
  const metadata = redeemData?.metadata || {};
  const faceDetectionEvents = metadata?.face_detection_events || [];
  const violations = metadata?.violations || {};

  // Calculate proctoring metrics
  const noFaceIncidents = violations?.no_face_detections || 0;
  const multipleFaceIncidents = violations?.multiple_faces || 0;
  const tabSwitches = violations?.tab_switches || 0;
  const windowSwitches = violations?.window_switches || 0;
  const fullscreenExits = violations?.fullscreen_exits || 0;

  // Calculate face detection durations
  const noFaceDuration = faceDetectionEvents
    .filter((e: any) => e.type === "FACE_NOT_DETECTED_END")
    .reduce((sum: number, e: any) => sum + (e.details?.duration || 0), 0);

  const lookingAwayIncidents = faceDetectionEvents.filter(
    (e: any) => e.type === "LOOKING_AWAY_START"
  ).length;
  const lookingAwayDuration = faceDetectionEvents
    .filter((e: any) => e.type === "LOOKING_AWAY_END")
    .reduce((sum: number, e: any) => sum + (e.details?.duration || 0), 0);

  // Helper functions matching InterviewDetailView
  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-orange-500 to-yellow-600";
    return "from-red-500 to-rose-600";
  };

  // Helper function to get severity level
  const getSeverity = (
    value: number,
    thresholds: { high: number; medium: number }
  ) => {
    if (value > thresholds.high) return { level: "HIGH", color: "red" };
    if (value > thresholds.medium) return { level: "MEDIUM", color: "orange" };
    return { level: "LOW", color: "green" };
  };

  // Reusable Proctoring Card Component
  const ProctoringCard = ({
    title,
    value,
    subtitle,
    thresholds,
    icon,
  }: {
    title: string;
    value: number;
    subtitle?: string;
    thresholds: { high: number; medium: number };
    icon: React.ReactNode;
  }) => {
    const severity = getSeverity(value, thresholds);
    const borderColor =
      severity.color === "red"
        ? "border-red-300"
        : severity.color === "orange"
        ? "border-orange-300"
        : "border-green-300";
    const badgeColor =
      severity.color === "red"
        ? "bg-red-100 text-red-700"
        : severity.color === "orange"
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700";

    return (
      <div
        className={`bg-white rounded-lg p-4 border-2 ${borderColor} hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="text-gray-600">{icon}</div>
            <p className="text-sm font-semibold text-gray-700">{title}</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ${badgeColor}`}
          >
            {severity.level}
          </span>
        </div>
        <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    );
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header - Matching InterviewDetailView style */}
        <div className="mb-8">
          <div
            className={`bg-gradient-to-r ${getScoreGradient(
              accuracy
            )} text-white rounded-2xl p-8 shadow-2xl`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Assessment Results</h2>
                <p className="text-white/90 mb-3">
                  {assessmentStats?.assessment_date &&
                    new Date(
                      assessmentStats.assessment_date
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    COMPLETED
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80 mb-1">Overall Score</p>
                <p className="text-6xl font-bold drop-shadow-lg">
                  {accuracy.toFixed(0)}%
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {score.toFixed(1)}/{maxMarks} marks
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Matching InterviewDetailView */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-gray-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {score.toFixed(1)}/{maxMarks}
            </p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-gray-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-600">Duration</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {Math.round(timeTaken)} min
            </p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-gray-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {attempted}/{totalQuestions}
            </p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-gray-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {accuracy.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Proctoring Statistics - Always Show */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-gray-800 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <h3 className="text-xl font-bold text-gray-800">
                Proctoring Report
              </h3>
            </div>
            {(() => {
              const totalViolations =
                noFaceIncidents +
                lookingAwayIncidents +
                multipleFaceIncidents +
                tabSwitches +
                windowSwitches +
                fullscreenExits;
              const integrityScore = Math.min(
                100,
                noFaceIncidents * 5 +
                  lookingAwayIncidents * 2 +
                  multipleFaceIncidents * 10 +
                  tabSwitches * 3 +
                  windowSwitches * 3 +
                  fullscreenExits * 5
              );
              const confidence = Math.max(0, 100 - integrityScore);
              return (
                <div className="text-right">
                  <p className="text-xs text-gray-600">Total Violations</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalViolations}
                  </p>
                  <p className="text-xs text-gray-600">
                    Confidence: {confidence}%
                  </p>
                </div>
              );
            })()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProctoringCard
              title="Face Not Detected"
              value={noFaceIncidents}
              subtitle={`${Math.round(noFaceDuration)}s total`}
              thresholds={{ high: 5, medium: 2 }}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
            <ProctoringCard
              title="Looking Away"
              value={lookingAwayIncidents}
              subtitle={`${Math.round(lookingAwayDuration)}s total`}
              thresholds={{ high: 10, medium: 5 }}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42L21 21M12 12l.01.01"
                  />
                </svg>
              }
            />
            <ProctoringCard
              title="Multiple Faces"
              value={multipleFaceIncidents}
              subtitle="incidents detected"
              thresholds={{ high: 3, medium: 0 }}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />
            <ProctoringCard
              title="Tab Switches"
              value={tabSwitches}
              subtitle="times switched"
              thresholds={{ high: 5, medium: 2 }}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              }
            />
            <ProctoringCard
              title="Window Switches"
              value={windowSwitches}
              subtitle="times switched"
              thresholds={{ high: 5, medium: 2 }}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
            <ProctoringCard
              title="Fullscreen Exits"
              value={fullscreenExits}
              subtitle="exits detected"
              thresholds={{ high: 3, medium: 1 }}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              }
            />
            {(() => {
              const integrityScore = Math.min(
                100,
                noFaceIncidents * 5 +
                  lookingAwayIncidents * 2 +
                  multipleFaceIncidents * 10 +
                  tabSwitches * 3 +
                  windowSwitches * 3 +
                  fullscreenExits * 5
              );
              const confidence = Math.max(0, 100 - integrityScore);
              const severity = getSeverity(integrityScore, {
                high: 50,
                medium: 25,
              });

              return (
                <div
                  className={`bg-white rounded-lg p-4 border-2 ${
                    severity.color === "red"
                      ? "border-red-300"
                      : severity.color === "orange"
                      ? "border-orange-300"
                      : "border-green-300"
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-gray-700">
                        Integrity Score
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        severity.color === "red"
                          ? "bg-red-100 text-red-700"
                          : severity.color === "orange"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {severity.level === "HIGH"
                        ? "REVIEW"
                        : severity.level === "MEDIUM"
                        ? "CAUTION"
                        : "GOOD"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mb-1">
                    {confidence}%
                  </p>
                  <p className="text-sm text-gray-600">confidence level</p>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg border border-amber-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> This report tracks
              behavioral patterns during the assessment. High violations may
              indicate potential integrity concerns and warrant manual review.
            </p>
          </div>
        </div>

        {/* Performance Analytics Section */}
        <div className="space-y-6 mb-6">
          {/* Performance Report */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 shadow-lg">
            <PerformanceReport
              data={perfReportData}
              redeemData={redeemData as ScholarshipRedemptionData}
              clientId={clientId}
              assessmentId={currentAssessmentId || ""}
            />
          </div>

          {/* Charts Section - Simple and Clean */}
          {accuracyBarData.length > 0 &&
            accuracyBarData.some(
              (d) => d.value > 0 && d.label !== "Unknown"
            ) && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-[var(--primary-700)] mb-6 text-center">
                  Performance Breakdown
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {accuracyBarData.filter(
                    (d) => d.value > 0 && d.label !== "Unknown"
                  ).length > 0 && (
                    <div className="flex justify-center">
                      <AccuracyBarChart
                        data={accuracyBarData.filter(
                          (d) => d.value > 0 && d.label !== "Unknown"
                        )}
                      />
                    </div>
                  )}
                  {arcScore > 0 && max > 0 && (
                    <div className="flex justify-center">
                      <ScoreArc score={arcScore} max={max} />
                    </div>
                  )}
                  {ratingBarData.filter(
                    (d) => d.value > 0 && d.label !== "Unknown"
                  ).length > 0 && (
                    <div className="flex justify-center">
                      <RatingBars
                        data={ratingBarData.filter(
                          (d) => d.value > 0 && d.label !== "Unknown"
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Feedback Sections - Matching InterviewDetailView */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          {mentorFeedback.didWell && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-800">Strengths</h3>
              </div>
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-700 flex-1">{mentorFeedback.didWell}</p>
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {mentorFeedback.couldDoBetter && (
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <svg
                  className="w-6 h-6 text-orange-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-800">
                  Areas for Improvement
                </h3>
              </div>
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="text-gray-700 flex-1">
                  {mentorFeedback.couldDoBetter}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {(shineSkills.length > 0 || attentionSkills.length > 0) && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <SkillsSection
              shineSkills={shineSkills}
              attentionSkills={attentionSkills}
            />
          </div>
        )}

        {/* Overall Feedback */}
        {mentorFeedback.suggestions &&
          (Array.isArray(mentorFeedback.suggestions)
            ? mentorFeedback.suggestions.length > 0
            : mentorFeedback.suggestions) && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-2xl">
              <div className="flex items-center mb-3">
                <svg
                  className="w-6 h-6 text-white mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-bold">Overall Feedback</h3>
              </div>
              <div className="space-y-2">
                {Array.isArray(mentorFeedback.suggestions) ? (
                  mentorFeedback.suggestions.map(
                    (suggestion: string, i: number) => (
                      <div key={i} className="flex items-start space-x-2">
                        <svg
                          className="w-5 h-5 text-white/80 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-lg leading-relaxed">{suggestion}</p>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-lg leading-relaxed">
                    {mentorFeedback.suggestions}
                  </p>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Hidden Certificate Component */}
      <div className="hidden">
        <CertificateTemplates
          ref={certificateRef}
          certificate={certificateData}
        />
      </div>

      {/* Payment Processing Modal */}
      {/* <PaymentProcessingModal
        isOpen={assessmentPaymentState.isProcessing}
        step={
          assessmentPaymentState.step === "error"
            ? "creating"
            : (assessmentPaymentState.step as
                | "creating"
                | "processing"
                | "verifying"
                | "complete")
        }
        onClose={() => {
          // Handle processing modal close if needed
        }}
      /> */}

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        paymentId={paymentResult?.paymentId}
        orderId={paymentResult?.orderId}
        amount={paymentResult?.amount || 0}
        paymentType="assessment"
        onDownloadCertificate={handleDownloadCertificate} // Add this line
      />

      {/* Payment Toast */}
      <PaymentToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={hideToast}
      />
    </div>
  );
};

export default RoadmapPage;

// --- UpskillingRoadmapSection ---
export const UpskillingRoadmapSection: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fcfc] to-white mt-6 sm:mt-8 lg:mt-10 px-4 sm:px-6 lg:px-0">
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--secondary-700)] text-center mb-3 sm:mb-4 leading-tight px-2">
      Upskilling Roadmap After Your
      <br className="hidden sm:block" />
      Assessment Report
    </h2>
    <p className="text-sm sm:text-base lg:text-lg text-gray-700 text-center max-w-2xl mx-auto px-4 sm:px-6">
      Choose the right program that best fits whether you're looking to master
      tech foundations or accelerate your career into top-tier companies.
    </p>

    <div className="border-t border-gray-300 mt-6 sm:mt-8 lg:mt-10 mx-4 sm:mx-6 lg:mx-7 w-full"></div>
  </div>
);
