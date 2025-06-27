import React, { useState } from "react";
import { FiCheck, FiShoppingCart, FiX } from "react-icons/fi";
import PaymentModal from "./PaymentModal";
import { redeemScholarship } from "../../../../services/assesment/assesmentApis";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface AssessmentResultsProps {
  clientId?: number;
  assessmentId?: string;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  clientId = 1, // Default fallback
  assessmentId = "ai-linc-scholarship-test", // Default fallback - string slug for API
}) => {
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: redeemData, isLoading, error } = useQuery({
    queryKey: ["assessment-results", clientId, assessmentId],
    queryFn: () => redeemScholarship(clientId, assessmentId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    enabled: !!clientId && !!assessmentId,
  });

  const onCloseErrorModal = () => {
    navigate("/courses");
  }

  // Check if already purchased based on backend data
  // Note: txn_status "VERIFIED" means scholarship calculation is verified, NOT that payment is completed
  // We need to check for actual payment completion status
  // For now, we'll be conservative and assume not purchased unless explicitly confirmed
  const isPurchased = redeemData?.txn_status === "PAID" || redeemData?.txn_status === "COMPLETED";
  
  // TODO: Backend should provide a clear field like 'is_course_purchased' or 'payment_completed'
  // Currently txn_status "VERIFIED" only means scholarship eligibility is verified

  const handleRedeemNow = () => {
    if (!isPurchased) {
      setIsPaymentModalOpen(true);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    // Close modal and refetch data to get updated status from backend
    setIsPaymentModalOpen(false);
    // The useQuery will automatically refetch and update the purchase status
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  }
  if (error && !isPaymentModalOpen) {
    return (
      <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <FiX className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading submission
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load submission information. Please try again.
            </p>
            <button
              onClick={onCloseErrorModal}
              className="bg-[#255C79] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a61] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Left Panel - Score Display */}
            <div className="flex-1 bg-gradient-to-br from-[#B8E6F0] to-[#E0F4F8] rounded-2xl p-6 sm:p-8 relative overflow-hidden mb-4 md:mb-0">
              <div className="relative z-10">
                <p className="text-[#255C79] text-base sm:text-lg mb-2">
                  You have scored
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#255C79]">
                    {redeemData?.score}
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl text-[#255C79] ml-2">
                    /30
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-[#255C79]">
                  <span className="text-xl sm:text-2xl font-bold">Great effort! 🎉</span>
                  <p className="text-base sm:text-lg font-medium">
                    Based on your score, our hiring or counseling team will get in touch with you
                  </p>
                </div>

              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -translate-y-8 sm:-translate-y-16 translate-x-8 sm:translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full translate-y-6 sm:translate-y-12 -translate-x-6 sm:-translate-x-12"></div>
            </div>
            {/* Right Panel - Scholarship Eligibility */}
            <div className="w-full md:w-80 bg-gradient-to-br from-[#255C79] to-[#1a4a5f] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl sm:text-2xl">👋</span>
                  <p className="text-base sm:text-lg">
                    {isPurchased ? "Congratulations! You have" : "Hey, You are eligible for a"}
                  </p>
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2">
                    {redeemData?.percentage_scholarship ?? 15}%
                  </div>
                  <div className="text-lg sm:text-xl font-semibold">
                    {"Scholarship"}
                  </div>
                </div>

                {isPurchased ? (
                  <div className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-default shadow-lg">
                    <FiCheck className="h-5 w-5" />
                    <span>Purchased</span>
                  </div>
                ) : (
                  <button
                    onClick={handleRedeemNow}
                    className="w-full bg-white text-[#255C79] py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <FiShoppingCart className="h-5 w-5" />
                    <span>Redeem Now</span>
                  </button>
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full -translate-y-6 sm:-translate-y-12 translate-x-6 sm:translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full translate-y-8 sm:translate-y-16 -translate-x-8 sm:-translate-x-16"></div>
            </div>
          </div>
          {/* Bottom notification */}
          <div className="mt-6 sm:mt-8 text-center">
            {isPurchased ? (
              <p className="text-green-600 text-xs sm:text-sm font-medium">
                🎉 Congratulations! Your course access will be activated within 7 days.
              </p>
            ) : (
              <p className="text-gray-600 text-xs sm:text-sm">
                Need time to decide ? Don't worry, you can redeem later as well
              </p>
            )}
            <p className="text-gray-600 text-xs sm:text-sm mt-2">
              To know about the placement program vist: <a href="https://ailinc.com/" className="underline">www.ailinc.com</a>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        clientId={clientId}
        onPaymentSuccess={handlePaymentSuccess}
        purchasedData={redeemData}
      />
    </>
  );
};

export default AssessmentResults; 