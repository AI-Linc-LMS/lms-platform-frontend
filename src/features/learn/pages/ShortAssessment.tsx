import React, { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAssessment } from "../hooks/useAssessment";
import {
  AssessmentHeader,
  QuestionNavigation,
  QuestionDisplay,
  NavigationButtons,
} from "../components/assessment";
import ReferralCodeDisplay from "../components/assessment/ReferralCodeDisplay";

const ShortAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get assessment ID from URL params or location state
  const currentAssessmentId = assessmentId || location.state?.assessmentId;

  // Redirect to assessments list if no assessment ID is provided
  useEffect(() => {
    if (!currentAssessmentId) {
      navigate("/assessments");
      return;
    }
  }, [currentAssessmentId, navigate]);

  const {
    // State
    currentQuestionIndex,
    selectedOption,
    timeRemaining,
    isCompleted,
    questionsData,
    questionsLoading,
    questionsError,
    referralCode,

    // Actions
    handleOptionSelect,
    handleNext,
    handleBack,
    navigateToQuestion,
    handleFinishAssessment,

    // Utilities
    getQuestionButtonStyle,
    getAnsweredCount,
    getRemainingCount,
  } = useAssessment(currentAssessmentId);

  const currentQuestion = questionsData[currentQuestionIndex];

  if (questionsLoading) {
    return <div>Loading questions...</div>;
  }

  if (questionsError) {
    return <div>Error loading questions: {questionsError.message}</div>;
  }

  // Assessment completed section
  if (isCompleted) {
    navigate(`/roadmap/${currentAssessmentId}`);
  }

  // Early return if no assessment ID - component will redirect
  if (!currentAssessmentId) {
    return (
      <div className="min-h-screen bg-[var(--netural-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--default-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--netural-50)] p-4">
      <div className="max-w-7xl mx-auto">
        <AssessmentHeader
          timeRemaining={timeRemaining}
          assessmentId={currentAssessmentId}
        />

        {/* Display referral code if present */}
        <ReferralCodeDisplay referralCode={referralCode} className="mb-4" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <QuestionNavigation
              questionsData={questionsData}
              getQuestionButtonStyle={getQuestionButtonStyle}
              navigateToQuestion={navigateToQuestion}
              getAnsweredCount={getAnsweredCount}
              getRemainingCount={getRemainingCount}
            />
          </div>

          <div className="lg:col-span-3">
            <QuestionDisplay
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questionsData.length}
              selectedOption={selectedOption}
              handleOptionSelect={handleOptionSelect}
            />

            <NavigationButtons
              currentQuestionIndex={currentQuestionIndex}
              handleBack={handleBack}
              handleNext={handleNext}
              handleFinishAssessment={handleFinishAssessment}
              answeredCount={getAnsweredCount()}
              totalQuestions={questionsData.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortAssessment;
