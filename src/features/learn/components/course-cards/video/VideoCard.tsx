import React, { useState, useEffect } from "react";
import VideoPlayer from "../../video-player/VideoPlayer";
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseContent, getCommentsByContentId, createComment } from "../../../../../services/courses-content/courseContentApis";

interface VideoCardProps {
  currentWeek: { title: string };
  currentTopic: { title: string };
  contentId: number;
  courseId: number;
  nextContent: () => void;
  getNextTopicTitle: () => string;
}

// Define interface for the API response data
interface CourseContentDetails {
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

interface Comment {
  id: number;
  client: number;
  content: number;
  course: number;
  created_at: string;
  dislikes: number;
  likes: number;
  text: string;
  user_profile: number;
}

// Define a sample Vimeo URL for testing
const SAMPLE_VIMEO_URL = "https://player.vimeo.com/video/1048123643?badge=0&autopause=0&player_id=0&app_id=58479";

const VideoCard: React.FC<VideoCardProps> = ({
  currentWeek,
  currentTopic,
  contentId,
  courseId,
  nextContent,
  getNextTopicTitle,
}) => {
  const [activeTab, setActiveTab] = useState<"description" | "comments">("description");
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string>("");
  const [useDebugMode, setUseDebugMode] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [visibleComments, setVisibleComments] = useState(4);
  const queryClient = useQueryClient();

  // Log component props for debugging
  useEffect(() => {
    console.log('VideoCard - Component Props:', {
      contentId,
      courseId,
      isQueryEnabled: !!contentId && !!courseId
    });

    // Check for potential issues with the API parameters
    if (contentId === undefined || contentId === null || contentId <= 0) {
      console.error('VideoCard - Invalid contentId:', contentId);
    }
    if (courseId === undefined || courseId === null || courseId <= 0) {
      console.error('VideoCard - Invalid courseId:', courseId);
    }
  }, [contentId, courseId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['video', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
    retry: 3,
    retryDelay: 1000,
  });

  // Process the video URL when data changes
  useEffect(() => {
    // If in debug mode, use sample URL
    if (useDebugMode) {
      setProcessedVideoUrl(SAMPLE_VIMEO_URL);
      return;
    }

    if (!data) {
      console.log('VideoCard - No data returned from API');
      return;
    }

    // Log detailed info about response
    console.log('VideoCard - Full API response:', data);
    console.log('VideoCard - Response structure:', {
      responseType: typeof data,
      hasDetails: !!(data as CourseContentResponse).details,
      hasVideoUrl: !!(data as CourseContentResponse).details?.video_url,
      availableFields: Object.keys(data as CourseContentResponse)
    });

    // Type assertion - we know the structure at this point
    const responseData = data as CourseContentResponse;

    // Check if details object exists
    if (!responseData.details) {
      console.log('VideoCard - Missing details object in response data');
      return;
    }

    // Process video URL from response data
    if (!responseData.details.video_url) {
      console.log('VideoCard - Missing video_url in details object');
      return;
    }

    const videoUrl = String(responseData.details.video_url);
    console.log('VideoCard - Original Video URL:', videoUrl);

    // Process the URL
    let processedUrl = videoUrl;

    // Clean HTML entities
    processedUrl = processedUrl.replace(/&amp;/g, '&');

    // Handle Vimeo URLs
    if (processedUrl.includes('vimeo.com') && !processedUrl.includes('player.vimeo.com')) {
      const vimeoRegex = /vimeo.com\/(\d+)/;
      const match = processedUrl.match(vimeoRegex);

      if (match && match[1]) {
        const videoId = match[1];
        processedUrl = `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`;
        console.log('VideoCard - Converted to player URL:', processedUrl);
      }
    }

    console.log('VideoCard - Final Processed URL:', processedUrl);
    setProcessedVideoUrl(processedUrl);

  }, [data, useDebugMode]);

  // Fetch comments
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['comments', contentId],
    queryFn: () => getCommentsByContentId(1, courseId, contentId),
    enabled: !!contentId && !!courseId && activeTab === "comments",
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (comment: string) => createComment(1, courseId, contentId, comment),
    onSuccess: () => {
      // Invalidate and refetch comments after successful post
      queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
      setNewComment("");
    },
    onError: (error) => {
      console.error('Failed to post comment:', error);
      // You can add error handling here if needed
    }
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      try {
        await createCommentMutation.mutateAsync(newComment.trim());
      } catch (error) {
        console.error('Error posting comment:', error);
      }
    }
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
    console.error('VideoCard - Error loading data:', error);
    return (
      <div className="text-red-500 p-4">
        <div>Error loading video: {String(error)}</div>
        <button
          className="mt-4 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => setUseDebugMode(true)}
        >
          Try Debug Mode
        </button>
      </div>
    );
  }

