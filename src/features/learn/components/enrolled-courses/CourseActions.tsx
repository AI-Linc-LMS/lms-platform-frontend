import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeOrUnlikeCourse } from "../../../../services/enrolled-courses-content/coursesApis";
import likeIcon from "../../../../commonComponents/icons/enrolled-courses/like.png";
import unlikeIcon from "../../../../commonComponents/icons/enrolled-courses/unlike.png";
import ReportIssueModal from "./ReportIssueModal";

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

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 my-3 items-center justify-between">
        <div className="flex flex-row gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={handleLikeToggle}
            disabled={likeMutation.isPending}
            className={`w-[100px] h-[45px] rounded-full bg-[#E9ECEF] flex flex-row items-center justify-center gap-2 p-3 cursor-pointer transition-colors ${likeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            <img
              src={currentIsLiked ? likeIcon : unlikeIcon}
              alt={currentIsLiked ? "Liked" : "Not liked"}
              className="w-5 h-5"
            />
            <p className="font-sans font-medium text-xs sm:text-[14px] text-[#495057]">
              {likeMutation.isPending ? "..." : currentLikeCount}
            </p>
          </button>
        </div>
        <div className="w-full sm:w-auto flex justify-center sm:justify-end mt-2 sm:mt-0">
          <button
            onClick={handleReportIssue}
            className="flex flex-row gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <svg
              width="22"
              height="21"
              viewBox="0 0 22 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 5.75C11.4142 5.75 11.75 6.08579 11.75 6.5V11.5C11.75 11.9142 11.4142 12.25 11 12.25C10.5858 12.25 10.25 11.9142 10.25 11.5V6.5C10.25 6.08579 10.5858 5.75 11 5.75Z"
                fill="#AE0606"
              />
              <path
                d="M11 15.5C11.5523 15.5 12 15.0523 12 14.5C12 13.9477 11.5523 13.5 11 13.5C10.4477 13.5 9.99998 13.9477 9.99998 14.5C9.99998 15.0523 10.4477 15.5 11 15.5Z"
                fill="#AE0606"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.2944 2.97643C8.36631 1.61493 9.50182 0.75 11 0.75C12.4981 0.75 13.6336 1.61493 14.7056 2.97643C15.7598 4.31544 16.8769 6.29622 18.3063 8.83053L18.7418 9.60267C19.9234 11.6976 20.8566 13.3523 21.3468 14.6804C21.8478 16.0376 21.9668 17.2699 21.209 18.3569C20.4736 19.4118 19.2466 19.8434 17.6991 20.0471C16.1576 20.25 14.0845 20.25 11.4248 20.25H10.5752C7.91552 20.25 5.84239 20.25 4.30082 20.0471C2.75331 19.8434 1.52637 19.4118 0.790989 18.3569C0.0331793 17.2699 0.152183 16.0376 0.653135 14.6804C1.14334 13.3523 2.07658 11.6977 3.25818 9.6027L3.69361 8.83067C5.123 6.29629 6.24019 4.31547 7.2944 2.97643ZM8.47297 3.90432C7.49896 5.14148 6.43704 7.01988 4.96495 9.62994L4.60129 10.2747C3.37507 12.4488 2.50368 13.9986 2.06034 15.1998C1.6227 16.3855 1.68338 17.0141 2.02148 17.4991C2.38202 18.0163 3.05873 18.3706 4.49659 18.5599C5.92858 18.7484 7.9026 18.75 10.6363 18.75H11.3636C14.0974 18.75 16.0714 18.7484 17.5034 18.5599C18.9412 18.3706 19.6179 18.0163 19.9785 17.4991C20.3166 17.0141 20.3773 16.3855 19.9396 15.1998C19.4963 13.9986 18.6249 12.4488 17.3987 10.2747L17.035 9.62993C15.5629 7.01987 14.501 5.14148 13.527 3.90431C12.562 2.67865 11.8126 2.25 11 2.25C10.1874 2.25 9.43793 2.67865 8.47297 3.90432Z"
                fill="#AE0606"
              />
            </svg>
            <p className="text-[#AE0606] font-medium text-xs sm:text-[14px]">
              Report an issue
            </p>
          </button>
        </div>
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
