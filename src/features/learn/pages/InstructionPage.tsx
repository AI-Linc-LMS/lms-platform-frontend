import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstructions, startAssessment } from "../../../services/assesment/assesmentApis";

const InstructionPage: React.FC = () => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const startAssessmentMutation = useMutation({
    mutationFn: (phone: string) =>
      startAssessment(clientId, "ai-linc-scholarship-test", phone),
    onSuccess: (data) => {
      console.log("Assessment started successfully:", data);
      // Navigate to the assessment page
      navigate("/assessment/quiz");
    },
    onError: (error) => {
      console.error("Error starting assessment:", error);
      alert("Failed to start assessment. Please try again.");
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["assessment-instructions"],
    queryFn: () => getInstructions(clientId, "ai-linc-scholarship-test"),
  });

  console.log("Instructions:", data);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    // Basic phone number validation (10 digits)
    setIsPhoneValid(/^\d{10}$/.test(value));
  };

  const handleStartAssessment = () => {
    if (isPhoneValid) {
      startAssessmentMutation.mutate(phoneNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => navigate("/assessment")}
              className="flex items-center text-[#255C79] hover:text-[#1a4a5f] mb-2 sm:mb-0"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back
            </button>
            <div className="text-left sm:text-center w-full sm:w-auto">
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">
                Assessment Instructions
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Read the instructions carefully before starting the assessment.
              </p>
            </div>
            <div className="w-full sm:w-auto"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Section - Phone Number Input */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#255C79] to-[#1a4a5f] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Ready to Start?
                </h2>
                <p className="text-gray-600">
                  Enter your phone number to begin the assessment
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter your 10-digit phone number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79] transition-colors ${
                      phoneNumber && !isPhoneValid
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300"
                    }`}
                    maxLength={10}
                  />
                  {phoneNumber && !isPhoneValid && (
                    <p className="text-red-500 text-sm mt-1">
                      Please enter a valid 10-digit phone number
                    </p>
                  )}
                </div>

                <button
                  onClick={handleStartAssessment}
                  disabled={!isPhoneValid || startAssessmentMutation.isPending}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                    isPhoneValid && !startAssessmentMutation.isPending
                      ? "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {startAssessmentMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Starting Assessment...
                    </div>
                  ) : (
                    "Start Assessment"
                  )}
                </button>

                {startAssessmentMutation.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">
                      Failed to start assessment. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Instructions */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Assessment Instructions
              </h2>

              <div className="space-y-6">
                {/* General Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-[#255C79] mb-3">
                    📋 General Instructions
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      This assessment contains multiple-choice questions
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      You have 30 minutes to complete the assessment
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      Each question has only one correct answer
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      You can navigate between questions using the question grid
                    </li>
                  </ul>
                </div>

                {/* Navigation Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-[#255C79] mb-3">
                    🧭 Navigation
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      Use "Previous" and "Next" buttons to navigate
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      Click on question numbers in the grid to jump to specific
                      questions
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      Answered questions will be highlighted in the grid
                    </li>
                  </ul>
                </div>

                {/* Submission Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-[#255C79] mb-3">
                    ✅ Submission
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      Review all your answers before final submission
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      Click "Finish Assessment" when you're ready to submit
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#255C79] mr-2">•</span>
                      You cannot change answers after submission
                    </li>
                  </ul>
                </div>

                {/* Scholarship Information */}
                <div className="bg-gradient-to-r from-[#B8E6F0] to-[#E0F4F8] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#255C79] mb-2">
                    🎓 Scholarship Eligibility
                  </h3>
                  <ul className="space-y-1 text-[#255C79] text-sm">
                    <li>• Score 80% or above: 70% scholarship</li>
                    <li>• Score 60% or above: 50% scholarship</li>
                    <li>• Score 40% or above: 30% scholarship</li>
                    <li>• Score below 40%: No scholarship</li>
                  </ul>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    ⚠️ Important Notes
                  </h3>
                  <ul className="space-y-1 text-yellow-700 text-sm">
                    <li>• Do not refresh the page during the assessment</li>
                    <li>• Ensure stable internet connection</li>
                    <li>• Complete the assessment in one sitting</li>
                    <li>• Timer will auto-submit when time expires</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
