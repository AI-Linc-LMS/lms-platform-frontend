import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  FiX,
  FiCheck,
  FiShield,
  FiClock,
  FiUsers,
  FiAward,
} from "react-icons/fi";
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentProcessingModal from "./PaymentProcessingModal";
import PaymentToast from "./PaymentToast";
import {
  createOrder,
  verifyPayment,
  VerifyPaymentRequest,
} from "../../../../services/payment/paymentGatewayApis";
import { PaymentType } from "../../../../services/payment/razorpayService";

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  onPaymentSuccess?: () => void;
  purchasedData: PurchasedData;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

interface PurchasedData {
  percentage_scholarship: number;
  total_amount: number;
  payable_amount: number;
}

interface UserState {
  email: string | null;
  full_name: string | null;
  isAuthenticated: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onPaymentSuccess,
  purchasedData,
}) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "creating" | "processing" | "verifying" | "complete"
  >("creating");
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

  // Get user data from Redux store
  const user = useSelector((state: { user: UserState }) => state.user);

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

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve, reject) => {
      try {
        // Check if Razorpay is already loaded
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () =>
          reject(new Error("Failed to load Razorpay script"));
        document.body.appendChild(script);
      } catch {
        reject(new Error("Failed to initialize Razorpay script"));
      }
    });

  const handlePayment = async () => {
    try {
      // Validate input parameters
      if (!clientId || clientId <= 0) {
        throw new Error("Invalid client ID provided");
      }

      if (!coursePrice || coursePrice <= 0) {
        throw new Error("Invalid course price provided");
      }

      setShowProcessingModal(true);
      setProcessingStep("creating");
      showToast(
        "loading",
        "Initializing Payment",
        "Setting up secure payment gateway..."
      );

      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection."
        );
      }

      // 1. Create order from backend - IMPORTANT: Specify COURSE payment type
      const orderData = await createOrder(
        clientId,
        coursePrice,
        PaymentType.COURSE, // Explicitly specify this is a COURSE payment
        {
          courseAccess: true,
          scholarshipPercentage: scholarshipPercentage,
        }
      );

      if (!orderData || !orderData.order_id || !orderData.key) {
        throw new Error(
          "Failed to create payment order. Invalid response from server."
        );
      }

      setProcessingStep("processing");
      hideToast();

      // 2. Launch Razorpay
      const options: RazorpayOptions = {
        key: orderData.key,
        amount: coursePrice,
        currency: orderData.currency || "INR",
        name: "AI-LINC Platform",
        description: "Course Access Payment",
        order_id: orderData.order_id,
        handler: async function (response: RazorpayResponse) {
          try {
            // Validate Razorpay response
            if (
              !response.razorpay_order_id ||
              !response.razorpay_payment_id ||
              !response.razorpay_signature
            ) {
              throw new Error(
                "Invalid payment response received from Razorpay"
              );
            }

            setProcessingStep("verifying");
            showToast(
              "loading",
              "Verifying Payment",
              "Confirming transaction security..."
            );

            const paymentResult: VerifyPaymentRequest = {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };

            // 3. Verify signature
            const verifyRes = await verifyPayment(clientId, paymentResult);

            // Check if verification was successful based on the response message
            if (verifyRes.status === 200) {
              setProcessingStep("complete");
              hideToast();
              showToast(
                "success",
                "Payment Successful!",
                "Your payment has been verified and processed."
              );

              // Set payment result for success modal
              setPaymentResult({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: coursePrice,
              });

              // Wait a moment to show completion, then show success modal
              setTimeout(() => {
                try {
                  setShowProcessingModal(false);
                  setShowSuccessModal(true);
                  hideToast();
                } catch (error) {
                  //console.error("Error showing success modal:", error);
                  setShowProcessingModal(false);
                  hideToast();
                }
              }, 2000);

              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            }
          } catch (error) {
            setShowProcessingModal(false);
            hideToast();
            //console.error("Payment verification error:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Payment verification failed";
            showToast(
              "error",
              "Verification Failed",
              `Payment verification failed: ${errorMessage}. Please contact support if amount was debited.`
            );
          }
        },
        modal: {
          ondismiss: function () {
            try {
              setShowProcessingModal(false);
              hideToast();
              showToast(
                "warning",
                "Payment Cancelled",
                "Payment process was cancelled by user."
              );
            } catch (error) {
              //console.error("Error handling modal dismiss:", error);
              setShowProcessingModal(false);
              hideToast();
            }
          },
        },
        prefill: {
          name: user.full_name || "User",
          email: user.email || "",
        },
        theme: {
          color: "var(--default-primary)",
        },
      };

      // Type assertion to handle Razorpay on window object
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setShowProcessingModal(false);
      hideToast();
      //console.error("Payment error:", error);

      let errorMessage =
        "An unexpected error occurred during payment processing.";

      if (error instanceof Error) {
        if (error.message.includes("Failed to load Razorpay script")) {
          errorMessage =
            "Payment gateway failed to load. Please check your internet connection and try again.";
        } else if (error.message.includes("Failed to create payment order")) {
          errorMessage =
            "Unable to initialize payment. Please try again or contact support.";
        } else if (error.message.includes("Invalid payment response")) {
          errorMessage = "Payment response was invalid. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      showToast("error", "Payment Failed", errorMessage);
    }
  };

  // Use API data if available, otherwise fallback to default values
  const coursePrice = purchasedData?.payable_amount || 6000;
  const scholarshipPercentage = purchasedData?.percentage_scholarship || 15;
  const currency = "₹";

  // Use total_amount from API as the original price
  const originalPrice = purchasedData?.total_amount || 100000;

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setPaymentResult(null);
    onClose();
  };

  const features = [
    "Lifetime Access to Course Content",
    "Interactive Coding Exercises",
    "Certificate of Completion",
    "24/7 Community Support",
    "Regular Content Updates",
    "Mobile & Desktop Access",
  ];

  return (
    <>
      {/* Payment Modal */}
      {isOpen && !showSuccessModal && !showProcessingModal && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Get Lifetime Course Access
                </h2>
                <p className="text-gray-600 mt-1">
                  One-time payment for complete course access
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Scholarship Badge */}
            <div className="px-6 pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                <FiAward className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">
                    🎉 Scholarship Applied!
                  </h3>
                  <p className="text-green-700 text-sm">
                    You've earned a {scholarshipPercentage}% discount based on
                    your assessment performance
                  </p>
                </div>
              </div>
            </div>

            {/* Course Purchase Card */}
            <div className="p-6">
              <div className="border-2 border-[var(--default-primary)] bg-blue-50 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">
                    Complete Course Access
                  </h3>
                  <p className="text-gray-600 text-sm">
                    One-time purchase • Lifetime access
                  </p>
                </div>

                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {currency}
                    {coursePrice.toLocaleString()}
                    <span className="text-lg font-normal text-gray-500 ml-2">
                      one-time
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 line-through mb-2">
                    Original Price: {currency}
                    {originalPrice.toLocaleString()}
                  </div>
                  <div className="text-lg text-green-600 font-semibold">
                    You Save {currency}
                    {(originalPrice - coursePrice).toLocaleString()} with
                    scholarship!
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-center">
                    What you'll get:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security & Support Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FiShield className="h-4 w-4" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiClock className="h-4 w-4" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiUsers className="h-4 w-4" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 px-6 py-3 bg-[var(--default-primary)] text-white rounded-lg hover:bg-[#1e4a61] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currency}
                  {coursePrice.toLocaleString()}
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Secure payment via Razorpay • 30-day money-back guarantee • No
                  hidden fees
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      <PaymentProcessingModal
        isOpen={showProcessingModal}
        step={processingStep}
        onClose={() => {
          setShowProcessingModal(false);
          hideToast();
        }}
      />

      {/* Success Modal */}
      {paymentResult && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessModalClose}
          paymentId={paymentResult.paymentId}
          orderId={paymentResult.orderId}
          amount={paymentResult.amount}
        />
      )}

      {/* Toast Notification */}
      <PaymentToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={hideToast}
      />
    </>
  );
};

export default PaymentModal;
