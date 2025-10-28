/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubmoduleById } from "../../../services/enrolled-courses-content/courseContentApis";
import CourseSidebar from "../../../commonComponents/sidebar/courseSidebar/CourseSidebar";
import CourseSidebarContent from "../../../commonComponents/sidebar/courseSidebar/CourseSidebarContent";
import VideoCard from "../components/course-cards/video/VideoCard";
import QuizCard from "../components/course-cards/quiz/QuizCard";
import ArticleCard from "../components/course-cards/article/ArticleCard";
import expandSidebarIcon from "../../../assets/course_sidebar_assets/expandSidebarIcon.png";
import ProblemCard from "../components/course-cards/problem/ProblemCard";
import BackToPreviousPage from "../../../commonComponents/common-buttons/back-buttons/back-to-previous-page/BackToPreviousPage";
import SubjectiveCard from "../components/course-cards/subjective/SubjectiveCard";
import DevelopmentCard from "../components/course-cards/development/DevelopmentCard";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { ContentType } from "../../../commonComponents/sidebar/courseSidebar/component/AllContent";
import { ContentAvailability } from "../../../commonComponents/sidebar/courseSidebar/CourseSidebar";

export interface SubmoduleContent {
  content_type: ContentType;
  duration_in_minutes: number;
  id: number;
  order: number;
  title: string;
  difficulty_level?: string;
  description?: string;
  status?: string;
  marks?: number;
  obtainedMarks?: number;
  submissions?: number;
  questions?: number;
  accuracy?: number;
  progress_percentage?: number;
  details?: {
    url?: string;
    video_url?: string;
  };
}

export interface SubmoduleData {
  data: SubmoduleContent[];
  moduleName: string;
  submoduleName: string;
  submoduleId: number;
  weekNo: number;
}

// Helper function to calculate content availability
const getContentAvailability = (
  submoduleData?: SubmoduleData
): ContentAvailability => {
  if (!submoduleData?.data) {
    return {
      hasArticles: false,
      hasVideos: false,
      hasProblems: false,
      hasQuizzes: false,
      hasAssignments: false,
      hasDevelopment: false,
      hasAnyContent: false,
    };
  }

  const data = submoduleData.data;
  return {
    hasArticles: data.some((content) => content.content_type === "Article"),
    hasVideos: data.some((content) => content.content_type === "VideoTutorial"),
    hasProblems: data.some(
      (content) => content.content_type === "CodingProblem"
    ),
    hasQuizzes: data.some((content) => content.content_type === "Quiz"),
    hasAssignments: data.some(
      (content) => content.content_type === "Assignment"
    ),
    hasDevelopment: data.some(
      (content) => content.content_type === "Development"
    ),
    hasAnyContent: data.length > 0,
  };
};

