import React, { useState, useEffect } from "react";
import VideoPlayer from "../../video-player/VideoPlayer";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCourseContent } from "../../../../../services/enrolled-courses-content/courseContentApis";
import { submitContent } from "../../../../../services/enrolled-courses-content/submitApis";
import Comments from "../../../../../commonComponents/components/Comments";
import ReportIssueModal from "../../enrolled-courses/ReportIssueModal";
import parse from "html-react-parser";
import { STREAK_QUERY_KEY } from "../../../hooks/useStreakData";

interface VideoCardProps {
  currentWeek: { title: string };
  currentTopic: { title: string };
  contentId: number;
  courseId: number;
  nextContent: () => void;
  getNextTopicTitle: () => string;
  onComplete?: () => void;
  onProgressUpdate?: (videoId: string, progress: number) => void;
}

// Define interface for the API response data
interface CourseContentDetails {
  video_id: string;
  id: number;
  title: string;
  description: string;
  video_url: string;
  difficulty_level: string;
}

interface CourseContentResponse {
  id: number;
  content_type: string;
  content_title: string;
  duration_in_minutes: number;
  order: number;
  status: string;
  details: CourseContentDetails;
}

export interface Comment {
  id: number;
  client: number;
  content: number;
  course: number;
  created_at: string;
  dislikes: number;
  likes: number;
  text: string;
  user_profile: { user_name?: string; role?: string } | number;
  user_name?: string; // Optional user name field
}

// Define a sample Vimeo URL for testing
const SAMPLE_VIMEO_URL =
  "https://player.vimeo.com/video/1048123643?badge=0&autopause=0&player_id=0&app_id=58479";

