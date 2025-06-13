import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock assessment data - in a real app, this would come from an API
const mockAssessmentData = {
  title: "Short Assessment",
  instructions: "Solve real world questions and gain insight knowledge.",
  duration_in_minutes: 5,
  questions: [
    {
      id: 1,
      question_text: "What is machine learning?",
      difficulty_level: "Easy",
      options: [
        "A type of artificial intelligence that enables computers to learn without being explicitly programmed",
        "A programming language used for data analysis",
        "A database management system",
        "A web development framework"
      ],
      correct_option: "A",
      explanation: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed."
    },
    {
      id: 2,
      question_text: "Which of the following is a supervised learning algorithm?",
      difficulty_level: "Medium",
      options: [
        "K-means clustering",
        "Linear regression",
        "DBSCAN",
        "Principal Component Analysis"
      ],
      correct_option: "B",
      explanation: "Linear regression is a supervised learning algorithm used for predicting continuous values based on input features."
    },
    {
      id: 3,
      question_text: "What is the purpose of cross-validation in machine learning?",
      difficulty_level: "Medium",
      options: [
        "To increase the size of the dataset",
        "To evaluate model performance and prevent overfitting",
        "To clean the data",
        "To visualize the results"
      ],
      correct_option: "B",
      explanation: "Cross-validation is used to assess how well a model will generalize to an independent dataset and helps prevent overfitting."
    },
    {
      id: 4,
      question_text: "Which metric is commonly used for classification problems?",
      difficulty_level: "Easy",
      options: [
        "Mean Squared Error",
        "R-squared",
        "Accuracy",
        "Mean Absolute Error"
      ],
      correct_option: "C",
      explanation: "Accuracy is a common metric for classification problems, measuring the percentage of correct predictions."
    },
    {
      id: 5,
      question_text: "What is overfitting in machine learning?",
      difficulty_level: "Medium",
      options: [
        "When a model performs well on training data but poorly on new data",
        "When a model is too simple",
        "When there's not enough training data",
        "When the model takes too long to train"
      ],
      correct_option: "A",
      explanation: "Overfitting occurs when a model learns the training data too well, including noise, making it perform poorly on new, unseen data."
    },
    {
      id: 6,
      question_text: "Which of the following is an unsupervised learning technique?",
      difficulty_level: "Easy",
      options: [
        "Decision Trees",
        "Support Vector Machines",
        "K-means clustering",
        "Random Forest"
      ],
      correct_option: "C",
      explanation: "K-means clustering is an unsupervised learning technique used to group similar data points together without labeled examples."
    }
  ]
};

interface UserAnswer {
  questionId: number;
  questionIndex: number;
  selectedOption: string | null;
  isCorrect: boolean;
}

const ShortAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isCompleted, setIsCompleted] = useState(false);

  const optionLetters = ['A', 'B', 'C', 'D'];
  const questions = mockAssessmentData.questions;
  const currentQuestion = questions[currentQuestionIndex];

  // Initialize user answers
  useEffect(() => {
    setUserAnswers(
      questions.map((_, index) => ({
        questionId: questions[index].id,
        questionIndex: index,
        selectedOption: null,
        isCorrect: false,
      }))
    );
  }, []);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleFinishAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted]);

  // Set selected option based on current question's answer
  useEffect(() => {
    setSelectedOption(userAnswers[currentQuestionIndex]?.selectedOption || null);
  }, [currentQuestionIndex, userAnswers]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correct_option;
    
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = {
      ...updatedAnswers[currentQuestionIndex],
      selectedOption: option,
      isCorrect
    };
    setUserAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleFinishAssessment = () => {
    setIsCompleted(true);
    // Calculate score
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // In a real app, you would send results to the server here
    console.log(`Assessment completed: ${correctAnswers}/${totalQuestions} (${percentage}%)`);
    
    // Navigate back to courses with results after 5 seconds
    setTimeout(() => {
      navigate('/courses', { 
        state: { 
          assessmentCompleted: true, 
          score: percentage,
          correctAnswers,
          totalQuestions
        } 
      });
    }, 5000);
  };

  const getQuestionButtonStyle = (index: number) => {
    const answer = userAnswers[index];
    if (!answer) return "bg-white border-gray-300 text-gray-600";
    
    if (index === currentQuestionIndex) {
      return "bg-blue-50 border-[#007B9F] text-[#255C79]";
    }
    
    if (answer.selectedOption) {
      return "bg-[#2A8CB0] border-[#2A8CB0] text-white";
    }
    
    return "bg-white border-gray-300 text-gray-600";
  };

  const allQuestionsAnswered = userAnswers.every(answer => answer.selectedOption !== null);

  if (isCompleted) {
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const scholarshipPercentage = percentage >= 80 ? 70 : percentage >= 60 ? 50 : percentage >= 40 ? 30 : 0;
    
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Left Panel - Score Display */}
            <div className="flex-1 bg-gradient-to-br from-[#B8E6F0] to-[#E0F4F8] rounded-2xl p-6 sm:p-8 relative overflow-hidden mb-4 md:mb-0">
              <div className="relative z-10">
                <p className="text-[#255C79] text-base sm:text-lg mb-2">You have scored</p>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl sm:text-6xl md:text-8xl font-bold text-[#255C79]">
                    {correctAnswers}
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl text-[#255C79] ml-2">
                    /{questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#255C79]">
                  <span className="text-xl sm:text-2xl">⭐</span>
                  <p className="text-base sm:text-lg font-medium">
                    Outstanding! You aced it with top marks! 💯🎉
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
                  <p className="text-base sm:text-lg">Hey, You are eligible for a</p>
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
                  onClick={() => navigate('/courses')}
                  className="w-full bg-white text-[#255C79] py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Continue to Payment
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
              Redirecting you back to courses in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => navigate('/assessment')}
              className="flex items-center text-[#255C79] hover:text-[#1a4a5f] mb-2 sm:mb-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back
            </button>
            <div className="text-left sm:text-center w-full sm:w-auto">
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">{mockAssessmentData.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500">Solve real world questions and gain insight knowledge.</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-gray-500">Time Remaining</div>
              <div className="text-base sm:text-lg font-semibold text-[#255C79]">{formatTime(timeRemaining)}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left Sidebar - Question Navigation */}
          <div className="w-full md:w-1/4 bg-white rounded-lg p-4 sm:p-6 shadow-sm h-fit mb-4 md:mb-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Questions</h3>
            <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToQuestion(index)}
                  className={`py-2 px-2 sm:px-3 rounded-md border text-xs sm:text-sm font-medium transition ${getQuestionButtonStyle(index)}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <div>Total Questions: {questions.length}</div>
                <div>Answered: {userAnswers.filter(a => a.selectedOption).length}</div>
                <div>Remaining: {userAnswers.filter(a => !a.selectedOption).length}</div>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
                  {currentQuestion.difficulty_level}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                {currentQuestion.question_text}
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const optionLetter = optionLetters[idx];
                  const isSelected = selectedOption === optionLetter;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleOptionSelect(optionLetter)}
                      className={`cursor-pointer border rounded-lg p-3 sm:p-4 transition ${
                        isSelected
                          ? "border-[#255C79] bg-blue-50"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="font-medium mr-2 sm:mr-3 text-[#255C79]">
                          {optionLetter}.
                        </span>
                        <span className="text-gray-800 text-sm sm:text-base">{option}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Navigation Buttons */}
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
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!selectedOption}
                    className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition ${
                      !selectedOption
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
                    }`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleFinishAssessment}
                    disabled={!allQuestionsAnswered}
                    className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition ${
                      !allQuestionsAnswered
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    Finish Assessment
                  </button>
                )}
              </div>
            </div>
            {!allQuestionsAnswered && currentQuestionIndex === questions.length - 1 && (
              <div className="mt-2 text-center">
                <p className="text-xs sm:text-sm text-red-500">
                  Please answer all questions before finishing the assessment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortAssessment; 