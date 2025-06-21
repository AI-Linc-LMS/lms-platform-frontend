import React, { useState } from "react";
import {
  FiX,
  FiCheck,
  FiShield,
  FiClock,
  FiUsers,
  FiAward,
} from "react-icons/fi";
import { useScholarshipRedemption } from "../../hooks/useScholarshipRedemption";
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentProcessingModal from "./PaymentProcessingModal";
import PaymentToast from "./PaymentToast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  assessmentId: string | number;
  onPaymentSuccess?: () => void;
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

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  clientId,
  assessmentId,
  onPaymentSuccess,
}) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStep, setProcessingStep] = useState<'creating' | 'processing' | 'verifying' | 'complete'>('creating');
  const [paymentResult, setPaymentResult] = useState<{
    paymentId?: string;
    orderId?: string;
    amount: number;
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'loading';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showToast = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string) => {
    setToast({ show: true, type, title, message });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    try {
      setShowProcessingModal(true);
      setProcessingStep('creating');
      showToast('loading', 'Initializing Payment', 'Setting up secure payment gateway...');

      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // 1. Create order from backend
      const createOrderResponse = await fetch(
        "https://be-app.ailinc.com/payment-gateway/api/clients/1/create-order/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            amount: coursePrice,
            client_id: clientId,
          }),
        }
      );

      const orderData = await createOrderResponse.json();

      if (!orderData.order_id) {
        throw new Error("Failed to create payment order. Please try again.");
      }

      setProcessingStep('processing');
      hideToast();

      // 2. Launch Razorpay
      const options: RazorpayOptions = {
        key: orderData.key,
        amount: coursePrice,
        currency: orderData.currency,
        name: "AI-LINC Platform",
        description: "Course Access Payment",
        order_id: orderData.order_id,
        handler: async function (response: RazorpayResponse) {
          try {
            setProcessingStep('verifying');
            showToast('loading', 'Verifying Payment', 'Confirming transaction security...');
            
            // 3. Verify signature
            const verifyRes = await fetch("https://be-app.ailinc.com/payment-gateway/api/clients/1/verify-payment/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token"),
              },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              setProcessingStep('complete');
              hideToast();
              showToast('success', 'Payment Successful!', 'Your payment has been verified and processed.');
              
              // Set payment result for success modal
              setPaymentResult({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: coursePrice,
              });

              // Wait a moment to show completion, then show success modal
              setTimeout(() => {
                setShowProcessingModal(false);
                setShowSuccessModal(true);
                hideToast();
              }, 2000);

              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            setShowProcessingModal(false);
            hideToast();
            console.error("Payment verification error:", error);
            showToast('error', 'Verification Failed', 'Payment verification failed. Please contact support if amount was debited.');
          }
        },
        modal: {
          ondismiss: function() {
            setShowProcessingModal(false);
            hideToast();
            showToast('warning', 'Payment Cancelled', 'Payment process was cancelled by user.');
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
        },
        theme: {
          color: "#255C79",
        },
      };

      // Type assertion to handle Razorpay on window object
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setShowProcessingModal(false);
      hideToast();
      console.error("Payment error:", error);
      showToast('error', 'Payment Failed', (error as Error).message);
    }
  };

  // Convert values to strings for API call
  const clientIdString = clientId.toString();
  const assessmentIdString =
    typeof assessmentId === "number" ? assessmentId.toString() : assessmentId;

  // Fetch actual scholarship redemption data from API
  const {
    data: scholarshipData,

    error: scholarshipError,
  } = useScholarshipRedemption(clientIdString, assessmentIdString, isOpen);

  // Show error state if API call fails
  if (scholarshipError && !showSuccessModal) {
    return (
      <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <FiX className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Course Details
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load course information. Please try again.
            </p>
            <button
              onClick={onClose}
              className="bg-[#255C79] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a61] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use API data if available, otherwise fallback to default values
  const coursePrice = scholarshipData?.payable_amount || 6000;
  const scholarshipPercentage = scholarshipData?.percentage_scholarship || 15;
  const currency = "₹";

  // Use total_amount from API as the original price
  const originalPrice = scholarshipData?.total_amount || 100000;

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
              <div className="border-2 border-[#255C79] bg-blue-50 rounded-lg p-6 mb-6">
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
                  className="flex-1 px-6 py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1e4a61] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>
                      Payment Processing...
                    </span>
                  </div>

                   {currency}{coursePrice.toLocaleString()} 

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
