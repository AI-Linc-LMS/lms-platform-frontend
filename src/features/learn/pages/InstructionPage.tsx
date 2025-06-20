import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInstructions,
  startAssessment,
} from "../../../services/assesment/assesmentApis";

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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Data is always considered stale, so it will refetch
    gcTime: 0, // Don't cache the data
  });

  console.log("Instructions:", data);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#255C79]"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#343A40] mb-2">
              Error Loading Instructions
            </h2>
            <p className="text-[#6C757D] mb-4">{error.message}</p>
            <button
              onClick={() => navigate("/assessment")}
              className="bg-[#255C79] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
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

  const handleResumeAssessment = () => {
    navigate("/assessment/quiz");
  };

  const handleViewResults = () => {
    navigate("/assessment/results");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Matching the image */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* <div className="w-10 h-10 bg-gradient-to-br from-[#255C79] to-[#1a4a5f] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div> */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#264D64]">
              {data?.status === "submitted"
                ? "🎯 Assessment Completed: View Your Results"
                : data?.status === "in_progress"
                ? "🎯 Continue Your Assessment"
                : "🎯 Post-Bootcamp Assessment: Your Path Forward Starts Here"}
            </h1>
          </div>
          <p className="text-[#000000] font-inter font-semibold text-22px md:text-lg max-w-4xl mx-auto leading-[140%] tracking-[-3%] text-center">
            {data?.status === "submitted"
              ? "Congratulations! You've completed the assessment. View your results and see what's next for your career journey."
              : data?.status === "in_progress"
              ? "You have an assessment in progress. Continue where you left off to complete your evaluation."
              : "You've completed the AI Linc No-Code Development Bootcamp — now take the next step. This assessment is your chance to showcase your learning, strengths, and readiness for real-world projects."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section - Why this matters */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-[#80C9E0]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#EFF9FC] rounded-full flex items-center justify-center">
                  <span className="text-lg">🔍</span>
                </div>
                <h2 className="text-xl font-bold text-[#255C79]">
                  Why this matters:
                </h2>
              </div>
              <p className="text-[#000000] leading-relaxed mb-6">
                We're already in touch with companies actively hiring for
                AI-powered and no-code roles. If you ace this assessment, you
                may qualify directly for placement interviews with our partner
                companies.
              </p>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-[#80C9E0]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FFF8E1] rounded-full flex items-center justify-center">
                  <span className="text-lg">🛠️</span>
                </div>
                <h2 className="text-xl font-bold text-[#255C79]">
                  What if you don't score high?
                </h2>
              </div>
              <p className="text-[#343A40] leading-relaxed mb-3">
                <strong>No worries. That's exactly why we're here.</strong>
              </p>
              <p className="text-[#343A40] leading-relaxed">
                If your results show there's room to grow, we'll offer you
                personalized upskilling pathways — through our industry-grade
                programs — designed to help you become a{" "}
                <strong>
                  high-impact individual in AI and full-stack development.
                </strong>
              </p>
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-[#80C9E0]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#E8F5E8] rounded-full flex items-center justify-center">
                  <span className="text-lg">🚀</span>
                </div>
                <h2 className="text-xl font-bold text-[#255C79]">
                  Your performance here can unlock
                </h2>
              </div>
              <ul className="space-y-3 text-[#000000]">
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">🏢</span>
                  <span>Direct access to interviews with hiring partners</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">💡</span>
                  <span>
                    Personalized feedback on your current strengths and areas to
                    grow
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">🎯</span>
                  <span>
                    A chance to join our flagship career-launching program and
                    move closer to your dream job
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Section - Assessment Overview and Start */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-[#80C9E0]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#EFF9FC] rounded-full flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <h2 className="text-xl font-bold text-[#255C79]">
                  Assessment Overview:
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[#8B4513] text-lg">📊</span>
                  <div>
                    <span className="text-[#6C757D] text-sm">
                      Total Questions:
                    </span>
                    <p className="font-bold text-[#343A40]">
                      30 Multiple Choice Questions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#8B4513] text-lg">⏱️</span>
                  <div>
                    <span className="text-[#6C757D] text-sm">Duration:</span>
                    <p className="font-bold text-[#343A40]">30 minutes</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-green-600 text-lg">●</span>
                  <h3 className="font-bold text-[#343A40]">Topics:</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "AI Fundamentals",
                    "JavaScript",
                    "React",
                    "Node.JS",
                    "HTML/CSS",
                    "Cloud Database",
                    "Logic & Aptitude",
                  ].map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-2 bg-[#EFF9FC] text-[#255C79] rounded-xl text-sm font-medium border border-[#80C9E0]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-[#80C9E0]">
              <h2 className="text-2xl font-bold text-[#255C79] mb-2">
                {data?.status === "submitted"
                  ? "Your Results Are Ready!"
                  : data?.status === "in_progress"
                  ? "Continue Your Assessment"
                  : "Let's begin. Your future self is waiting."}
              </h2>

              {data?.status === "submitted" ? (
                // View Results Section
                <div className="space-y-4">
                  <p className="text-[#6C757D] mb-4">
                    Your assessment has been completed successfully. Click below
                    to view your detailed results and next steps.
                  </p>
                  <button
                    onClick={handleViewResults}
                    className="w-full py-4 px-6 bg-green-600 text-white rounded-xl font-semibold text-base transition-colors duration-200 hover:bg-green-700"
                  >
                    View Results
                  </button>
                </div>
              ) : data?.status === "in_progress" ? (
                // Resume Quiz Section
                <div className="space-y-4">
                  <p className="text-[#6C757D] mb-4">
                    You have an assessment in progress. Click below to continue
                    where you left off.
                  </p>
                  <button
                    onClick={handleResumeAssessment}
                    disabled={startAssessmentMutation.isPending}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-colors duration-200 ${
                      !startAssessmentMutation.isPending
                        ? "bg-[#4A90A4] text-white hover:bg-[#3A7A8A]"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {startAssessmentMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Resuming Assessment...
                      </div>
                    ) : (
                      "Resume Quiz"
                    )}
                  </button>
                </div>
              ) : (
                // Start New Assessment Section
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-[#343A40] mb-2"
                    >
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Enter phone number"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79] transition-colors font-medium ${
                        phoneNumber && !isPhoneValid
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300"
                      }`}
                      maxLength={10}
                    />
                    {phoneNumber && !isPhoneValid && (
                      <p className="text-red-500 text-sm mt-2 font-medium">
                        Please enter a valid 10-digit phone number
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleStartAssessment}
                    disabled={
                      !isPhoneValid || startAssessmentMutation.isPending
                    }
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-colors duration-200 ${
                      isPhoneValid && !startAssessmentMutation.isPending
                        ? "bg-[#4A90A4] text-white hover:bg-[#3A7A8A]"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {startAssessmentMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Starting Assessment...
                      </div>
                    ) : (
                      "Start Quiz"
                    )}
                  </button>
                </div>
              )}

              {startAssessmentMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                  <p className="text-red-600 text-sm font-medium">
                    Failed to start assessment. Please try again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
