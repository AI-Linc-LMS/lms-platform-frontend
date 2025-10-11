import React, { useState, useEffect } from "react";
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
  FaDownload,
  //   FaPlayCircle,
  FaSpinner,
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

  // Sync local state with props when they change
  useEffect(() => {
    setCurrentLikeCount(likeCount);
    setCurrentIsLiked(isLiked);
  }, [likeCount, isLiked]);

  const likeMutation = useMutation({
    mutationFn: () => likeOrUnlikeCourse(clientId, courseId),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["enrolledCourses"] });
      await queryClient.cancelQueries({
        queryKey: ["continueLearningCourses"],
      });

      // Snapshot the previous value
      const previousLikeCount = currentLikeCount;
      const previousIsLiked = currentIsLiked;

      // Optimistically update to the new value
      const newIsLiked = !currentIsLiked;
      const newLikeCount = newIsLiked
        ? currentLikeCount + 1
        : currentLikeCount - 1;

      setCurrentIsLiked(newIsLiked);
      setCurrentLikeCount(newLikeCount);

      // Notify parent component
      if (onLikeUpdate) {
        onLikeUpdate(newLikeCount, newIsLiked);
      }

      // Return a context object with the snapshotted value
      return { previousLikeCount, previousIsLiked };
    },
    onError: (
      context:
        | { previousLikeCount: number; previousIsLiked: boolean }
        | undefined
    ) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context) {
        setCurrentLikeCount(context.previousLikeCount);
        setCurrentIsLiked(context.previousIsLiked);

        // Notify parent component of rollback
        if (onLikeUpdate) {
          onLikeUpdate(context.previousLikeCount, context.previousIsLiked);
        }
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["enrolledCourses"] });
      queryClient.invalidateQueries({ queryKey: ["continueLearningCourses"] });
    },
  });

  const handleLikeToggle = () => {
    likeMutation.mutate();
  };

  const handleReportIssue = () => {
    setIsReportModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this amazing course!",
        url: window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you would typically call an API to save/remove bookmark
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log("Download course materials");
  };

  //   const handleStartLearning = () => {
  //     // Navigate to first lesson or continue where left off
  //     console.log("Start learning");
  //   };

  return (
    <>
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Primary Actions */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Start Learning Button */}
          {/* <button
            onClick={handleStartLearning}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 touch-manipulation"
          >
            <FaPlayCircle className="text-lg sm:text-xl" />
            Continue Learning
          </button> */}

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Like Button */}
            <button
              onClick={handleLikeToggle}
              disabled={likeMutation.isPending}
              className={`bg-white border-2 ${
                currentIsLiked
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              } px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 shadow-sm hover:shadow-md touch-manipulation ${
                likeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {likeMutation.isPending ? (
                <FaSpinner className="animate-spin text-base sm:text-lg" />
              ) : currentIsLiked ? (
                <FaHeart className="text-base sm:text-lg" />
              ) : (
                <FaRegHeart className="text-base sm:text-lg" />
              )}
              <span className="font-semibold text-sm sm:text-base">
                {likeMutation.isPending ? "..." : currentLikeCount}
              </span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`bg-white border-2 ${
                isBookmarked
                  ? "border-yellow-200 bg-yellow-50 text-yellow-600"
                  : "border-gray-200 text-gray-600 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600"
              } px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 shadow-sm hover:shadow-md touch-manipulation`}
            >
              {isBookmarked ? (
                <FaBookmark className="text-base sm:text-lg" />
              ) : (
                <FaRegBookmark className="text-base sm:text-lg" />
              )}
              <span className="text-sm sm:text-base font-medium hidden sm:inline">
                Save
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md touch-manipulation"
          >
            <FaShare className="text-sm" />
            <span className="text-sm sm:text-base">Share Course</span>
          </button>

          {/* Download Materials */}
          <button
            onClick={handleDownload}
            className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md touch-manipulation"
          >
            <FaDownload className="text-sm" />
            <span className="text-sm sm:text-base">Download</span>
          </button>

          {/* Report Issue */}
          <button
            onClick={handleReportIssue}
            className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md touch-manipulation"
          >
            <FaFlag className="text-sm" />
            <span className="text-sm sm:text-base">Report</span>
          </button>
        </div>

        {/* Course Progress Bar */}
      </div>

      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        clientId={clientId}
      />
    </>
  );
};

export default CourseActions;
