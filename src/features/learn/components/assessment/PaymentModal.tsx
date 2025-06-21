import React from "react";
import { FiX, FiCheck, FiShield, FiClock, FiUsers, FiAward } from "react-icons/fi";
import { usePayment } from "../../hooks/usePayment";
import { useScholarshipRedemption } from "../../hooks/useScholarshipRedemption";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  assessmentId: string | number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  clientId,
  assessmentId,
}) => {
  const { isProcessing, processPayment } = usePayment();
  
  // Convert values to strings for API call
  const clientIdString = clientId.toString();
  const assessmentIdString = typeof assessmentId === 'number' ? assessmentId.toString() : assessmentId;
  
  // Fetch actual scholarship redemption data from API
  const { 
    data: scholarshipData, 
    isLoading: isLoadingScholarship, 
    error: scholarshipError 
  } = useScholarshipRedemption(clientIdString, assessmentIdString, isOpen);

  const [selectedPlan, setSelectedPlan] = React.useState<"monthly" | "yearly">("yearly");

  if (!isOpen) return null;

  // Show loading state while fetching data
  if (isLoadingScholarship) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#255C79] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if API call fails
  if (scholarshipError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <FiX className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Payment Details
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load payment information. Please try again.
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
  const payableAmount = scholarshipData?.payable_amount || 6000;
  const scholarshipPercentage = scholarshipData?.percentage_scholarship || 40;
  const currency = "₹";

  // Calculate prices based on payable amount
  const monthlyPrice = payableAmount;
  const yearlyPrice = Math.round(payableAmount * 10); // Yearly is typically 10x monthly with discount
  const monthlyOriginalPrice = Math.round(monthlyPrice / (1 - scholarshipPercentage / 100));
  const yearlyOriginalPrice = Math.round(yearlyPrice / (1 - scholarshipPercentage / 100));

  const currentPrice = selectedPlan === "monthly" ? monthlyPrice : yearlyPrice;
  const currentOriginalPrice = selectedPlan === "monthly" ? monthlyOriginalPrice : yearlyOriginalPrice;

  const handlePayment = async () => {
    const paymentData = {
      plan: selectedPlan,
      amount: currentPrice,
      scholarshipPercentage,
      originalPrice: currentOriginalPrice,
      clientId,
      assessmentId: assessmentIdString,
    };

    try {
      const result = await processPayment(paymentData);
      if (result.success) {
        alert("Payment successful! You now have access to the course.");
        onClose();
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Unlock Your Course Access
            </h2>
            <p className="text-gray-600 mt-1">
              Choose your preferred plan and start learning today
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
                You've earned a {scholarshipPercentage}% discount based on your assessment performance
              </p>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Monthly Plan */}
            <div
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === "monthly"
                  ? "border-[#255C79] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Monthly Plan</h3>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedPlan === "monthly"
                      ? "border-[#255C79] bg-[#255C79]"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPlan === "monthly" && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {currency}{monthlyPrice.toLocaleString()}
                <span className="text-lg font-normal text-gray-500 ml-2">
                  /month
                </span>
              </div>
              <div className="text-sm text-gray-500 line-through mb-3">
                Original: {currency}{monthlyOriginalPrice.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 font-medium">
                Save {currency}{(monthlyOriginalPrice - monthlyPrice).toLocaleString()} with scholarship
              </div>
            </div>

            {/* Yearly Plan */}
            <div
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all relative ${
                selectedPlan === "yearly"
                  ? "border-[#255C79] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedPlan("yearly")}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#255C79] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Best Value
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Yearly Plan</h3>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedPlan === "yearly"
                      ? "border-[#255C79] bg-[#255C79]"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPlan === "yearly" && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {currency}{yearlyPrice.toLocaleString()}
                <span className="text-lg font-normal text-gray-500 ml-2">
                  /year
                </span>
              </div>
              <div className="text-sm text-gray-500 line-through mb-3">
                Original: {currency}{yearlyOriginalPrice.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 font-medium">
                Save {currency}{(yearlyOriginalPrice - yearlyPrice).toLocaleString()} total
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              What's included:
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

          {/* Security & Support Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
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
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Maybe Later
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1e4a61] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Pay ${currency}${currentPrice.toLocaleString()} Now`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 