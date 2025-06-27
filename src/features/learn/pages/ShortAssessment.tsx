import React, { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAssessment } from "../hooks/useAssessment";
import {
  AssessmentHeader,
  QuestionNavigation,
  QuestionDisplay,
  NavigationButtons,
  AssessmentResults,
} from "../components/assessment";

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
    questions,
    questionsLoading,
    questionsError,

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
    const clientId = parseInt(import.meta.env.VITE_CLIENT_ID) || 1;
    const assessmentSlug = questions?.slug || currentAssessmentId; // Use slug from questions or current assessment ID

    return (
      <AssessmentResults clientId={clientId} assessmentId={assessmentSlug} />
    );
  }

  // Early return if no assessment ID - component will redirect
  if (!currentAssessmentId) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#255C79]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AssessmentHeader 
          timeRemaining={timeRemaining} 
          assessmentId={currentAssessmentId}
        />

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left Sidebar - Question Navigation */}
          <QuestionNavigation
            questionsData={questionsData}
            navigateToQuestion={navigateToQuestion}
            getQuestionButtonStyle={getQuestionButtonStyle}
            getAnsweredCount={getAnsweredCount}
            getRemainingCount={getRemainingCount}
          />

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <QuestionDisplay
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questionsData.length}
              selectedOption={selectedOption}
              handleOptionSelect={handleOptionSelect}
            />

            {/* Navigation Buttons */}
            <NavigationButtons
              currentQuestionIndex={currentQuestionIndex}
              selectedOption={selectedOption}
              handleBack={handleBack}
              handleNext={handleNext}
              handleFinishAssessment={handleFinishAssessment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortAssessment;