const CourseTopicDetailPage: React.FC = () => {
  const { courseId, submoduleId } = useParams<{
    courseId: string;
    submoduleId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    null
  );
  const [selectedProblemId, setSelectedProblemId] = useState<
    string | undefined
  >();
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [activeSidebarLabel, setActiveSidebarLabel] = useState<string>("All");
  const [isSidebarContentOpen, setIsSidebarContentOpen] =
    useState<boolean>(true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedContentId, setSelectedContentId] = useState<
    number | undefined
  >();
  const [isSwitchingTopic, setIsSwitchingTopic] = useState(false);

  //console.log("activeSidebarLabel", activeSidebarLabel);

  // Effect to clear all cached content when switching topics/submodules
  useEffect(() => {
    if (courseId && submoduleId) {
      setIsSwitchingTopic(true);

      // Clear all content-related queries when switching to a new topic
      queryClient.removeQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            queryKey.length >= 2 &&
            (queryKey[0] === "video" ||
              queryKey[0] === "quiz" ||
              queryKey[0] === "article" ||
              queryKey[0] === "problem" ||
              queryKey[0] === "assignment" ||
              queryKey[0] === "comments" ||
              queryKey[0] === "submodule")
          );
        },
      });

      // Also clear cache more aggressively
      queryClient.invalidateQueries();
      queryClient.refetchQueries();

      // Clear window temporary data that causes stale sidebar content
      const w = window as unknown as { temporarySubmoduleData?: SubmoduleData };
      if (w.temporarySubmoduleData) {
        delete w.temporarySubmoduleData;
      }

      // Reset component state when switching topics
      setCurrentContentIndex(0);
      setSelectedVideoId(null);
      setSelectedQuizId(1);
      setSelectedArticleId(1);
      setSelectedProblemId(undefined);
      setSelectedProjectId(undefined);
      setSelectedAssignmentId(0);
      setSelectedContentId(undefined);
      setActiveSidebarLabel("All");
    }
  }, [courseId, submoduleId, queryClient]);

  // Effect to close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarContentOpen(false);
    } else if (!isMobile && !isSidebarContentOpen) {
      setIsSidebarContentOpen(true);
    }
  }, [isMobile]);

  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  // Fetch submodule data
  const {
    data: submoduleData,
    isLoading: isSubmoduleLoading,
    error: submoduleError,
  } = useQuery<SubmoduleData>({
    queryKey: ["submodule", courseId, submoduleId],
    queryFn: () =>
      getSubmoduleById(
        clientId,
        parseInt(courseId || "0"),
        parseInt(submoduleId || "0")
      ),
    enabled: !!courseId && !!submoduleId,
    // Ensure fresh data when switching between topics
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes but always refetch
  });
  // Calculate content availability
  const contentAvailability = getContentAvailability(submoduleData);

  // Reset switching state when submodule data is loaded
  useEffect(() => {
    if (submoduleData && isSwitchingTopic) {
      setIsSwitchingTopic(false);
    }
  }, [submoduleData, isSwitchingTopic]);

  // Set default selected content when submodule data changes
  useEffect(() => {
    if (submoduleData?.data && submoduleData.data.length > 0) {
      // Set the first content item as the default selected content
      const firstContent = submoduleData.data[0];
      setSelectedContentId(firstContent.id);
      setCurrentContentIndex(0);

      // Only set the first video as selected if we're in the Videos section
      if (activeSidebarLabel === "Videos") {
        const firstVideo = submoduleData.data.find(
          (content) => content.content_type === "VideoTutorial"
        );
        if (firstVideo) {
          setSelectedVideoId(firstVideo.id.toString());
          setCurrentContentIndex(submoduleData.data.indexOf(firstVideo));
          setSelectedContentId(firstVideo.id);
        }
      } else {
        // For other tabs or "All" tab, set the appropriate selected content based on the first item
        switch (firstContent.content_type) {
          case "VideoTutorial":
            setSelectedVideoId(firstContent.id.toString());
            break;
          case "CodingProblem":
            setSelectedProblemId(firstContent.id.toString());
            break;
          case "Development":
            setSelectedProjectId(firstContent.id.toString());
            break;
          case "Assignment":
            setSelectedAssignmentId(firstContent.id);
            break;
          case "Article":
            setSelectedArticleId(firstContent.id);
            break;
          case "Quiz":
            setSelectedQuizId(firstContent.id);
            break;
        }
      }

      // Find the first problem
      const firstProblem = submoduleData.data.find(
        (content) => content.content_type === "CodingProblem"
      );
      if (firstProblem) {
        setSelectedProblemId(firstProblem.id.toString());
      }

      // Find the first quiz
      const firstQuiz = submoduleData.data.find(
        (content) => content.content_type === "Quiz"
      );
      if (firstQuiz) {
        setSelectedQuizId(firstQuiz.id);
      }

      // Find the first article
      const firstArticle = submoduleData.data.find(
        (content) => content.content_type === "Article"
      );
      if (firstArticle) {
        setSelectedArticleId(firstArticle.id);
      }

      // Find the first assignment
      const firstAssignment = submoduleData.data.find(
        (content) => content.content_type === "Assignment"
      );
      if (firstAssignment) {
        setSelectedAssignmentId(firstAssignment.id);
      }

      // Find the first development project
      const firstDevelopment = submoduleData.data.find(
        (content) => content.content_type === "Development"
      );
      if (firstDevelopment) {
        setSelectedProjectId(firstDevelopment.id.toString());
      }
    }
  }, [submoduleData]); // Removed activeSidebarLabel dependency to prevent resetting index when switching tabs

  // Props objects for each content type
  const videoProps = {
    selectedVideoId,
    onVideoClick: (id: string) => {
      //console.log("Video Clicked - ID:", id);
      setSelectedVideoId(id);
      setSelectedContentId(parseInt(id));
      const videoIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (videoIndex !== undefined && videoIndex !== -1) {
        setCurrentContentIndex(videoIndex);
      }
    },
    videos: [], // Empty array since the actual videos are handled in CourseSidebarContent
  };

  const quizProps = {
    selectedQuizId,
    onSelectQuiz: (id: number) => {
      //console.log("Quiz Selected - ID:", id);
      setSelectedQuizId(id);
      setSelectedContentId(id);
      const quizIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (quizIndex !== undefined && quizIndex !== -1) {
        setCurrentContentIndex(quizIndex);
      }
    },
    quizzes: [], // Empty array since the actual quizzes are handled in CourseSidebarContent
  };

  const problemProps = {
    selectedProblemId,
    onProblemSelect: (id: string) => {
      //console.log("Problem Selected - ID:", id);
      setSelectedProblemId(id);
      setSelectedContentId(parseInt(id));
      const problemIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (problemIndex !== undefined && problemIndex !== -1) {
        setCurrentContentIndex(problemIndex);
      }
    },
    problems: [], // Empty array since the actual problems are handled in CourseSidebarContent
  };

  const articleProps = {
    selectedArticleId,
    onArticleClick: (id: number) => {
      //console.log("Article Selected - ID:", id);
      setSelectedArticleId(id);
      setSelectedContentId(id);
      const articleIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (articleIndex !== undefined && articleIndex !== -1) {
        setCurrentContentIndex(articleIndex);
      }
    },
    articles: [], // Empty array since the actual articles are handled in CourseSidebarContent
  };

  const developmentProps = {
    selectedProjectId,
    onProjectSelect: (id: string) => {
      //console.log("Project Selected - ID:", id);
      setSelectedProjectId(id);
      setSelectedContentId(parseInt(id));
      const projectIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (projectIndex !== undefined && projectIndex !== -1) {
        setCurrentContentIndex(projectIndex);
      }
    },
  };

  const subjectiveProps = {
    selectedAssignmentId,
    onAssignmentClick: (id: number) => {
      //console.log("Assignment Selected - ID:", id);
      setSelectedAssignmentId(id);
      setSelectedContentId(id);
      const assignmentIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (assignmentIndex !== undefined && assignmentIndex !== -1) {
        setCurrentContentIndex(assignmentIndex);
      }
    },
    assignments: [], // Empty array since the actual assignments are handled in CourseSidebarContent
  };

  // Handle navigation to next content item
  const nextContent = () => {
    if (!submoduleData?.data) return;

    const nextIndex = currentContentIndex + 1;
    if (nextIndex < submoduleData.data.length) {
      setCurrentContentIndex(nextIndex);

      // Get the next content item
      const nextContentItem = submoduleData.data[nextIndex];

      // Update the selected content ID for sidebar highlighting
      setSelectedContentId(nextContentItem.id);

      // Update the appropriate selected ID based on the content type
      switch (nextContentItem.content_type) {
        case "VideoTutorial":
          setSelectedVideoId(nextContentItem.id.toString());
          break;
        case "CodingProblem":
          setSelectedProblemId(nextContentItem.id.toString());
          break;
        case "Development":
          setSelectedProjectId(nextContentItem.id.toString());
          break;
        case "Assignment":
          setSelectedAssignmentId(nextContentItem.id);
          break;
        case "Article":
          setSelectedArticleId(nextContentItem.id);
          break;
        case "Quiz":
          setSelectedQuizId(nextContentItem.id);
          break;
      }
    }
  };

  const getNextTopicTitle = () => {
    return (
      submoduleData?.data?.[currentContentIndex + 1]?.title || "Next Content"
    );
  };

  // Handle sidebar label selection
  const handleSidebarLabelSelect = (label: string) => {
    // Only change the activeSidebarLabel if it's a direct sidebar label click
    if (label !== activeSidebarLabel) {
      setActiveSidebarLabel(label);
    }

    // Make sure the sidebar is open when switching tabs
    setIsSidebarContentOpen(true);

    // Find the first content of the selected type
    const firstContent = submoduleData?.data?.find((content) => {
      switch (label) {
        case "All":
          return true;
        case "Videos":
          return content.content_type === "VideoTutorial";
        case "Problems":
          return content.content_type === "CodingProblem";
        case "Development":
          return content.content_type === "Development";
        case "Subjective":
          return content.content_type === "Assignment";
        case "Article":
          return content.content_type === "Article";
        case "Quiz":
          return content.content_type === "Quiz";
        default:
          return false;
      }
    });

    if (firstContent) {
      // Clear cache for the previous content when switching content types
      if (
        selectedContentId &&
        selectedContentId !== firstContent.id &&
        courseId
      ) {
        const queryKeyMap = {
          VideoTutorial: "video",
          CodingProblem: "problem",
          Development: "development",
          Assignment: "assignment",
          Article: "article",
          Quiz: "quiz",
        };

        // Find the previous content type to clear its cache
        const previousContent = submoduleData?.data?.find(
          (content) => content.id === selectedContentId
        );
        if (previousContent) {
          const previousQueryType =
            queryKeyMap[
              previousContent.content_type as keyof typeof queryKeyMap
            ];
          if (previousQueryType) {
            queryClient.removeQueries({
              queryKey: [
                previousQueryType,
                parseInt(courseId),
                selectedContentId,
              ],
            });
          }
        }
      }

      const contentIndex = submoduleData?.data?.indexOf(firstContent) ?? 0;
      setCurrentContentIndex(contentIndex);
      setSelectedContentId(firstContent.id);

      // Update the selected ID based on the content type
      switch (label) {
        case "Videos":
          setSelectedVideoId(firstContent.id.toString());
          break;
        case "Problems":
          setSelectedProblemId(firstContent.id.toString());
          break;
        case "Development":
          setSelectedProjectId(firstContent.id.toString());
          break;
        case "Subjective":
          setSelectedAssignmentId(firstContent.id);
          break;
        case "Article":
          setSelectedArticleId(firstContent.id);
          break;
        case "Quiz":
          setSelectedQuizId(firstContent.id);
          break;
      }
    }
  };

  const handleContentSelect = (
    contentId: number,
    contentType:
      | "VideoTutorial"
      | "CodingProblem"
      | "Development"
      | "Assignment"
      | "Article"
      | "Quiz"
  ) => {
    // Close sidebar on second click of the same content (for all tabs)
    if (selectedContentId === contentId) {
      setIsSidebarContentOpen(false);
      return; // Don't proceed if it's the same content
    }

    // Clear cache for the previous content to prevent stale data
    if (selectedContentId && selectedContentId !== contentId && courseId) {
      const queryKeyMap = {
        VideoTutorial: "video",
        CodingProblem: "problem",
        Development: "development",
        Assignment: "assignment",
        Article: "article",
        Quiz: "quiz",
      };

      // Find the previous content type to clear its cache
      const previousContent = submoduleData?.data?.find(
        (content) => content.id === selectedContentId
      );
      if (previousContent) {
        const previousQueryType =
          queryKeyMap[previousContent.content_type as keyof typeof queryKeyMap];
        if (previousQueryType) {
          queryClient.removeQueries({
            queryKey: [
              previousQueryType,
              parseInt(courseId),
              selectedContentId,
            ],
          });
        }
      }
    }

    const foundIndex =
      submoduleData?.data?.findIndex((content) => content.id === contentId) ??
      0;

    // Update states immediately
    setSelectedContentId(contentId);
    setCurrentContentIndex(foundIndex);

    // Update the selected ID based on the content type without changing activeSidebarLabel
    switch (contentType) {
      case "VideoTutorial":
        setSelectedVideoId(contentId.toString());
        break;
      case "CodingProblem":
        setSelectedProblemId(contentId.toString());
        break;
      case "Development":
        setSelectedProjectId(contentId.toString());
        break;
      case "Assignment":
        setSelectedAssignmentId(contentId);
        break;
      case "Article":
        setSelectedArticleId(contentId);
        break;
      case "Quiz":
        setSelectedQuizId(contentId);
        break;
    }
  };

  // Function to update video progress
  const updateVideoProgress = (
    videoId: string,
    progressPercent: number
  ): void => {
    if (submoduleData?.data) {
      const updatedData = [...submoduleData.data];
      const videoIndex = updatedData.findIndex(
        (content) =>
          content.content_type === "VideoTutorial" &&
          content.id.toString() === videoId
      );

      if (videoIndex !== -1) {
        // Mark as complete if progress ≥ 95%
        if (progressPercent >= 95) {
          updatedData[videoIndex] = {
            ...updatedData[videoIndex],
            status: "complete",
          };
        } else if (progressPercent > 0) {
          // Mark as in_progress with progress percentage
          updatedData[videoIndex] = {
            ...updatedData[videoIndex],
            status: "in_progress",
            progress_percentage: progressPercent,
          };
        }

        // Update submodule data with new progress
        // Note: In a real app, this would call an API to persist progress
        // For this demo, we're just updating the local state
        if (submoduleData) {
          const newSubmoduleData: SubmoduleData = {
            ...submoduleData,
            data: updatedData,
          };
          // This line would trigger a re-render of all components using submoduleData
          // In a real app, you'd use a state management system or context API
          const w = window as unknown as {
            temporarySubmoduleData: SubmoduleData;
          };
          w.temporarySubmoduleData = newSubmoduleData;

          // Force re-render sidebar components
          setSelectedVideoId((prevId) => {
            if (prevId === videoId) return prevId; // No change to avoid unnecessary re-renders
            return videoId; // Change to force re-render
          });

          // Invalidate queries to refresh sidebar data immediately (similar to quiz/problem submission)
          queryClient.invalidateQueries({
            queryKey: ["submodule", courseId, submoduleId],
          });
        }
      }
    }
  };

  const updateQuizStatus = (quizId: number, status: string): void => {
    if (submoduleData?.data) {
      const updatedData = [...submoduleData.data];
      const quizIndex = updatedData.findIndex(
        (content) => content.content_type === "Quiz" && content.id === quizId
      );
      console.log("Quiz Index:", quizIndex, quizId);
      if (quizIndex !== -1) {
        updatedData[quizIndex] = {
          ...updatedData[quizIndex],
          status: status,
        };

        // Update submodule data with new status
        if (submoduleData) {
          const newSubmoduleData: SubmoduleData = {
            ...submoduleData,
            data: updatedData,
          };
          // This line would trigger a re-render of all components using submoduleData
          // In a real app, you'd use a state management system or context API
          const w = window as unknown as {
            temporarySubmoduleData: SubmoduleData;
          };
          w.temporarySubmoduleData = newSubmoduleData;

          // Force re-render sidebar components
          setSelectedQuizId((prevId) => {
            if (prevId === quizId) return prevId; // No change to avoid unnecessary re-renders
            return quizId; // Change to force re-render
          });
        }
      }
    }
  };
  // Update the updateProblemStatus function to take an optional parameter to skip API calls
  const updateProblemStatus = (
    problemId: string,
    status: string,
    updateBackend: boolean = true
  ): void => {
    //console.log(`Updating problem ${problemId} status to ${status}, updateBackend=${updateBackend}`);

    if (submoduleData?.data) {
      const updatedData = [...submoduleData.data];
      const problemIndex = updatedData.findIndex(
        (content) =>
          content.content_type === "CodingProblem" &&
          content.id.toString() === problemId
      );

      if (problemIndex !== -1) {
        //console.log(`Found problem at index ${problemIndex}`);
        // First update the state in memory for immediate UI feedback
        updatedData[problemIndex] = {
          ...updatedData[problemIndex],
          status: status,
        };

        // Update submodule data with new status
        if (submoduleData) {
          const newSubmoduleData: SubmoduleData = {
            ...submoduleData,
            data: updatedData,
          };

          // Local update for immediate UI feedback
          const w = window as unknown as {
            temporarySubmoduleData: SubmoduleData;
          };
          w.temporarySubmoduleData = newSubmoduleData;

          // Force re-render sidebar components
          setSelectedProblemId((prevId) => {
            if (prevId === problemId) return prevId; // No change to avoid unnecessary re-renders
            return problemId; // Change to force re-render
          });

          // Then make API call to persist the change in the backend if requested
          if (updateBackend) {
            //console.log(`Making API call to update problem ${problemId} status to ${status}`);
          }
        }
      } else {
        //console.error(`Problem with ID ${problemId} not found in submoduleData`);
      }
    } else {
      //console.error("No submoduleData available");
    }
  };

  const handleStartNextQuiz = () => {
    if (!submoduleData?.data) return;
    // Get all quizzes sorted by order
    const quizzes = submoduleData.data
      .filter((c) => c.content_type === "Quiz")
      .sort((a, b) => a.order - b.order);
    const currentQuizIdx = quizzes.findIndex((q) => q.id === currentContent.id);

    // Try to go to the next quiz
    if (currentQuizIdx !== -1 && currentQuizIdx < quizzes.length - 1) {
      const nextQuiz = quizzes[currentQuizIdx + 1];
      setCurrentContentIndex(
        submoduleData.data.findIndex((c) => c.id === nextQuiz.id)
      );
      setSelectedQuizId(nextQuiz.id);
      setSelectedContentId(nextQuiz.id);
      return;
    }

    // If no next quiz, go to the next content (of any type)
    const nextIndex = currentContentIndex + 1;
    if (nextIndex < submoduleData.data.length) {
      setCurrentContentIndex(nextIndex);
      const nextContent = submoduleData.data[nextIndex];
      setSelectedContentId(nextContent.id);
      // Optionally update the selected ID for the next content type
      switch (nextContent.content_type) {
        case "Quiz":
          setSelectedQuizId(nextContent.id);
          break;
        case "VideoTutorial":
          setSelectedVideoId(nextContent.id.toString());
          break;
        case "CodingProblem":
          setSelectedProblemId(nextContent.id.toString());
          break;
        case "Development":
          setSelectedProjectId(nextContent.id.toString());
          break;
        case "Assignment":
          setSelectedAssignmentId(nextContent.id);
          break;
        case "Article":
          setSelectedArticleId(nextContent.id);
          break;
      }
    } else {
      // Optionally, show a message: No more content
    }
  };

  if (isSubmoduleLoading) {
    return <div>Loading...</div>;
  }

  if (submoduleError || !submoduleData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl mb-4">Topic not found</p>
        <button
          className="px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-xl cursor-pointer"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    );
  }

  // Find the current content item
  const currentContent = submoduleData.data[currentContentIndex];

  return (
    <div
      style={{ paddingBottom: isMobile ? "calc(60px + 1.5rem)" : "2rem" }}
      className="relative min-h-screen"
    >
      <BackToPreviousPage />

      <div className="flex flex-col md:flex-row mt-4 relative">
        {/* Sidebar container - only shown as content panel on desktop */}
        {!isMobile && (
          <div className="flex">
            <CourseSidebar
              activeLabel={activeSidebarLabel}
              onSelect={handleSidebarLabelSelect}
              contentAvailability={contentAvailability}
            />
            {isSidebarContentOpen && (
              <CourseSidebarContent
                submoduleData={isSwitchingTopic ? undefined : submoduleData}
                activeLabel={activeSidebarLabel}
                onClose={() => setIsSidebarContentOpen(false)}
                videoProps={videoProps}
                quizProps={quizProps}
                articleProps={articleProps}
                problemProps={problemProps}
                developmentProps={developmentProps}
                subjectiveProps={subjectiveProps}
                selectedContentId={selectedContentId}
                onContentSelect={handleContentSelect}
              />
            )}
          </div>
        )}

        {/* Mobile sidebar content panel - shown as an overlay */}
        {isMobile && isSidebarContentOpen && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsSidebarContentOpen(false)}
            ></div>
            <div className="absolute right-0 top-0 h-full w-[90vw] max-w-[350px] z-50">
              <CourseSidebarContent
                submoduleData={isSwitchingTopic ? undefined : submoduleData}
                activeLabel={activeSidebarLabel}
                onClose={() => setIsSidebarContentOpen(false)}
                videoProps={videoProps}
                quizProps={quizProps}
                articleProps={articleProps}
                problemProps={problemProps}
                developmentProps={developmentProps}
                subjectiveProps={subjectiveProps}
                selectedContentId={selectedContentId}
                onContentSelect={handleContentSelect}
              />
            </div>
          </div>
        )}

        {/* Button to expand sidebar when collapsed (non-mobile) */}
        {!isMobile && !isSidebarContentOpen && (
          <button
            onClick={() => setIsSidebarContentOpen(true)}
            className="absolute top-5 left-[100px] bg-white rounded-full shadow-md p-2 hover:bg-gray-100 transition z-10 cursor-pointer"
            title="Expand Sidebar"
          >
            <img src={expandSidebarIcon} alt="Expand" className="w-5 h-5" />
          </button>
        )}

        {/* Main Content */}
        <div
          className={`flex-1 mt-6 px-4 md:px-0 ${
            isMobile ? "w-full mb-4" : ""
          } ${
            isSidebarContentOpen && !isMobile ? "md:ml-12" : ""
          } overflow-hidden`}
        >
          {isMobile && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--primary-500)]">
                {currentContent.title}
              </h2>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>{`Week ${submoduleData.weekNo}`}</span>
                <span>•</span>
                <span>{currentContent.content_type}</span>
              </div>
            </div>
          )}

          {/* Floating button to open sidebar content on mobile */}
          {isMobile && (
            <button
              onClick={() => setIsSidebarContentOpen(true)}
              className="fixed top-20 right-4 z-20 bg-[var(--primary-500)] text-[var(--font-light)] rounded-full shadow-md p-3 hover:bg-[#1a4057] transition"
              title="Open Course Contents"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
          )}

          {/* Content display based on active tab */}
          <div
            key={`content-${currentContent?.id}-${currentContent?.content_type}`}
            className={`mb-20 md:mb-0 ${
              !isSidebarContentOpen ? "ml-12" : ""
            } animate-fadeIn`}
          >
            {currentContent?.content_type === "VideoTutorial" && (
              <VideoCard
                key={`video-${submoduleId}-${currentContent.id}`}
                currentWeek={{
                  title: `Week ${submoduleData?.weekNo || 1}`,
                }}
                currentTopic={{ title: currentContent.title }}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                nextContent={nextContent}
                getNextTopicTitle={getNextTopicTitle}
                onComplete={() => {
                  updateVideoProgress(currentContent.id.toString(), 100);
                }}
                onProgressUpdate={(videoId, progress) => {
                  updateVideoProgress(videoId, progress);
                }}
              />
            )}
            {currentContent?.content_type === "CodingProblem" && (
              <ProblemCard
                key={`problem-${submoduleId}-${currentContent.id}`}
                isSidebarContentOpen={isSidebarContentOpen}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                onSubmit={() => {
                  //console.log("Submitted code:", code);
                }}
                onComplete={() => {
                  //console.log("Problem completed!");
                  updateProblemStatus(currentContent.id.toString(), "complete");
                }}
              />
            )}
            {currentContent?.content_type === "Quiz" && (
              <QuizCard
                key={`quiz-${submoduleId}-${currentContent.id}`}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                submoduleId={submoduleId}
                isSidebarContentOpen={isSidebarContentOpen}
                onStartNextQuiz={handleStartNextQuiz}
                onComplete={() => {
                  updateQuizStatus(currentContent.id, "complete");
                }}
              />
            )}
            {currentContent?.content_type === "Article" && (
              <ArticleCard
                key={`article-${submoduleId}-${currentContent.id}`}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                onMarkComplete={() => {
                  //console.log("Marked as completed");
                  updateProblemStatus(currentContent.id.toString(), "complete");
                }}
              />
            )}
            {currentContent?.content_type === "Assignment" && (
              <SubjectiveCard
                key={`assignment-${submoduleId}-${currentContent.id}`}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
              />
            )}
            {currentContent?.content_type === "Development" && (
              <DevelopmentCard
                projectId={selectedProjectId || "dev1"}
                title="Development Project"
                description="Project description"
                initialHtml=""
                initialCss=""
                initialJs=""
                difficulty="Medium"
                onSubmit={(html, css, js) => {
                  console.log("Submitted development project:", {
                    html,
                    css,
                    js,
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <CourseSidebar
            activeLabel={activeSidebarLabel}
            onSelect={handleSidebarLabelSelect}
            contentAvailability={contentAvailability}
          />
        </div>
      )}
    </div>
  );
};

export default CourseTopicDetailPage;
