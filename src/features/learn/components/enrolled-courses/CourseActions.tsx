import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeOrUnlikeCourse } from "../../../../services/enrolled-courses-content/coursesApis";
import ReportIssueModal from "./ReportIssueModal";
import {
  FaHeart,
  FaRegHeart,
  FaFlag,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaThumbsUp,
  FaRegThumbsUp,
  FaGraduationCap,
  FaStar,
  FaRocket,
} from "react-icons/fa";

interface CourseActionsProps {
  likeCount: number;
  isLiked: boolean;
  courseId: number;
  clientId: number;
  onLikeUpdate?: (newLikeCount: number, newIsLiked: boolean) => void;
}

const CourseActions: React.FC<CourseActionsProps> = ({
  likeCount,
  isLiked,
  courseId,
  clientId,
  onLikeUpdate,
}) => {
  const queryClient = useQueryClient();
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [currentIsLiked, setCurrentIsLiked] = useState(isLiked);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setCurrentLikeCount(likeCount);
    setCurrentIsLiked(isLiked);
  }, [likeCount, isLiked]);

  const likeMutation = useMutation({
    mutationFn: () => likeOrUnlikeCourse(clientId, courseId),
    onMutate: async () => {
      const newIsLiked = !currentIsLiked;
      const newLikeCount = newIsLiked
        ? currentLikeCount + 1
        : Math.max(0, currentLikeCount - 1);

      setCurrentIsLiked(newIsLiked);
      setCurrentLikeCount(newLikeCount);

      return {
        previousIsLiked: currentIsLiked,
        previousLikeCount: currentLikeCount,
      };
    },
    onError: (error, variables, context) => {
      if (context) {
        setCurrentIsLiked(context.previousIsLiked);
        setCurrentLikeCount(context.previousLikeCount);
      }
      console.error("Error liking/unliking course:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", courseId.toString()],
      });
      if (onLikeUpdate) {
        onLikeUpdate(currentLikeCount, currentIsLiked);
      }
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this course!",
          text: "I found this amazing course that you might be interested in.",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleFeedback = (positive: boolean) => {
    // Handle feedback submission
    setShowFeedback(false);
    // Add API call here for feedback
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-100">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaGraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Course Interaction
              </h3>
              <p className="text-sm text-gray-600">
                Share your experience and engage with the course
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            <FaStar className="w-3 h-3" />
            <span>4.8 Rating</span>
          </div>
        </div>

        {/* Main Action Buttons - Improved Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Enhanced Like Button */}
          <motion.button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
              currentIsLiked
                ? "bg-gradient-to-br from-red-50 to-pink-50 border-red-200 text-red-600 shadow-lg"
                : "bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:shadow-lg"
            } ${likeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                {currentIsLiked ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <FaHeart className="w-8 h-8" />
                  </motion.div>
                ) : (
                  <FaRegHeart className="w-8 h-8 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1">
                {currentLikeCount}
              </div>
              <div className="text-sm font-medium">
                {currentIsLiked ? "Loved it!" : "Like Course"}
              </div>
            </div>
            <div
              className={`absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />
          </motion.button>

          {/* Enhanced Bookmark Button */}
          <motion.button
            onClick={handleBookmark}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative group overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
              isBookmarked
                ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-600 shadow-lg"
                : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-lg"
            }`}
          >
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                {isBookmarked ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <FaBookmark className="w-7 h-7" />
                  </motion.div>
                ) : (
                  <FaRegBookmark className="w-7 h-7 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="text-sm font-medium mt-2">
                {isBookmarked ? "Bookmarked" : "Save Course"}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </motion.button>

          {/* Enhanced Share Button */}
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="relative group overflow-hidden bg-white border-2 border-gray-200 rounded-2xl text-gray-600 hover:border-green-200 hover:text-green-600 hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <FaShare className="w-7 h-7 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-medium mt-2">Share Course</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </motion.button>

          {/* Enhanced Report Button */}
          <motion.button
            onClick={() => setIsReportModalOpen(true)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="relative group overflow-hidden bg-white border-2 border-gray-200 rounded-2xl text-gray-600 hover:border-orange-200 hover:text-orange-600 hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <FaFlag className="w-7 h-7 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-medium mt-2">Report Issue</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </motion.button>
        </div>

        {/* Enhanced Feedback Section */}
        <div className="relative">
          <AnimatePresence>
            {!showFeedback ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">
                        How's your learning experience?
                      </h4>
                      <p className="text-sm text-gray-600">
                        Your feedback helps us improve the course
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowFeedback(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
                  >
                    <FaRocket className="w-4 h-4" />
                    Rate Course
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100"
              >
                <h4 className="font-semibold text-gray-900 text-lg mb-4 text-center">
                  Rate Your Experience
                </h4>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={() => handleFeedback(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                  >
                    <FaThumbsUp className="w-5 h-5" />
                    <span>Excellent Course!</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="w-4 h-4 text-yellow-300" />
                      ))}
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleFeedback(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                  >
                    <FaRegThumbsUp className="w-5 h-5" />
                    <span>Could be Better</span>
                  </motion.button>
                </div>

                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Course Stats Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaHeart className="w-4 h-4 text-red-500" />
              <span className="font-medium">
                {currentLikeCount} students love this course
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaShare className="w-4 h-4 text-green-500" />
              <span className="font-medium">Shared 1.2k times</span>
            </div>
            <div className="flex items-center gap-2">
              <FaStar className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">4.8/5 rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        courseId={courseId}
        clientId={clientId}
      />
    </>
  );
};

export default CourseActions;
