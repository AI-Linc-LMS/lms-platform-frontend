import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";

interface InterviewCompletePageProps {
  submissionStatus?: boolean | null;
  attemptId?: string | null;
}

const InterviewCompletePage: React.FC<InterviewCompletePageProps> = ({
  submissionStatus,
  attemptId: propAttemptId,
}) => {
  const navigate = useNavigate();
  const isSubmitting = submissionStatus === null;
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Get attemptId from props or sessionStorage
  const attemptId =
    propAttemptId || sessionStorage.getItem("interview_attempt_id");

  // Stop all video and audio streams immediately on mount
  useEffect(() => {
    const stopAllMedia = () => {
      // 1. Stop all video elements (if any)
      document.querySelectorAll("video").forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          video.srcObject = null;
          video.pause();
        }
      });

      // 2. Stop all audio elements (if any)
      document.querySelectorAll("audio").forEach((audio) => {
        const stream = audio.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          audio.srcObject = null;
          audio.pause();
        }
      });

      // 3. Stop the stream from your ref
      if (streamRef.current) {
        const stream = streamRef.current as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // 4. Stop ANY active tracks from existing MediaStreams
      // This is the real way to kill audio/video
      if ((navigator.mediaDevices as any)._activeStreams) {
        (navigator.mediaDevices as any)._activeStreams.forEach(
          (s: MediaStream) => s.getTracks().forEach((t) => t.stop())
        );
      }
    };

    // Monkey-patch getUserMedia to track all created streams
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices
    );

    (navigator.mediaDevices as any)._activeStreams =
      (navigator.mediaDevices as any)._activeStreams || [];

    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await origGetUserMedia(constraints);
      (navigator.mediaDevices as any)._activeStreams.push(stream);
      return stream;
    };

    // Execute immediately and after short delays
    stopAllMedia();
    const t1 = setTimeout(stopAllMedia, 100);
    const t2 = setTimeout(stopAllMedia, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopAllMedia();
    };
  }, []);

  // Simulate loading progress and redirect to detail view after completion
  useEffect(() => {
    if (!isSubmitting && submissionStatus === true && attemptId) {
      // Submission is complete, show loading animation then redirect
      const loadingInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(loadingInterval);
            // Redirect to detail view after loading completes
            setTimeout(() => {
              navigate(`/mock-interview/detail/${attemptId}`);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Complete loading after 2 seconds
      setTimeout(() => {
        clearInterval(loadingInterval);
        setLoadingProgress(100);
        setIsLoading(false);
        // Redirect to detail view
        setTimeout(() => {
          navigate(`/mock-interview/detail/${attemptId}`);
        }, 500);
      }, 2000);

      return () => {
        clearInterval(loadingInterval);
      };
    } else if (!isSubmitting && submissionStatus === true && !attemptId) {
      // Submission complete but no attemptId, just show success
      setIsLoading(false);
    } else if (!isSubmitting && submissionStatus === false) {
      // Submission failed, show error
      setIsLoading(false);
    }
  }, [isSubmitting, submissionStatus, attemptId, navigate]);

  // Show loader while submitting or loading
  if (isSubmitting || isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Loading Animation */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mb-6 shadow-2xl">
              <CircularProgress size={48} sx={{ color: "white" }} />
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              {isSubmitting
                ? "Submitting Interview..."
                : "Processing Results..."}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {isSubmitting
                ? "Please wait while we submit your interview"
                : "Generating your detailed report"}
            </p>

            {/* Progress Bar */}
            {!isSubmitting && (
              <div className="w-full max-w-md mx-auto">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {loadingProgress}% Complete
                </p>
              </div>
            )}

            {/* Loading Steps */}
            <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-700">
                  Analyzing your responses...
                </p>
              </div>
              <div
                className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${
                  loadingProgress >= 50 ? "opacity-100" : "opacity-50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    loadingProgress >= 50
                      ? "bg-green-500"
                      : "bg-gray-300 border-2 border-gray-400 border-t-transparent animate-spin"
                  }`}
                >
                  {loadingProgress >= 50 && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  Generating performance report...
                </p>
              </div>
              <div
                className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${
                  loadingProgress >= 100 ? "opacity-100" : "opacity-50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    loadingProgress >= 100
                      ? "bg-green-500"
                      : "bg-gray-300 border-2 border-gray-400 border-t-transparent animate-spin"
                  }`}
                >
                  {loadingProgress >= 100 && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  Preparing detailed feedback...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] flex items-center justify-center py-12">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-2xl animate-bounce">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            {submissionStatus === false
              ? "Submission Failed"
              : "Interview Submitted Successfully!"}
          </h2>
          <p className="text-lg text-gray-600">
            {submissionStatus === false
              ? "There was an error submitting your interview. Please try again."
              : "Your responses have been recorded and submitted for evaluation"}
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <svg
              className="w-8 h-8 text-blue-600 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-semibold text-gray-700">
              Answers Recorded
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 text-center">
            <svg
              className="w-8 h-8 text-purple-600 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm font-semibold text-gray-700">
              Video Uploaded
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <svg
              className="w-8 h-8 text-green-600 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm font-semibold text-gray-700">
              Report Generating
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-6 h-6 text-indigo-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            What Happens Next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-700">
                Your interview is being processed and analyzed
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-700">
                AI will evaluate your responses and generate a detailed report
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-700">
                You'll receive feedback on your performance and areas for
                improvement
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-700">
                Check your interview history to view the complete report
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InterviewCompletePage;