  // If no data or missing video_url, show message with debug option
  if ((!data || !(data as CourseContentResponse).details?.video_url) && !useDebugMode) {
    return (
      <div className="text-gray-500 p-4">
        <div>No video content available.</div>
        <div className="mt-2 text-xs text-gray-400">
          Content ID: {contentId}, Course ID: {courseId}
        </div>
        <button
          className="mt-4 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => setUseDebugMode(true)}
        >
          Try Debug Mode
        </button>
      </div>
    );
  }

  // Get video title and description (from data or use defaults)
  const videoTitle = useDebugMode
    ? 'Debug Video'
    : ((data as CourseContentResponse)?.details?.title || currentTopic.title);

  const videoDescription = useDebugMode
    ? 'This is a debug video to test the Vimeo player functionality.'
    : ((data as CourseContentResponse)?.details?.description || '');

  return (
    <div className="flex-1 max-w-full">
      {/* Week and Topic Navigation */}
      <div className="bg-gray-100 p-3 md:p-4 rounded-t-2xl">
        <div className="flex items-center space-x-2 text-sm md:text-base overflow-hidden">
          <span className="text-gray-500 whitespace-nowrap">{currentWeek.title}</span>
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
        onComplete={nextContent}
      />

      {/* Next Button */}
      <div className="bg-gray-100 p-3 md:p-4 flex justify-end">
        <button
          onClick={nextContent}
          className="px-3 md:px-4 py-2 bg-[#255C79] text-white text-sm md:text-base rounded-xl flex items-center cursor-pointer"
        >
          <span className="truncate max-w-[150px] md:max-w-none">Next: {getNextTopicTitle()}</span>
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
          <button className="flex items-center text-blue-500 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-sm md:text-base">368</span>
          </button>
          <button className="flex items-center text-gray-500 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
          </button>
        </div>
        <div>
          <button className="flex flex-row gap-2 md:gap-3 cursor-pointer">
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
                fill="#AE0606"
              />
              <path
                d="M11 15.5C11.5523 15.5 12 15.0523 12 14.5C12 13.9477 11.5523 13.5 11 13.5C10.4477 13.5 9.99998 13.9477 9.99998 14.5C9.99998 15.0523 10.4477 15.5 11 15.5Z"
                fill="#AE0606"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M7.2944 2.97643C8.36631 1.61493 9.50182 0.75 11 0.75C12.4981 0.75 13.6336 1.61493 14.7056 2.97643C15.7598 4.31544 16.8769 6.29622 18.3063 8.83053L18.7418 9.60267C19.9234 11.6976 20.8566 13.3523 21.3468 14.6804C21.8478 16.0376 21.9668 17.2699 21.209 18.3569C20.4736 19.4118 19.2466 19.8434 17.6991 20.0471C16.1576 20.25 14.0845 20.25 11.4248 20.25H10.5752C7.91552 20.25 5.84239 20.25 4.30082 20.0471C2.75331 19.8434 1.52637 19.4118 0.790989 18.3569C0.0331793 17.2699 0.152183 16.0376 0.653135 14.6804C1.14334 13.3523 2.07658 11.6977 3.25818 9.6027L3.69361 8.83067C5.123 6.29629 6.24019 4.31547 7.2944 2.97643ZM8.47297 3.90432C7.49896 5.14148 6.43704 7.01988 4.96495 9.62994L4.60129 10.2747C3.37507 12.4488 2.50368 13.9986 2.06034 15.1998C1.6227 16.3855 1.68338 17.0141 2.02148 17.4991C2.38202 18.0163 3.05873 18.3706 4.49659 18.5599C5.92858 18.7484 7.9026 18.75 10.6363 18.75H11.3636C14.0974 18.75 16.0714 18.7484 17.5034 18.5599C18.9412 18.3706 19.6179 18.0163 19.9785 17.4991C20.3166 17.0141 20.3773 16.3855 19.9396 15.1998C19.4963 13.9986 18.6249 12.4488 17.3987 10.2747L17.035 9.62993C15.5629 7.01987 14.501 5.14148 13.527 3.90431C12.562 2.67865 11.8126 2.25 11 2.25C10.1874 2.25 9.43793 2.67865 8.47297 3.90432Z"
                fill="#AE0606"
              />
            </svg>
            <p className="text-[#AE0606] font-medium text-xs md:text-sm">
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
            className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === "description"
              ? "border-[#255C79] text-[#255C79]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm ${activeTab === "comments"
              ? "border-[#255C79] text-[#255C79]"
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
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
              {videoTitle}
            </h2>
            <p className="mb-4 text-sm md:text-base">
              {videoDescription}
            </p>

            <h3 className="text-md md:text-lg font-bold mt-4 md:mt-6 mb-2">What is an Array??</h3>
            <p className="mb-4 text-sm md:text-base">
              An array is a collection of items of the same data type stored at
              contiguous memory locations...
            </p>

            <div className="border rounded-lg p-3 md:p-4 my-4 md:my-6 overflow-x-auto">
              <h4 className="font-bold mb-2 text-sm md:text-base">Array Elements</h4>
              <div className="flex justify-center">
                <div className="flex">
                  {[2, 4, 10, 5, 5, 3].map((num, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 md:w-12 md:h-12 bg-gray-200 flex items-center justify-center border border-gray-300 text-xs md:text-base"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5, 6].map((index, i) => (
                    <div
                      key={i}
                      className="w-8 md:w-12 h-6 md:h-8 flex items-center justify-center text-xs md:text-base"
                    >
                      {index}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-2 text-xs md:text-sm">Array Indexes</div>
            </div>

            <h3 className="text-md md:text-lg font-bold mt-4 md:mt-6 mb-2">
              This video will enlighten you with the following concepts:
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-sm md:text-base">
              <li>Introduction to the World of Arrays</li>
              <li>What is an Array?</li>
              <li>Use of an Array</li>
              <li>Memory Allocation in Arrays</li>
              <li>Advantages of using Array</li>
              <li>Random Access</li>
              <li>Cache Friendliness</li>
              <li>Declaration and Initialization of an Array</li>
              <li>In C++</li>
              <li>In Java</li>
            </ul>
          </div>
        )}
        {activeTab === "comments" && (
          <div className="space-y-6">
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[border-gray-300] focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="px-4 py-2 bg-[#255C79] text-white rounded-lg hover:bg-[#1e4a61] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : commentsData?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {commentsData?.slice(0, visibleComments).map((comment: Comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="mt-1 text-sm text-gray-700">{comment.text}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 mt-2">
                          <button className="flex items-center text-gray-500 hover:text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span className="text-xs">{comment.likes}</span>
                          </button>
                          <button className="flex items-center text-gray-500 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            <span className="text-xs">{comment.dislikes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {commentsData && commentsData.length > visibleComments && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setVisibleComments(prev => prev + 4)}
                      className="px-4 py-2 text-sm text-[#255C79] hover:text-[#1e4a61] font-medium flex items-center space-x-1"
                    >
                      <span>See more comments</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Ask AI Button */}
      <FloatingAIButton
        onClick={() => console.log("Floating AI Button clicked")}
      />
    </div>
  );
};

export default VideoCard;