const VideoCard: React.FC<VideoCardProps> = ({
  currentWeek,
  currentTopic,
  contentId,
  courseId,
  nextContent,
  getNextTopicTitle,
  onComplete,
  onProgressUpdate,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const numericClientId = Number(clientId) || 0;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"description" | "comments">(
    "description"
  );
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string>("");
  const [useDirectHtml, setUseDirectHtml] = useState(true);
  const [useDebugMode, setUseDebugMode] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Log component props for debugging
  useEffect(() => {
    // Check for potential issues with the API parameters
    if (contentId === undefined || contentId === null || contentId <= 0) {
    }
    if (courseId === undefined || courseId === null || courseId <= 0) {
    }
  }, [contentId, courseId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["video", courseId, contentId],
    queryFn: () => getCourseContent(numericClientId, courseId, contentId),
    enabled: !!contentId && !!courseId,
    retry: 3,
    retryDelay: 1000,
    // Ensure fresh data when switching between content
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes but always refetch
  });

  // Process the video URL when data changes
  useEffect(() => {
    // If in debug mode, use sample URL
    if (useDebugMode) {
      setProcessedVideoUrl(SAMPLE_VIMEO_URL);
      return;
    }

    if (!data) {
      return;
    }

    // Type assertion - we know the structure at this point
    const responseData = data as CourseContentResponse;

    // Check if details object exists
    if (!responseData.details) {
      return;
    }

    // Process video URL from response data
    if (!responseData.details.video_url) {
      return;
    }

    const videoUrl = String(responseData.details.video_url);

    // Process the URL
    let processedUrl = videoUrl;

    // Clean HTML entities
    processedUrl = processedUrl.replace(/&amp;/g, "&");

    // Handle Vimeo URLs
    if (
      processedUrl.includes("vimeo.com") &&
      !processedUrl.includes("player.vimeo.com")
    ) {
      const vimeoRegex = /vimeo.com\/(\d+)/;
      const match = processedUrl.match(vimeoRegex);

      if (match && match[1]) {
        const videoId = match[1];
        processedUrl = `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`;
      }
    }

    setProcessedVideoUrl(processedUrl);
  }, [data, useDebugMode]);

  // Handle video progress updates
  const handleProgressUpdate = (progress: number) => {
    if (onProgressUpdate) {
      onProgressUpdate(contentId.toString(), progress);
    }
  };

  // Handle video completion
  const handleVideoComplete = async () => {
    // Call the onComplete handler if provided
    if (onComplete) {
      onComplete();
    }

    // Also update progress to 100%
    if (onProgressUpdate) {
      onProgressUpdate(contentId.toString(), 100);
    }

    // Continue with existing completion logic
    if (numericClientId && courseId && contentId) {
      await submitContent(
        numericClientId,
        courseId,
        contentId,
        "VideoTutorial",
        {}
      );

      // Invalidate streak data to update streak immediately after video completion
      await queryClient.invalidateQueries({
        queryKey: [STREAK_QUERY_KEY, numericClientId],
      });
    }
    setTimeout(() => {
      nextContent();
    }, 1500);
  };

  // Function to safely parse HTML content
  const parseHtmlContent = (htmlContent: string) => {
    if (!htmlContent) {
      return null;
    }

    try {
      // Create a wrapper around the content to avoid React rendering issues
      const wrapWithDiv = (content: string) => `<div>${content}</div>`;

      let processedContent = htmlContent;

      // Check if we have HTML content
      if (htmlContent.includes("<") && htmlContent.includes(">")) {
        // Remove any style tags but keep other content
        processedContent = htmlContent.replace(/<style[\s\S]*?<\/style>/gi, "");

        // Extract content from body tag if present
        const bodyMatch = processedContent.match(
          /<body[^>]*>([\s\S]*?)<\/body>/i
        );
        if (bodyMatch && bodyMatch[1]) {
          processedContent = bodyMatch[1].trim();
        }
      }

      return parse(wrapWithDiv(processedContent));
    } catch {
      // Error parsing HTML content
      return (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
          Error rendering content. Please try refreshing the page.
        </div>
      );
    }
  };

  const handleReportIssue = () => {
    setIsReportModalOpen(true);
  };

  // If loading, show loading state
  if (isLoading && !useDebugMode) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/6 mb-2"></div>
      </div>
    );
  }

  // If API error, show error message with debug option
  if (error && !useDebugMode) {
    // Error loading data
    return (
      <div className="text-red-500 p-4">
        <div>Error loading video: {String(error)}</div>
        <button
          className="mt-4 px-3 py-1 bg-blue-500 text-[var(--font-light)] rounded"
          onClick={() => setUseDebugMode(true)}
        >
          Try Debug Mode
        </button>
      </div>
    );
  }

  // If no data or missing video_url, show message with debug option
  if (
    (!data || !(data as CourseContentResponse).details?.video_url) &&
    !useDebugMode
  ) {
    return (
      <div className="text-gray-500 p-4">
        <div>No video content available.</div>
        <div className="mt-2 text-xs text-gray-400">
          Content ID: {contentId}, Course ID: {courseId}
        </div>
        <button
          className="mt-4 px-3 py-1 bg-blue-500 text-[var(--font-light)] rounded"
          onClick={() => setUseDebugMode(true)}
        >
          Try Debug Mode
        </button>
      </div>
    );
  }

  // Get video title and description (from data or use defaults)
  const videoTitle = useDebugMode
    ? "Debug Video"
    : (data as CourseContentResponse)?.details?.title || currentTopic.title;

  const videoDescription = useDebugMode
    ? "This is a debug video to test the Vimeo player functionality."
    : (data as CourseContentResponse)?.details?.description || "";

  return (
    <div className="flex-1 max-w-full">
      {/* Week and Topic Navigation */}
      <div className="bg-gray-100 p-3 md:p-4 rounded-t-2xl">
        <div className="flex items-center space-x-2 text-sm md:text-base overflow-hidden">
          <span className="text-gray-500 whitespace-nowrap">
            {currentWeek.title}
          </span>
          <span className="text-gray-500">›</span>
          <span className="font-medium truncate">{currentTopic.title}</span>

          {useDebugMode && (
            <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded">
              DEBUG MODE
            </span>
          )}
        </div>
      </div>
      {/* Video Player Section */}
      <VideoPlayer
        videoUrl={useDebugMode ? SAMPLE_VIMEO_URL : processedVideoUrl}
        title={videoTitle}
        onComplete={handleVideoComplete}
        onProgressUpdate={handleProgressUpdate}
        videoId={
          useDebugMode
            ? "debug-video-id"
            : (data as CourseContentResponse)?.details?.video_id || ""
        }
        isFirstWatch={
          !(data as CourseContentResponse)?.status ||
          (data as CourseContentResponse)?.status !== "complete"
        }
      />

      {/* Next Button */}
      <div className="bg-gray-100 p-3 md:p-4 flex justify-end">
        <button
          onClick={nextContent}
          className="px-3 md:px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] text-sm md:text-base rounded-xl flex items-center cursor-pointer"
        >
          <span className="truncate max-w-[150px] md:max-w-none">
            Next: {getNextTopicTitle()}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-4 h-4 ml-2 flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Likes and Report */}
      <div className="flex justify-between items-center my-4 px-2 md:px-0">
        <div className="flex items-center space-x-2">
          {/* <button className="flex items-center text-[var(--neutral-500)] cursor-pointer">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.2699 16.265L20.9754 12.1852C21.1516 11.1662 20.368 10.2342 19.335 10.2342H14.1539C13.6404 10.2342 13.2494 9.77328 13.3325 9.26598L13.9952 5.22142C14.1028 4.56435 14.0721 3.892 13.9049 3.24752C13.7664 2.71364 13.3545 2.28495 12.8128 2.11093L12.6678 2.06435C12.3404 1.95918 11.9831 1.98365 11.6744 2.13239C11.3347 2.29611 11.0861 2.59473 10.994 2.94989L10.5183 4.78374C10.3669 5.36723 10.1465 5.93045 9.86218 6.46262C9.44683 7.24017 8.80465 7.86246 8.13711 8.43769L6.69838 9.67749C6.29272 10.0271 6.07968 10.5506 6.12584 11.0844L6.93801 20.4771C7.0125 21.3386 7.7328 22 8.59658 22H13.2452C16.7265 22 19.6975 19.5744 20.2699 16.265Z"
                fill="var(--primary-500)"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.96767 9.48508C3.36893 9.46777 3.71261 9.76963 3.74721 10.1698L4.71881 21.4063C4.78122 22.1281 4.21268 22.7502 3.48671 22.7502C2.80289 22.7502 2.25 22.1954 2.25 21.5129V10.2344C2.25 9.83275 2.5664 9.5024 2.96767 9.48508Z"
                fill="var(--primary-500)"
              />
            </svg>

            <span className="text-sm md:text-base">368</span>
          </button> */}
          {/* <button className="flex items-center text-gray-500 cursor-pointer">
            <svg className="mt-1.5" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12.4382 21.2216C12.2931 21.2682 12.1345 21.2569 11.9998 21.192C11.8523 21.1209 11.7548 20.9968 11.7197 20.8618L11.244 19.0279C11.0777 18.3866 10.8354 17.768 10.5235 17.184C10.0392 16.2773 9.30632 15.58 8.62647 14.9942L7.18773 13.7544C6.96475 13.5622 6.8474 13.2742 6.87282 12.9802L7.68498 3.58754C7.72601 3.11303 8.12244 2.75 8.59635 2.75H13.245C16.3813 2.75 19.0238 4.93226 19.5306 7.86285L20.2361 11.9426C20.3332 12.5041 19.9014 13.0158 19.3348 13.0158H14.1537C13.1766 13.0158 12.4344 13.8924 12.5921 14.8553L13.2548 18.8998C13.3456 19.4539 13.3197 20.0208 13.1787 20.5642C13.1072 20.8399 12.8896 21.0766 12.5832 21.175L12.4382 21.2216L12.6676 21.9356L12.4382 21.2216ZM11.3486 22.5433C11.8312 22.7758 12.3873 22.8135 12.897 22.6497L13.042 22.6031L12.8126 21.8891L13.042 22.6031C13.819 22.3535 14.4252 21.7328 14.6307 20.9408C14.8241 20.1952 14.8596 19.4174 14.7351 18.6573L14.0724 14.6128C14.0639 14.561 14.1038 14.5158 14.1537 14.5158H19.3348C20.8341 14.5158 21.9695 13.1635 21.7142 11.687L21.0087 7.60725C20.3708 3.91896 17.0712 1.25 13.245 1.25H8.59635C7.3427 1.25 6.29852 2.20975 6.19056 3.45832L5.3784 12.851C5.31149 13.6247 5.62022 14.3837 6.20855 14.8907L7.64729 16.1305C8.3025 16.6951 8.85404 17.2423 9.20042 17.8908C9.45699 18.3711 9.65573 18.8789 9.79208 19.4046L10.2678 21.2384C10.417 21.8137 10.8166 22.2869 11.3486 22.5433ZM2.96767 14.5151C3.36893 14.5324 3.71261 14.2306 3.74721 13.8304L4.71881 2.59389C4.78122 1.8721 4.21268 1.25 3.48671 1.25C2.80289 1.25 2.25 1.80474 2.25 2.48726V13.7658C2.25 14.1674 2.5664 14.4978 2.96767 14.5151Z" fill="var(--primary-500)" />
            </svg>

          </button> */}
        </div>
        <div>
          <button
            onClick={handleReportIssue}
            className="flex flex-row gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <svg
              width="22"
              height="21"
              viewBox="0 0 22 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                d="M11 5.75C11.4142 5.75 11.75 6.08579 11.75 6.5V11.5C11.75 11.9142 11.4142 12.25 11 12.25C10.5858 12.25 10.25 11.9142 10.25 11.5V6.5C10.25 6.08579 10.5858 5.75 11 5.75Z"
                fill="var(--secondsary-300)"
              />
              <path
                d="M11 15.5C11.5523 15.5 12 15.0523 12 14.5C12 13.9477 11.5523 13.5 11 13.5C10.4477 13.5 9.99998 13.9477 9.99998 14.5C9.99998 15.0523 10.4477 15.5 11 15.5Z"
                fill="var(--secondsary-300)"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.2944 2.97643C8.36631 1.61493 9.50182 0.75 11 0.75C12.4981 0.75 13.6336 1.61493 14.7056 2.97643C15.7598 4.31544 16.8769 6.29622 18.3063 8.83053L18.7418 9.60267C19.9234 11.6976 20.8566 13.3523 21.3468 14.6804C21.8478 16.0376 21.9668 17.2699 21.209 18.3569C20.4736 19.4118 19.2466 19.8434 17.6991 20.0471C16.1576 20.25 14.0845 20.25 11.4248 20.25H10.5752C7.91552 20.25 5.84239 20.25 4.30082 20.0471C2.75331 19.8434 1.52637 19.4118 0.790989 18.3569C0.0331793 17.2699 0.152183 16.0376 0.653135 14.6804C1.14334 13.3523 2.07658 11.6977 3.25818 9.6027L3.69361 8.83067C5.123 6.29629 6.24019 4.31547 7.2944 2.97643ZM8.47297 3.90432C7.49896 5.14148 6.43704 7.01988 4.96495 9.62994L4.60129 10.2747C3.37507 12.4488 2.50368 13.9986 2.06034 15.1998C1.6227 16.3855 1.68338 17.0141 2.02148 17.4991C2.38202 18.0163 3.05873 18.3706 4.49659 18.5599C5.92858 18.7484 7.9026 18.75 10.6363 18.75H11.3636C14.0974 18.75 16.0714 18.7484 17.5034 18.5599C18.9412 18.3706 19.6179 18.0163 19.9785 17.4991C20.3166 17.0141 20.3773 16.3855 19.9396 15.1998C19.4963 13.9986 18.6249 12.4488 17.3987 10.2747L17.035 9.62993C15.5629 7.01987 14.501 5.14148 13.527 3.90431C12.562 2.67865 11.8126 2.25 11 2.25C10.1874 2.25 9.43793 2.67865 8.47297 3.90432Z"
                fill="var(--secondsary-300)"
              />
            </svg>
            <p className="text-[var(--secondsary-300)] font-medium text-xs md:text-sm">
              Report an issue
            </p>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("description")}
            className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${
              activeTab === "description"
                ? "border-[var(--primary-500)] text-[var(--primary-500)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${
              activeTab === "comments"
                ? "border-[var(--primary-500)] text-[var(--primary-500)]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Comments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4 md:py-6 px-2 md:px-0">
        {activeTab === "description" && (
          <div>
            {/* We'll keep the title from the component data only, not duplicate it */}
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
              {videoTitle}
            </h2>

            {/* Toggle for HTML rendering approach */}
            {useDebugMode && (
              <div className="mb-3 flex items-center space-x-2">
                <span className="text-xs">Render method:</span>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    useDirectHtml
                      ? "bg-blue-500 text-[var(--font-light)]"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setUseDirectHtml(true)}
                >
                  Direct HTML
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded ${
                    !useDirectHtml
                      ? "bg-blue-500 text-[var(--font-light)]"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setUseDirectHtml(false)}
                >
                  HTML Parser
                </button>
              </div>
            )}

            {/* Reset any styles from the parent container */}
            <div className="reset-container mb-4">
              {useDirectHtml ? (
                // Direct HTML rendering approach with clean styling
                <div
                  className="course-description rendered-html-content"
                  dangerouslySetInnerHTML={{
                    __html: videoDescription
                      ? // Keep only the content inside the body tag
                        videoDescription
                          .replace(/<body[^>]*>([\s\S]*?)<\/body>/i, "$1")
                          // Remove all style tags
                          .replace(/<style[\s\S]*?<\/style>/gi, "")
                          // Remove the title as we're already showing it separately
                          .replace(/<h1[^>]*>.*?<\/h1>/i, "")
                      : "",
                  }}
                />
              ) : (
                // Parser-based approach
                <div className="course-description">
                  {videoDescription ? (
                    parseHtmlContent(videoDescription)
                  ) : (
                    <p className="text-gray-500 italic">
                      No description available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Debug toggle button */}
            {/* <div className="mt-2">
              <button
                onClick={() => setUseDebugMode(prev => !prev)}
                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                {useDebugMode ? "Hide Debug Info" : "Show Debug Info"}
              </button>
            </div> */}

            {/* {useDebugMode && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <p className="font-medium mb-1">Debug Info:</p>
                <p>Content length: {videoDescription?.length || 0} characters</p>
                <p>Content type: {typeof videoDescription}</p>
                <p>Has HTML: {videoDescription?.includes('<') ? 'Yes' : 'No'}</p>
                <p>Has body tag: {videoDescription?.includes('<body>') ? 'Yes' : 'No'}</p>
                <p className="mb-2">First 200 chars: {videoDescription?.slice(0, 200)}...</p>

                <p className="font-medium mt-3 mb-1">Raw HTML Content:</p>
                <div className="overflow-auto max-h-[300px] bg-white p-2 rounded border border-gray-300">
                  <pre className="whitespace-pre-wrap text-xs break-all">
                    {videoDescription || 'No content available'}
                  </pre>
                </div>
              </div>
            )} */}
            {/* <div className="min-w-full">

              <div
                className="prose min-w-full text-sm md:text-base px-4 md:px-6 py-3"
                dangerouslySetInnerHTML={{ __html: videoDescription }}
              />
            </div> */}
          </div>
        )}
        {activeTab === "comments" && (
          <Comments
            contentId={contentId}
            courseId={courseId}
            isDarkTheme={false}
            clientId={numericClientId}
          />
        )}
      </div>

      {/* Floating Ask AI Button */}
      {/* <FloatingAIButton onClick={() => {}} /> */}

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        clientId={numericClientId}
      />
    </div>
  );
};

export default VideoCard;
