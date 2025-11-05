// MockInterview.tsx (Updated Main Container)
import { useState } from "react";
import InterviewTypeSelector from "./components/InterviewTypeSelector";
import TopicDifficultySelector from "./components/TopicDifficultySelector";
import InterviewRoom from "./components/InterviewRoom";
import PreviousInterviewsList from "./components/PreviousInterviewsList";
import InterviewDetailView from "./components/InterviewDetailView";

type InterviewType = "fresh" | "continue";
type Step = 1 | 2 | 3 | 4 | 5;

export interface InterviewRecord {
  id: string;
  topic: string;
  difficulty: string;
  date: Date;
  duration: number;
  score: number;
  status: "completed" | "in-progress" | "abandoned";
  questionsAnswered: number;
  totalQuestions: number;
}

const MockInterview = () => {
  const [step, setStep] = useState<Step>(1);
  const [interviewType, setInterviewType] = useState<InterviewType | null>(
    null
  );
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | null>(
    null
  );

  const handleTypeSelect = (type: InterviewType) => {
    setInterviewType(type);
    if (type === "fresh") {
      setStep(2);
    } else {
      setStep(4); // Show previous interviews list
    }
  };

  const handleStartInterview = (topic: string, difficulty: string) => {
    setSelectedTopic(topic);
    setSelectedDifficulty(difficulty);
    setStep(3);
  };

  const handleViewRecord = (record: InterviewRecord) => {
    setSelectedRecord(record);
    setStep(5); // Show detail view
  };

  const handleBackFromList = () => {
    setStep(1);
    setInterviewType(null);
  };

  const handleBackFromDetail = () => {
    setStep(4);
    setSelectedRecord(null);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setInterviewType(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Choose your interview type to get started";
      case 2:
        return "Select topic and difficulty level";
      case 3:
        return "Interview in progress";
      case 4:
        return "Your previous interview sessions";
      case 5:
        return "Interview details and review";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Mock Interview Practice
          </h1>
          <p className="text-gray-600">{getStepTitle()}</p>
        </div>

        {/* Progress Indicator - Only show for fresh interview flow */}
        {interviewType === "fresh" && step <= 3 && (
          <div className="mb-8 flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Type
              </span>
            </div>
            <div
              className={`h-1 w-16 ${
                step >= 2 ? "bg-indigo-600" : "bg-gray-300"
              }`}
            ></div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= 2
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Setup
              </span>
            </div>
            <div
              className={`h-1 w-16 ${
                step >= 3 ? "bg-indigo-600" : "bg-gray-300"
              }`}
            ></div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= 3
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Interview
              </span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && <InterviewTypeSelector onSelect={handleTypeSelect} />}
          {step === 2 && (
            <TopicDifficultySelector
              interviewType={interviewType}
              onStart={handleStartInterview}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <InterviewRoom
              topic={selectedTopic!}
              difficulty={selectedDifficulty!}
              onBack={handleBack}
            />
          )}
          {step === 4 && (
            <PreviousInterviewsList
              onViewRecord={handleViewRecord}
              onBack={handleBackFromList}
            />
          )}
          {step === 5 && selectedRecord && (
            <InterviewDetailView
              record={selectedRecord}
              onBack={handleBackFromDetail}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
