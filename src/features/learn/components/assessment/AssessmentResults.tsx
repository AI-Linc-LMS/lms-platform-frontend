import React, { useState } from "react";
import PaymentModal from "./PaymentModal";

interface AssessmentResultsProps {
  score: number;
  scholarshipPercentage: number;
  clientId?: number;
  assessmentId?: string | number;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  score,
  scholarshipPercentage,
  clientId = 1, // Default fallback
  assessmentId = "ai-linc-scholarship-test", // Default fallback - string slug for API
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleRedeemNow = () => {
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

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
                    {score}
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl text-[#255C79] ml-2">
                    /30
                  </span>
                </div>
                {score < 50 && (
                  <div className="flex items-center gap-2 text-[#255C79]">
                    <span className="text-xl sm:text-2xl">🎉</span>
                    <p className="text-base sm:text-lg font-medium">
                      Excellent your assessment is completed!{" "}
                      <span className="font-bold">Congratulations!</span>
                    </p>
                  </div>
                )}
                {score >= 50 && (
                  <div className="flex items-center gap-2 text-[#255C79]">
                    <span className="text-xl sm:text-2xl">⭐</span>
                    <p className="text-base sm:text-lg font-medium">
                      Outstanding! You aced it with top marks! 💯🎉
                    </p>
                  </div>
                )}
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
                    Hey, You are eligible for a
                  </p>
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2">
                    {scholarshipPercentage}%
                  </div>
                  <div className="text-lg sm:text-xl font-semibold">
                    Scholarship
                  </div>
                </div>
                <button
                  onClick={handleRedeemNow}
                  className="w-full bg-white text-[#255C79] py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Redeem Now
                </button>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full -translate-y-6 sm:-translate-y-12 translate-x-6 sm:translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full translate-y-8 sm:translate-y-16 -translate-x-8 sm:-translate-x-16"></div>
            </div>
          </div>
          {/* Bottom notification */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              Need time to decide ? Don't worry, you can redeem later as well
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        clientId={clientId}
        assessmentId={assessmentId}
      />
    </>
  );
};

export default AssessmentResults; 