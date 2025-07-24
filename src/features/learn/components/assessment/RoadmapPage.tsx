import React, { useRef, useState, useEffect } from "react";
// import ailincimg from "../../../../assets/dashboard_assets/toplogoimg.png";
import popper from "../../../../assets/dashboard_assets/poppers.png";
import roadmap from "../../../../assets/roadmap/roadmap.png";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CertificateTemplates from "../../../../components/certificate/CertificateTemplates";
import ProgramCard from "./roadmap/ProgramCard";
import MentorFeedbackSection from "./roadmap/MentorFeedback";
import PerformanceReport from "./roadmap/PerformanceReport";
import { useSelector } from "react-redux";
import { useAssessmentPayment } from "../../../../hooks/useRazorpayPayment";
import { PaymentResult } from "../../../../services/payment/razorpayService";
import PaymentProcessingModal from "./PaymentProcessingModal";
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

// Add this import for countdown timer
import { differenceInDays, addDays } from 'date-fns';

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const currentAssessmentId = assessmentId || location.state?.assessmentId;
  const clientId = parseInt(import.meta.env.VITE_CLIENT_ID) || 1;
  const [isDownloading, setIsDownloading] = useState(false);

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

  const showToast = (
    type: "success" | "error" | "warning" | "loading",
    title: string,
    message: string
  ) => {
    setToast({ show: true, type, title, message });
  };

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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    enabled: !!clientId && !!currentAssessmentId,
  });

  // Add countdown timer state
  const [scholarshipExpiryDate, setScholarshipExpiryDate] = useState<Date | null>(null);
  const [, setTimeRemaining] = useState<string>('');

  // Add useEffect to set scholarship expiry date
  useEffect(() => {
    // Use the current date as the starting point for scholarship expiry
    const expiryDate = redeemData?.stats?.assessment_date
      ? addDays(new Date(redeemData.stats.assessment_date), 7)
      : addDays(new Date(), 7);

    setScholarshipExpiryDate(expiryDate);
  }, [redeemData]);

  // Modify the time remaining calculation
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (scholarshipExpiryDate) {
        const now = new Date();
        const daysLeft = differenceInDays(scholarshipExpiryDate, now);

        if (daysLeft >= 0) {
          // More precise formatting
          const hoursLeft = Math.floor(
            (scholarshipExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          ) % 24;

          const minutesLeft = Math.floor(
            (scholarshipExpiryDate.getTime() - now.getTime()) / (1000 * 60)
          ) % 60;

          // Construct detailed time remaining string
          let timeRemainingStr = '';
          if (daysLeft > 0) {
            timeRemainingStr += `${daysLeft} day${daysLeft !== 1 ? 's' : ''} `;
          }
          timeRemainingStr += `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} `;
          timeRemainingStr += `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

          setTimeRemaining(timeRemainingStr.trim());
        } else {
          // setTimeRemaining('Scholarship Expired');
        }
      } else {
        // If no expiry date is set, set a default 7-day period from now
        // setTimeRemaining('7 days');
      }
    };

    // Initial update
    updateTimeRemaining();

    // Update every minute
    const intervalId = setInterval(updateTimeRemaining, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [scholarshipExpiryDate]);

  // State for countdown
  const [, setCountdown] = useState({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Countdown effect
  useEffect(() => {
    // Set initial expiry date to 7 days from now
    const expiryDate = addDays(new Date(), 7);

    const countdownInterval = setInterval(() => {
      const now = new Date();
      const difference = expiryDate.getTime() - now.getTime();

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days: d, hours: h, minutes: m, seconds: s });
      } else {
        clearInterval(countdownInterval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    // Cleanup interval
    return () => clearInterval(countdownInterval);
  }, []);

  // Add a function to lock scholarship
  // const handleLockScholarship = async () => {
  // try {
  // TODO: Implement actual backend call to lock scholarship
  //   showToast(
  //     "success", 
  //     "Scholarship Locked", 
  //     "Your scholarship has been locked. You can now complete the payment later."
  //   );
  // } catch (error) {
  // showToast(
  //   "error", 
  //   "Lock Failed", 
  //   "Unable to lock scholarship. Please try again."
  // );
  // }
  // };

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (certificateRef.current) {
        //console.log("Certificate ref found, downloading...");
        await certificateRef.current.downloadPDF();
      } else {
        //console.error("Certificate ref not found after waiting");
      }
    } catch {
      //console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCertificatePayment = () => {
    if (!currentAssessmentId) {
      showToast("error", "Error", "Assessment ID not found");
      return;
    }

    const certificatePrice = redeemData?.assessment_price ?? 49;

    initiateAssessmentPayment(clientId, certificatePrice, {
      prefill: {
        name: user?.full_name || "User",
        email: user?.email || "",
      },
      metadata: {
        assessmentId: currentAssessmentId,
        type_id: currentAssessmentId,
        payment_type: "ASSESSMENT",
      },
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setPaymentResult(null);
  };

  // Get user data and stats
  const user = useSelector((state: { user: UserState }) => state.user);
  const stats = redeemData?.stats;

  // Certificate payment hook
  const { paymentState: assessmentPaymentState, initiateAssessmentPayment } =
    useAssessmentPayment({
      onSuccess: (result: PaymentResult) => {
        //console.log("Certificate payment successful:", result);
        setPaymentResult({
          paymentId: result.paymentId,
          orderId: result.orderId,
          amount: result.amount,
        });
        setShowSuccessModal(true);
        showToast(
          "success",
          "Payment Successful!",
          "Your certificate payment is complete. You can now download your certificate."
        );

        // Invalidate and refetch the assessment results query to get updated payment status
        queryClient.invalidateQueries({
          queryKey: ["assessment-results", clientId, currentAssessmentId],
        });

        // Also refetch after a short delay to ensure backend processing is complete
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["assessment-results", clientId, currentAssessmentId],
          });
        }, 2000);
      },
      onError: (error: string) => {
        //console.error("Certificate payment failed:", error);
        showToast("error", "Payment Failed", error);
      },
      onDismiss: () => {
        //console.log("Certificate payment dismissed");
        showToast(
          "warning",
          "Payment Cancelled",
          "Payment was cancelled. You can try again anytime."
        );
      },
    });

  // Certificate data for the assessment
  const certificateData = {
    ...certificateFallbackData,
    studentName: user?.full_name || certificateFallbackData.studentName,
    studentEmail: user?.email || certificateFallbackData.studentEmail,
    score: stats?.accuracy_percent || certificateFallbackData.score,
  };

  // Transform data using utilities
  const perfReportData = transformToPerformanceReportData(stats);
  const accuracyBarData = transformToAccuracyBarData(stats);
  const ratingBarData = transformToRatingBarData(stats);
  const { shineSkills, attentionSkills } = transformToSkillsData(stats);
  const mentorFeedback = getMentorFeedback(stats);
  const { score, max } = getScoreArcData(stats);

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

  return (
    <div className="mb-8 sm:mb-12 lg:mb-30">
      {/* Header */}
      <div className="flex flex-row items-center justify-center relative z-10 mb-6 sm:mb-8 lg:mb-10">
        {/* <img
          src={ailincimg}
          alt="Ai Linc"
          className="w-6 h-6 sm:w-8 sm:h-8 mr-2"
        /> */}
        {/* <p className="font-bold text-center text-[#264D64] text-lg sm:text-xl lg:text-2xl">
          Ai Linc
        </p> */}
      </div>

      {/* Main Container */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl pb-6 sm:pb-8 lg:pb-10 px-3 sm:px-4 overflow-hidden border border-gray-200 shadow-xl lg:mx-15">
        {/* Top Section with Poppers */}
        <div className="bg-gradient-to-r from-white via-green-100 to-white pb-6 sm:pb-8 lg:pb-10">
          {/* Poppers - Hidden on mobile, visible on larger screens */}
          <img
            src={popper}
            alt="Confetti Left"
            className="hidden lg:block absolute -top-14 left-35 w-52 h-52 object-contain pointer-events-none select-none transform -rotate-42"
            style={{ zIndex: 1 }}
          />
          <img
            src={popper}
            alt="Confetti Right"
            className="hidden lg:block absolute -top-10 right-30 w-52 h-52 object-contain pointer-events-none select-none transform rotate-32"
            style={{ zIndex: 1 }}
          />

          {/* Mobile Poppers - Smaller and positioned differently */}
          <img
            src={popper}
            alt="Confetti Left Mobile"
            className="lg:hidden absolute -top-8 left-4 w-24 h-24 sm:w-32 sm:h-32 object-contain pointer-events-none select-none transform -rotate-42 opacity-60"
            style={{ zIndex: 1 }}
          />
          <img
            src={popper}
            alt="Confetti Right Mobile"
            className="lg:hidden absolute -top-6 right-4 w-24 h-24 sm:w-32 sm:h-32 object-contain pointer-events-none select-none transform rotate-32 opacity-60"
            style={{ zIndex: 1 }}
          />

          {/* Content */}
          <div className="flex flex-col items-center justify-center relative z-10 px-2 sm:px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#264D64] mb-2 mt-6 sm:mt-8 lg:mt-10 font-serif text-center">
              Congratulations
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-black text-center max-w-md mb-4 sm:mb-6 font-sans px-2">
              Your performance in the assessment has qualified you for an
              exclusive opportunity.
            </p>
            {redeemData?.is_paid && redeemData?.txn_status !== "paid" ? (
              <div className="flex flex-col items-center justify-center">
                <button
                  onClick={handleCertificatePayment}
                  disabled={assessmentPaymentState.isProcessing}
                  className={`flex items-center gap-2 font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow transition-colors duration-200 focus:outline-none text-sm sm:text-base ${assessmentPaymentState.isProcessing
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-[#14212B] text-white hover:bg-[#223344]"
                    }`}
                >
                  {assessmentPaymentState.isProcessing ? "Processing Payment..." : " Download Certificate"}
                </button>
                <span className="text-sm text-gray-500 italic text-center max-w-md font-sans px-2 mt-2">
                  (You'll be required to pay Rs {redeemData?.assessment_price || 49}/- for the certificate)
                </span>
                {/* Scholarship Countdown Section */}

              </div>
            ) : (
              <button
                onClick={handleDownloadCertificate}
                className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow hover:bg-green-700 transition-colors duration-200 focus:outline-none text-sm sm:text-base"
              >
                {isDownloading ? "Downloading..." : "Download Certificate"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 sm:w-5 sm:h-5 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)] shadow-gray-300 border border-gray-300 ring-1 ring-white/40 py-4 sm:py-5 w-full mx-auto">
          {/* Performance Report Section */}
          <PerformanceReport
            data={perfReportData}
            redeemData={redeemData as ScholarshipRedemptionData}
            clientId={clientId}
            assessmentId={currentAssessmentId || ''}
          />
          {/* <div className="w-full bg-yellow-50 border-r-4 border-yellow-500 p-4 mt-4 rounded-r-lg shadow-md">
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">
                    Scholarship Offer
                  </h3>
                  <div className="flex items-center space-x-1 mt-1">
                 
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                        {countdown.days}
                      </span>
                      <span className="text-[10px] text-yellow-600 mt-0.5">D</span>
                    </div>
                    <div className="text-sm font-bold text-yellow-700">:</div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                        {countdown.hours}
                      </span>
                      <span className="text-[10px] text-yellow-600 mt-0.5">H</span>
                    </div>
                    <div className="text-sm font-bold text-yellow-700">:</div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                        {countdown.minutes}
                      </span>
                      <span className="text-[10px] text-yellow-600 mt-0.5">M</span>
                    </div>
                    <div className="text-sm font-bold text-yellow-700">:</div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-yellow-700 bg-white rounded-lg px-2 py-0.5 shadow-md">
                        {countdown.seconds}
                      </span>
                      <span className="text-[10px] text-yellow-600 mt-0.5">S</span>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Hurry! Claim your scholarship
                  </p>
                </div>
              </div>
            </div>
            {timeRemaining === 'Scholarship Expired' && (
              <div className="mt-1 text-red-600 font-medium text-xs">
                Scholarship offer has expired
              </div>
            )}
          </div> */}

          <div className="flex flex-col lg:flex-row mt-6 sm:mt-8 lg:mt-10 w-full min-h-[200px] sm:min-h-[222px] justify-evenly items-center gap-4 sm:gap-6 lg:gap-2 px-3">
            <AccuracyBarChart data={accuracyBarData} />
            <ScoreArc score={score} max={max} />
            <RatingBars data={ratingBarData} />
          </div>


          {/* Divider */}
          <div className="border-t border-gray-300 my-6 sm:my-8 lg:my-10 mx-4 sm:mx-6 lg:mx-7"></div>

          {/* Skills Section */}
          <SkillsSection
            shineSkills={shineSkills}
            attentionSkills={attentionSkills}
          />

          {/* Divider */}
          <div className="border-t border-gray-300 my-6 sm:my-8 lg:my-10 mx-4 sm:mx-6 lg:mx-7"></div>

          {/* Mentor Feedback Section */}
          <MentorFeedbackSection
            didWell={mentorFeedback.didWell}
            couldDoBetter={mentorFeedback.couldDoBetter}
            suggestions={mentorFeedback.suggestions}
          />

          {/* Divider */}
          <div className="border-t border-gray-300 mt-6 sm:mt-8 lg:mt-10 mx-4 sm:mx-6 lg:mx-7"></div>

          {/* Growth Roadmap */}
          <h2 className="text-xl sm:text-2xl font-bold text-[#222] mx-4 sm:mx-6 lg:mx-10 my-6 sm:my-8 lg:my-10">
            Growth Roadmap
          </h2>
          <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 lg:mb-10 w-full px-2 sm:px-4">
            <img
              src={roadmap}
              alt="Roadmap"
              className="w-full sm:w-[90%] lg:w-[75%] max-w-5xl h-auto"
            />
          </div>
        </div>

        {/* Upskilling Roadmap Section */}
        <UpskillingRoadmapSection />

        {/* Nanodegree Program Card */}
        <ProgramCard
          redeemData={redeemData as ScholarshipRedemptionData}
          clientId={clientId}
          assessmentId={assessmentId ?? "ai-linc-scholarship-test-2"}
        />
      </div>

      {/* Hidden Certificate Component */}
      <div className="hidden">
        <CertificateTemplates
          ref={certificateRef}
          certificate={certificateData}
        />
      </div>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
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
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        paymentId={paymentResult?.paymentId}
        orderId={paymentResult?.orderId}
        amount={paymentResult?.amount || 0}
        paymentType="assessment"
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
const UpskillingRoadmapSection: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fcfc] to-white mt-6 sm:mt-8 lg:mt-10 px-4 sm:px-6 lg:px-0">
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#264D64] text-center mb-3 sm:mb-4 leading-tight px-2">
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
