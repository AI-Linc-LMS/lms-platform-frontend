/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
import StreakCongratulationsModal from "../../../components/StreakCongratulationsModal";
import { useMonthlyStreakCongrats } from "../../../hooks/useMonthlyStreakCongrats";
import { STREAK_QUERY_KEY } from "../hooks/useStreakData";

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
  const [isProblemFullScreen, setIsProblemFullScreen] =
    useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  // Get stored selectedContentId from sessionStorage on mount
  const getStoredContentId = (): number | undefined => {
    if (!courseId || !submoduleId) return undefined;
    const key = `selectedContent-${courseId}-${submoduleId}`;
    const stored = sessionStorage.getItem(key);
    return stored ? parseInt(stored, 10) : undefined;
  };

  const [selectedContentId, setSelectedContentId] = useState<
    number | undefined
  >(() => getStoredContentId());
  const [isSwitchingTopic, setIsSwitchingTopic] = useState(false);
  // Track if we've initialized for the current submodule to prevent resetting
  const initializedSubmoduleRef = useRef<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  // Track the data hash to detect actual data changes (not just refetches)
  const lastDataHashRef = useRef<string | null>(null);
  // Track last progress update time to throttle updates
  const lastProgressUpdateRef = useRef<number>(0);
  const lastProgressPercentRef = useRef<number>(0);
  const progressUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Store selectedContentId in sessionStorage whenever it changes
  useEffect(() => {
    if (courseId && submoduleId && selectedContentId) {
      const key = `selectedContent-${courseId}-${submoduleId}`;
      sessionStorage.setItem(key, selectedContentId.toString());
    }
  }, [selectedContentId, courseId, submoduleId]);

  // Effect to clear all cached content when switching topics/submodules
  useEffect(() => {
    if (courseId && submoduleId) {
      const submoduleKey = `${courseId}-${submoduleId}`;

      // Only reset if we're actually switching to a different submodule
      if (initializedSubmoduleRef.current !== submoduleKey) {
        setIsSwitchingTopic(true);
        hasInitializedRef.current = false; // Reset initialization flag for new submodule
        lastDataHashRef.current = null; // Reset data hash for new submodule
        // Reset progress tracking refs when switching submodules
        lastProgressUpdateRef.current = 0;
        lastProgressPercentRef.current = 0;
        if (progressUpdateTimeoutRef.current) {
          clearTimeout(progressUpdateTimeoutRef.current);
          progressUpdateTimeoutRef.current = null;
        }

        // Don't clear queries - let React Query handle cache with staleTime
        // This prevents unnecessary refetches and page refreshes
        // React Query will automatically fetch new data when query key changes

        // Clear window temporary data that causes stale sidebar content
        const w = window as unknown as {
          temporarySubmoduleData?: SubmoduleData;
        };
        if (w.temporarySubmoduleData) {
          delete w.temporarySubmoduleData;
        }

        // DON'T reset selectedContentId here - let the initialization effect handle it
        // This preserves selection when navigating back to the same submodule
        setActiveSidebarLabel("All");

        // Update the ref to track current submodule
        initializedSubmoduleRef.current = submoduleKey;
      }
    }
  }, [courseId, submoduleId]);

  // Effect to close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarContentOpen(false);
    } else if (!isMobile && !isSidebarContentOpen) {
      setIsSidebarContentOpen(true);
    }
  }, [isMobile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, []);

  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const streakQueryKey = clientId ? [STREAK_QUERY_KEY, clientId] : null;

  // Hook for streak congratulations modal
  const {
    shouldShow: shouldShowStreakCongrats,
    markShown: markStreakCongratsShown,
    currentStreak,
    completionDate,
    refetch: refetchMonthlyStreak,
  } = useMonthlyStreakCongrats();

  const triggerStreakRefresh = useCallback(() => {
    if (!streakQueryKey) return;

    queryClient.invalidateQueries({ queryKey: streakQueryKey });
    queryClient.refetchQueries({ queryKey: streakQueryKey, type: "active" });
  }, [queryClient, streakQueryKey]);

  // Refetch monthly streak after content completion with a small delay
  const refetchStreakAfterCompletion = useCallback(async () => {
    // Wait a bit for backend to process the completion and update streak
    await new Promise((resolve) => setTimeout(resolve, 500));
    await refetchMonthlyStreak();
  }, [refetchMonthlyStreak]);
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
    staleTime: 1000 * 60 * 10, // 10 minutes - cache data to reduce unnecessary refetches
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache for faster navigation
    refetchOnWindowFocus: false, // Prevent refetch when window regains focus
    // refetchOnMount will automatically handle URL changes (new query key = new query)
    // but won't refetch if data exists and is fresh (staleTime)
    refetchOnReconnect: false, // Prevent refetch on reconnect
  });
  // Calculate content availability
  const contentAvailability = getContentAvailability(submoduleData);

  // Reset switching state when submodule data is loaded
  useEffect(() => {
    if (submoduleData && isSwitchingTopic) {
      setIsSwitchingTopic(false);
    }
  }, [submoduleData, isSwitchingTopic]);

  // Set default selected content only on initial load (preserve selection across updates)
  useEffect(() => {
    if (!submoduleData?.data || submoduleData.data.length === 0) return;
    if (!courseId || !submoduleId) return;

    const submoduleKey = `${courseId}-${submoduleId}`;
    const storageKey = `selectedContent-${courseId}-${submoduleId}`;

    // Create a stable hash of the data to detect actual changes (not just refetches)
    const dataHash = submoduleData.data.map((c) => c.id).join(",");
    const isDataChanged = lastDataHashRef.current !== dataHash;

    // If we've already initialized for this submodule AND data hasn't changed, just sync - NEVER reset
    if (
      hasInitializedRef.current &&
      initializedSubmoduleRef.current === submoduleKey &&
      !isDataChanged
    ) {
      // Always sync index with selectedContentId, but NEVER change selectedContentId
      if (selectedContentId) {
        const foundIndex = submoduleData.data.findIndex(
          (content) => content.id === selectedContentId
        );
        if (foundIndex !== -1 && foundIndex !== currentContentIndex) {
          setCurrentContentIndex(foundIndex);
        }
      }
      return; // CRITICAL: Exit early - never reset after initialization
    }

    // Update data hash
    lastDataHashRef.current = dataHash;

    // SAFEGUARD: If we have a valid selectedContentId that exists in data,
    // and it matches sessionStorage, we've already initialized - just mark as initialized
    const storedId = sessionStorage.getItem(storageKey);
    if (storedId && selectedContentId) {
      const parsedStoredId = parseInt(storedId, 10);
      if (parsedStoredId === selectedContentId) {
        const contentExists = submoduleData.data.some(
          (content) => content.id === selectedContentId
        );
        if (contentExists) {
          // We have a valid selection that matches storage - just sync and mark as initialized
          const foundIndex = submoduleData.data.findIndex(
            (content) => content.id === selectedContentId
          );
          if (foundIndex !== -1) {
            setCurrentContentIndex(foundIndex);
            hasInitializedRef.current = true;
            initializedSubmoduleRef.current = submoduleKey;
            return; // Don't reset, we're already good
          }
        }
      }
    }

    // Only initialize once per submodule - this is the ONLY place we set initial values
    hasInitializedRef.current = true;
    initializedSubmoduleRef.current = submoduleKey;

    // ALWAYS check sessionStorage first, then state, then default to first
    let contentToSelect: number | undefined;

    if (storedId) {
      const parsedId = parseInt(storedId, 10);
      // Verify stored content still exists in data
      const contentExists = submoduleData.data.some(
        (content) => content.id === parsedId
      );
      if (contentExists) {
        contentToSelect = parsedId;
      }
    }

    // If no valid stored selection, check current state
    if (!contentToSelect && selectedContentId) {
      const contentExists = submoduleData.data.some(
        (content) => content.id === selectedContentId
      );
      if (contentExists) {
        contentToSelect = selectedContentId;
      }
    }

    // If still no valid selection, use first content (only on true initial load)
    if (!contentToSelect) {
      contentToSelect = submoduleData.data[0].id;
    }

    // Set the selection
    const foundIndex = submoduleData.data.findIndex(
      (content) => content.id === contentToSelect
    );
    if (foundIndex !== -1) {
      setCurrentContentIndex(foundIndex);
      setSelectedContentId(contentToSelect);
      // Also store in sessionStorage
      sessionStorage.setItem(storageKey, contentToSelect.toString());
    }

    // Initialize type-specific selections only if not set
    const selectedContent = submoduleData.data.find(
      (c) => c.id === contentToSelect
    );
    if (selectedContent) {
      switch (selectedContent.content_type) {
        case "VideoTutorial":
          if (!selectedVideoId)
            setSelectedVideoId(selectedContent.id.toString());
          break;
        case "CodingProblem":
          if (!selectedProblemId)
            setSelectedProblemId(selectedContent.id.toString());
          break;
        case "Development":
          if (!selectedProjectId)
            setSelectedProjectId(selectedContent.id.toString());
          break;
        case "Assignment":
          if (!selectedAssignmentId)
            setSelectedAssignmentId(selectedContent.id);
          break;
        case "Article":
          if (!selectedArticleId) setSelectedArticleId(selectedContent.id);
          break;
        case "Quiz":
          if (!selectedQuizId) setSelectedQuizId(selectedContent.id);
          break;
      }
    }

    // Pre-populate first instances for quick navigation if those aren't set yet
    if (!selectedProblemId) {
      const firstProblem = submoduleData.data.find(
        (content) => content.content_type === "CodingProblem"
      );
      if (firstProblem) setSelectedProblemId(firstProblem.id.toString());
    }
    if (!selectedQuizId) {
      const firstQuiz = submoduleData.data.find(
        (content) => content.content_type === "Quiz"
      );
      if (firstQuiz) setSelectedQuizId(firstQuiz.id);
    }
    if (!selectedArticleId) {
      const firstArticle = submoduleData.data.find(
        (content) => content.content_type === "Article"
      );
      if (firstArticle) setSelectedArticleId(firstArticle.id);
    }
    if (!selectedAssignmentId) {
      const firstAssignment = submoduleData.data.find(
        (content) => content.content_type === "Assignment"
      );
      if (firstAssignment) setSelectedAssignmentId(firstAssignment.id);
    }
    if (!selectedProjectId) {
      const firstDevelopment = submoduleData.data.find(
        (content) => content.content_type === "Development"
      );
      if (firstDevelopment)
        setSelectedProjectId(firstDevelopment.id.toString());
    }
  }, [submoduleData, courseId, submoduleId]); // Only depend on these - no state dependencies!

  // Props objects for each content type (memoized to prevent re-renders)
  const videoProps = useMemo(
    () => ({
      selectedVideoId,
      onVideoClick: (id: string) => {
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
    }),
    [selectedVideoId, submoduleData?.data]
  );

  const quizProps = useMemo(
    () => ({
      selectedQuizId,
      onSelectQuiz: (id: number) => {
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
    }),
    [selectedQuizId, submoduleData?.data]
  );

  const problemProps = useMemo(
    () => ({
      selectedProblemId,
      onProblemSelect: (id: string) => {
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
    }),
    [selectedProblemId, submoduleData?.data]
  );

  const articleProps = useMemo(
    () => ({
      selectedArticleId,
      onArticleClick: (id: number) => {
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
    }),
    [selectedArticleId, submoduleData?.data]
  );

  const developmentProps = useMemo(
    () => ({
      selectedProjectId,
      onProjectSelect: (id: string) => {
        setSelectedProjectId(id);
        setSelectedContentId(parseInt(id));
        const projectIndex = submoduleData?.data?.findIndex(
          (content: SubmoduleContent) => content.id.toString() === id
        );
        if (projectIndex !== undefined && projectIndex !== -1) {
          setCurrentContentIndex(projectIndex);
        }
      },
    }),
    [selectedProjectId, submoduleData?.data]
  );

  const subjectiveProps = useMemo(
    () => ({
      selectedAssignmentId,
      onAssignmentClick: (id: number) => {
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
    }),
    [selectedAssignmentId, submoduleData?.data]
  );

  // Handle navigation to next content item (memoized to prevent re-renders)
  const nextContent = useCallback(() => {
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
  }, [submoduleData?.data, currentContentIndex]);

  const getNextTopicTitle = useCallback(() => {
    return (
      submoduleData?.data?.[currentContentIndex + 1]?.title || "Next Content"
    );
  }, [submoduleData?.data, currentContentIndex]);

  // Handle sidebar label selection
  const handleSidebarLabelSelect = (label: string) => {
    // Only change the activeSidebarLabel if it's a direct sidebar label click
    if (label !== activeSidebarLabel) {
      setActiveSidebarLabel(label);
    }

    // Make sure the sidebar is open when switching tabs
    setIsSidebarContentOpen(true);

    // For "All" tab, don't change selection - just keep current
    if (label === "All") {
      return; // Don't reset to first content when clicking "All"
    }

    // Check if current content matches the selected tab type - if so, don't change
    if (selectedContentId && submoduleData?.data) {
      const currentContent = submoduleData.data.find(
        (content) => content.id === selectedContentId
      );
      if (currentContent) {
        const typeMatches = (() => {
          switch (label) {
            case "Videos":
              return currentContent.content_type === "VideoTutorial";
            case "Problems":
              return currentContent.content_type === "CodingProblem";
            case "Development":
              return currentContent.content_type === "Development";
            case "Subjective":
              return currentContent.content_type === "Assignment";
            case "Article":
              return currentContent.content_type === "Article";
            case "Quiz":
              return currentContent.content_type === "Quiz";
            default:
              return false;
          }
        })();

        // If current content matches the tab type, keep it selected
        if (typeMatches) {
          return; // Don't reset, keep current selection
        }
      }
    }

    // Find the first content of the selected type
    const firstContent = submoduleData?.data?.find((content) => {
      switch (label) {
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
    // Special handling for CodingProblem - close sidebar to show question + code side-by-side
    if (contentType === "CodingProblem") {
      // If clicking the same problem, just close sidebar (don't toggle full screen)
      if (selectedContentId === contentId) {
        setIsSidebarContentOpen(true); // Close sidebar to show question + code side-by-side
        setIsProblemFullScreen(false); // Don't use full screen
        return;
      }
      // If clicking a different problem, close sidebar and select it
      setIsSidebarContentOpen(true);
      setIsProblemFullScreen(false); // Don't use full screen
    } else {
      // For other content types, close sidebar on second click
      if (selectedContentId === contentId) {
        setIsSidebarContentOpen(true);
        setIsProblemFullScreen(false); // Reset full screen for other content types
        return;
      }
      // Reset full screen when switching to different content
      setIsProblemFullScreen(false);
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

  // Function to update video progress (throttled to prevent excessive refreshes)
  const updateVideoProgress = useCallback(
    (videoId: string, progressPercent: number): void => {
      if (!submoduleData?.data) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastProgressUpdateRef.current;
      const progressDiff = Math.abs(
        progressPercent - lastProgressPercentRef.current
      );

      // Define milestones where we should always update
      const milestones = [25, 50, 75, 95, 100];
      const isMilestone = milestones.some(
        (milestone) =>
          progressPercent >= milestone &&
          lastProgressPercentRef.current < milestone
      );

      // Throttle: Only update if:
      // 1. It's been at least 10 seconds since last update, OR
      // 2. Progress changed by at least 5%, OR
      // 3. It's a milestone, OR
      // 4. Video is complete (≥95%)
      const shouldUpdate =
        timeSinceLastUpdate >= 10000 ||
        progressDiff >= 5 ||
        isMilestone ||
        progressPercent >= 95;

      if (!shouldUpdate) {
        // Clear any pending timeout and set a new one for delayed update
        if (progressUpdateTimeoutRef.current) {
          clearTimeout(progressUpdateTimeoutRef.current);
        }
        progressUpdateTimeoutRef.current = setTimeout(() => {
          updateVideoProgress(videoId, progressPercent);
        }, 10000);
        return;
      }

      // Clear any pending timeout
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
        progressUpdateTimeoutRef.current = null;
      }

      const updatedData = [...submoduleData.data];
      const videoIndex = updatedData.findIndex(
        (content) =>
          content.content_type === "VideoTutorial" &&
          content.id.toString() === videoId
      );

      if (videoIndex === -1) return;

      // Mark as complete if progress ≥ 95%
      if (progressPercent >= 95) {
        updatedData[videoIndex] = {
          ...updatedData[videoIndex],
          status: "complete",
          progress_percentage: progressPercent,
        };
      } else if (progressPercent > 0) {
        // Mark as in_progress with progress percentage
        updatedData[videoIndex] = {
          ...updatedData[videoIndex],
          status: "in_progress",
          progress_percentage: progressPercent,
        };
      }

      // Update query cache directly without invalidating (prevents refetch)
      const newSubmoduleData: SubmoduleData = {
        ...submoduleData,
        data: updatedData,
      };

      // Update the query cache immediately for instant UI update (no refetch)
      queryClient.setQueryData<SubmoduleData>(
        ["submodule", courseId, submoduleId],
        newSubmoduleData
      );

      // Update temporary data for sidebar refresh mechanism
      const w = window as unknown as {
        temporarySubmoduleData: SubmoduleData;
      };
      w.temporarySubmoduleData = newSubmoduleData;

      // Only invalidate queries on completion (≥95%) to refresh sidebar
      // Don't invalidate on milestones during playback to prevent refreshes
      if (progressPercent >= 95) {
        queryClient.invalidateQueries({
          queryKey: ["submodule", courseId, submoduleId],
        });
      }

      // Update refs
      lastProgressUpdateRef.current = now;
      lastProgressPercentRef.current = progressPercent;
    },
    [submoduleData, courseId, submoduleId, queryClient]
  );

  const updateQuizStatus = useCallback(
    (quizId: number, status: string): void => {
      if (!submoduleData?.data) return;

      const updatedData = [...submoduleData.data];
      const quizIndex = updatedData.findIndex(
        (content) => content.content_type === "Quiz" && content.id === quizId
      );

      if (quizIndex === -1) return;

      updatedData[quizIndex] = {
        ...updatedData[quizIndex],
        status: status,
      };

      const newSubmoduleData: SubmoduleData = {
        ...submoduleData,
        data: updatedData,
      };

      // Update query cache directly without invalidating (prevents refetch)
      queryClient.setQueryData<SubmoduleData>(
        ["submodule", courseId, submoduleId],
        newSubmoduleData
      );

      // Update temporary data for sidebar refresh mechanism
      const w = window as unknown as {
        temporarySubmoduleData: SubmoduleData;
      };
      w.temporarySubmoduleData = newSubmoduleData;

      // Only invalidate on status change to "complete" to refresh sidebar
      if (status === "complete") {
        queryClient.invalidateQueries({
          queryKey: ["submodule", courseId, submoduleId],
        });
      }
    },
    [submoduleData, courseId, submoduleId, queryClient]
  );
  // Update the updateProblemStatus function to take an optional parameter to skip API calls
  const updateProblemStatus = useCallback(
    (problemId: string, status: string): void => {
      if (!submoduleData?.data) return;

      const updatedData = [...submoduleData.data];
      const problemIndex = updatedData.findIndex(
        (content) =>
          content.content_type === "CodingProblem" &&
          content.id.toString() === problemId
      );

      if (problemIndex === -1) return;

      // Update the state in memory for immediate UI feedback
      updatedData[problemIndex] = {
        ...updatedData[problemIndex],
        status: status,
      };

      const newSubmoduleData: SubmoduleData = {
        ...submoduleData,
        data: updatedData,
      };

      // Update the query cache immediately for instant UI update (no refetch)
      queryClient.setQueryData<SubmoduleData>(
        ["submodule", courseId, submoduleId],
        newSubmoduleData
      );

      // Update temporary data for sidebar refresh mechanism
      const w = window as unknown as {
        temporarySubmoduleData: SubmoduleData;
      };
      w.temporarySubmoduleData = newSubmoduleData;

      // Only invalidate on completion to refresh sidebar
      if (status === "complete") {
        queryClient.invalidateQueries({
          queryKey: ["submodule", courseId, submoduleId],
        });
      }
    },
    [submoduleData, courseId, submoduleId, queryClient]
  );

  // Memoized callback for video completion - will be called with contentId from VideoCard
  const handleVideoComplete = useCallback(
    (contentId?: number) => {
      if (contentId) {
        updateVideoProgress(contentId.toString(), 100);
        triggerStreakRefresh();
        refetchStreakAfterCompletion();
      }
    },
    [updateVideoProgress, triggerStreakRefresh, refetchStreakAfterCompletion]
  );

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
            key={`content-${currentContent?.id}-${currentContent?.content_type}-${submoduleId}`}
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
                  if (currentContent) {
                    handleVideoComplete(currentContent.id);
                  }
                }}
                onProgressUpdate={updateVideoProgress}
              />
            )}
            {currentContent?.content_type === "CodingProblem" && (
              <ProblemCard
                key={`problem-${submoduleId}-${currentContent.id}`}
                isSidebarContentOpen={isSidebarContentOpen}
                isFullScreen={isProblemFullScreen}
                onToggleFullScreen={() =>
                  setIsProblemFullScreen((prev) => !prev)
                }
                onCloseSidebar={() => setIsSidebarContentOpen(false)}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                onSubmit={() => {}}
                onComplete={() => {
                  updateProblemStatus(currentContent.id.toString(), "complete");
                  triggerStreakRefresh();
                  refetchStreakAfterCompletion();
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
                  triggerStreakRefresh();
                  refetchStreakAfterCompletion();
                }}
              />
            )}
            {currentContent?.content_type === "Article" && (
              <ArticleCard
                key={`article-${submoduleId}-${currentContent.id}`}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                onMarkComplete={() => {
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
                onSubmit={() => {
                  // Development project submission handled by component
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

      {/* Streak Congratulations Modal */}
      <StreakCongratulationsModal
        isOpen={shouldShowStreakCongrats}
        onClose={() => {
          markStreakCongratsShown();
        }}
        onContinue={() => {
          markStreakCongratsShown();
        }}
        currentStreak={currentStreak}
        completionDate={completionDate}
      />
    </div>
  );
};

export default CourseTopicDetailPage;
