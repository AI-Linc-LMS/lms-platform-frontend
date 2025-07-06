import React, { useState } from "react";
import FinishAssessmentModal from "./FinishAssessmentModal";

interface NavigationButtonsProps {
  currentQuestionIndex: number;
  handleBack: () => void;
  handleNext: () => void;
  handleFinishAssessment: () => void;
  answeredCount: number;
  totalQuestions: number;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentQuestionIndex,
  handleBack,
  handleNext,
  handleFinishAssessment,
  answeredCount,
  totalQuestions,
}) => {
  const [showFinishModal, setShowFinishModal] = useState(false);

  const handleFinishClick = () => {
    setShowFinishModal(true);
  };

  const handleConfirmFinish = () => {
    setShowFinishModal(false);
    handleFinishAssessment();
  };

  const handleCloseModal = () => {
    setShowFinishModal(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-200 gap-2 sm:gap-0">
        <button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className={`w-full sm:w-auto px-4 py-2 rounded-md font-medium transition ${
            currentQuestionIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border border-[#255C79] text-[#255C79] hover:bg-blue-50"
          }`}
        >
          Previous
        </button>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleNext}
            className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition ${"bg-[#255C79] text-white hover:bg-[#1a4a5f]"}`}
          >
            Next
          </button>
          <button
            onClick={handleFinishClick}
            className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition ${"bg-green-600 text-white hover:bg-green-700"}`}
          >
            Finish Assessment
          </button>
        </div>
      </div>

      <FinishAssessmentModal
        isOpen={showFinishModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmFinish}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
      />
    </>
  );
};

export default NavigationButtons;
