import React from "react";
import { useAssessment } from "../hooks/useAssessment";
import {
  AssessmentHeader,
  QuestionNavigation,
  QuestionDisplay,
  NavigationButtons,
  AssessmentResults,
} from "../components/assessment";

const ShortAssessment: React.FC = () => {
  const {
    // State
    currentQuestionIndex,
    selectedOption,
    timeRemaining,
    isCompleted,
    questionsData,
    assessmentResult,
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
  } = useAssessment();

  const currentQuestion = questionsData[currentQuestionIndex];

  if (questionsLoading) {
    return <div>Loading questions...</div>;
  }

  if (questionsError) {
    return <div>Error loading questions: {questionsError.message}</div>;
  }

  // Assessment completed section
  if (isCompleted) {
    const score = questions?.score || assessmentResult.score;
    const scholarshipPercentage =
      questions?.offered_scholarship_percentage ||
      assessmentResult.offered_scholarship_percentage;

    return (
      <AssessmentResults
        score={score}
        scholarshipPercentage={scholarshipPercentage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AssessmentHeader timeRemaining={timeRemaining} />

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
              totalQuestions={questionsData.length}
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
