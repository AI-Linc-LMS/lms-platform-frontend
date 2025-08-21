import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiArrowLeft, FiShield, FiCheck, FiClock, FiAward } from "react-icons/fi";
import { UserState } from "../components/assessment/types/assessmentTypes";
import { usePartialPayment } from "../../../hooks/useRazorpayPayment";
import { PaymentResult } from "../../../services/payment/razorpayService";
import PaymentProcessingModal from "../components/assessment/PaymentProcessingModal";
import PaymentSuccessModal from "../components/assessment/PaymentSuccessModal";
import PaymentToast from "../components/assessment/PaymentToast";
import { decodePaymentLink } from "../../../utils/paymentLinkUtils";

// Define program types
type ProgramType = "flagship-program" | "nanodegree-program";

interface ProgramConfig {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
  type_id: string;
}

const PartialPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: { user: UserState }) => state.user);
  
  // Get program type from URL path
  const programType = location.pathname.includes("flagship-program") 
    ? "flagship-program" 
    : location.pathname.includes("nanodegree-program") 
    ? "nanodegree-program" 
    : null;

  // Get client ID from environment variables
  const clientId = Number(import.meta.env.VITE_CLIENT_ID) || 1;

  // Get and decode payment data from URL
  const encodedData = searchParams.get("data");
  const decodedData = encodedData ? decodePaymentLink(encodedData) : null;
  const amount = decodedData?.amount || 0;

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

  // Program configurations
  const programConfigs: Record<ProgramType, ProgramConfig> = {
    "flagship-program": {
      title: "AI-LINC Flagship Career Launchpad",
      subtitle: "7-day full access trial – 100% Refund",
      description: "Premium program with MAANG mentorship and direct referrals. Complete our trial challenge for a full refund!",
      features: [
        "Join for ₹499 – Pay a small token amount for a 7-day full access trial.",
        "Complete the Challenge – Attend at least 50% of live classes and submit 1 small AI projects during the trial week.",
        "Share & Grow – Post your project results on LinkedIn/Instagram tagging Ai-linc. ",
        "Get a 100% Refund – Complete all challenge steps, and your ₹499 is refunded.",
        // "Share project on LinkedIn/Instagram tagging Ai-linc",
        // "Live sessions with MAANG experts",
        // "Direct referral to hiring partners",
        // "90-Day guided work with MAANG mentor",
        // "AI-powered resume & branding help",
        // "Portfolio building & mock interviews",
        // "Lifetime job portal access",
        // "Certificate + career readiness report",
      ],
      color: "#f59e0b",
      type_id: "flagship-course"
    },
    "nanodegree-program": {
      title: "AI-LINC Nanodegree Program",
      subtitle: "Career-Ready Training at Best Price",
      description: "Structured learning with real-world experience at your own pace",
      features: [
        "100+ hours of expert video content",
        "AI-graded assignments & quizzes",
        "21-day No-Code AI Product Builder",
        "90-Day Mentored Work Experience",
        "Weekly performance tracking",
        "Lifetime job portal access",
        "Certificate + career readiness report",
      ],
      color: "#2563eb",
      type_id: "nanodegree"
    },
  };

  // Validate encoded data and show appropriate errors
  useEffect(() => {
    if (!programType) {
      showToast("error", "Invalid Program", "Please select either flagship-program or nanodegree-program.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (!encodedData) {
      showToast("error", "Invalid Link", "This payment link appears to be invalid.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (!decodedData) {
      showToast("error", "Invalid or Expired Link", "This payment link is either invalid or has expired.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    // Validate program type matches the encoded data
    if (decodedData.programType !== programType) {
      showToast("error", "Invalid Program", "The program type in the URL does not match the payment link.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    if (amount <= 0) {
      showToast("error", "Invalid Amount", "The payment amount is invalid.");
      setTimeout(() => navigate("/"), 3000);
      return;
    }
  }, [programType, encodedData, decodedData, amount, navigate]);

  // Payment hook
  const { paymentState, initiatePartialPayment } = usePartialPayment({
    onSuccess: (result: PaymentResult) => {
      setPaymentResult({
        paymentId: result.paymentId,
        orderId: result.orderId,
        amount: result.amount,
      });
      setShowSuccessModal(true);
      showToast(
        "success",
        "Payment Successful!",
        `Your partial payment for ${programConfigs[decodedData?.programType as ProgramType]?.title} has been processed successfully.`
      );
    },
    onError: (error: string) => {
      showToast("error", "Payment Failed", error);
    },
    onDismiss: () => {
      showToast(
        "warning",
        "Payment Cancelled",
        "Payment was cancelled. You can try again anytime."
      );
    },
  });

  const handlePayment = () => {
    if (!clientId || !decodedData || !programType) {
      showToast("error", "Authentication Error", "Please log in to continue with payment.");
      return;
    }

    // Create payment configuration with correct payment_type and type_id
    const paymentConfig = {
      prefill: {
        name: user?.full_name || "User",
        email: user?.email || "",
      },
      metadata: {
        payment_type: "COURSE",
        type_id: programConfigs[decodedData.programType as ProgramType]?.type_id // This will be "flagship-course" or "nanodegree"
      }
    };

    initiatePartialPayment(clientId, amount, programConfigs[decodedData.programType as ProgramType]?.type_id, paymentConfig);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setPaymentResult(null);
    // Redirect to courses or dashboard after successful payment
    navigate("/courses");
  };

  // Update the error UI component
  if (!programType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Program</h2>
          <p className="text-gray-600 mb-4">Please select either flagship-program or nanodegree-program.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!encodedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Payment Link</h2>
          <p className="text-gray-600 mb-4">This payment link appears to be invalid.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!decodedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid or Expired Link</h2>
          <p className="text-gray-600 mb-4">This payment link is either invalid or has expired.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (amount <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Payment Amount</h2>
          <p className="text-gray-600 mb-4">The payment amount is invalid.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Program Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{programConfigs[decodedData.programType as ProgramType]?.title}</h1>
                <p className="text-blue-100 text-base sm:text-lg">{programConfigs[decodedData.programType as ProgramType]?.subtitle}</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-bold">₹{amount.toLocaleString()}</div>
                {/* <div className="text-blue-100">Partial Payment</div> */}
              </div>
            </div>
          </div>

          {/* Program Details */}
          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Left Column - Program Info */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Program Overview</h2>
                <p className="text-gray-600 mb-4 sm:mb-6">{programConfigs[decodedData.programType as ProgramType]?.description}</p>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">How it works:</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {programConfigs[decodedData.programType as ProgramType]?.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <FiCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column - Payment Info */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Program:</span>
                    <span className="font-medium">{programConfigs[decodedData.programType as ProgramType]?.title}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600"></span>
                    <span className="font-medium"></span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-semibold">
                    <span className="text-gray-900">Amount:</span>
                    <span className="text-gray-900">₹{amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4 sm:mb-6">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2">
                    <FiShield className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Secure payment powered by Razorpay
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2">
                    <FiClock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    7-day refund guarantee
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <FiAward className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Instant access after payment
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={paymentState.isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {paymentState.isProcessing ? "Processing..." : `Pay ₹${amount.toLocaleString()}`}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
                  By clicking "Pay", you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={paymentState.isProcessing}
        step={paymentState.step as "creating" | "processing" | "verifying" | "complete"}
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
        paymentType="course"
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

export default PartialPaymentPage; 