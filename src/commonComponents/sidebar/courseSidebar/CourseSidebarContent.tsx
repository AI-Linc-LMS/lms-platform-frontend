import { useState, useEffect } from "react";
import DashboardContent from "./component/DashboardContent";
import AllContent, { ContentType } from "./component/AllContent";
import ArticleContent, { ArticleItem } from "./component/ArticleContent";
import VideoContent from "./component/VideoContent";
import ProblemContent from "./component/ProblemContent";
import closeSidebarIcon from "../../../assets/course_sidebar_assets/closeSidebarIcon.png";
import QuizContent, { Quiz } from "./component/QuizContent";
import DevelopmentContent from "./component/DevelopmentContent";
// import { developmentProjectsDummy } from "./component/data/mockDevelopmentData";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import SubjectiveContent, {
  AssignmentItem,
} from "./component/SubjectiveContent";
import {
  SubmoduleContent,
  SubmoduleData,
} from "../../../features/learn/pages/CourseTopicDetailPage";

const contentTypeLabels = {
  Article: "Articles",
  VideoTutorial: "Videos",
  CodingProblem: "Problems",
  Quiz: "Quiz",
  Assignment: "Subjective",
  Development: "Development",
};

interface Stat {
  title: string;
  progress: number;
  count: string;
}

function getDashboardStats(
  data: Array<{ content_type: ContentType; status?: string }>
): Stat[] {
  return Object.keys(contentTypeLabels).map((type) => {
    const items = data.filter((item) => item.content_type === type);
    const completed = items.filter((item) => item.status === "complete");
    return {
      title: contentTypeLabels[type as ContentType],
      progress: items.length
        ? Math.round((completed.length / items.length) * 100)
        : 0,
      count: `${completed.length}/${items.length}`,
    };
  });
}

function getOverallProgress(data: Array<{ status?: string }>): number {
  const total = data.length;
  const completed = data.filter((item) => item.status === "complete").length;

  return total ? Math.round((completed / total) * 100) : 0;
}

interface VideoProps {
  selectedVideoId: string | null;
  onVideoClick: (id: string) => void;
  videos: VideoItem[];
}

interface VideoItem {
  id: string;
  title: string;
  duration: string;
  marks: number;
  completed: boolean;
}

interface QuizProps {
  selectedQuizId: number;
  onSelectQuiz: (id: number) => void;
  quizzes: Quiz[];
}

interface ArticleProps {
  selectedArticleId: number;
  onArticleClick: (id: number) => void;
  articles: ArticleItem[];
}

interface ProblemProps {
  selectedProblemId?: string;
  onProblemSelect: (id: string) => void;
}

interface DevelopmentProps {
  selectedProjectId?: string;
  onProjectSelect: (id: string) => void;
}

interface SubjectiveProps {
  selectedAssignmentId: number;
  onAssignmentClick: (id: number) => void;
  assignments: AssignmentItem[];
}

interface CourseSidebarContentProps {
  activeLabel: string;
  onClose: () => void;
  videoProps: VideoProps;
  quizProps: QuizProps;
  articleProps: ArticleProps;
  problemProps?: ProblemProps;
  developmentProps?: DevelopmentProps;
  subjectiveProps?: SubjectiveProps;
  submoduleData?: SubmoduleData;
  selectedContentId?: number;
  onContentSelect: (contentId: number, contentType: ContentType) => void;
}

const CourseSidebarContent = ({
  activeLabel,
  onClose,
  videoProps,
  quizProps,
  articleProps,
  problemProps,
  developmentProps,
  selectedContentId,
  submoduleData,
  onContentSelect,
}: CourseSidebarContentProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Reset refresh trigger when submoduleData changes (new topic loaded)
  useEffect(() => {
    setRefreshTrigger(0);
    // Clear any stale temporary data when submodule data changes
    const w = window as unknown as { temporarySubmoduleData?: SubmoduleData };
    if (w.temporarySubmoduleData) {
      delete w.temporarySubmoduleData;
    }
  }, [submoduleData]);

  // Listen for progress updates (for demo purposes - in a real app use state mgmt)
  useEffect(() => {
    const checkForProgressUpdates = () => {
      const w = window as unknown as { temporarySubmoduleData?: SubmoduleData };
      if (w.temporarySubmoduleData) {
        //console.log('Progress update detected - refreshing sidebar');
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    // Check every second for updates
    const interval = setInterval(checkForProgressUpdates, 1000);
    return () => clearInterval(interval);
  }, []);

  //console.log("submoduleData", submoduleData);
  //console.log("Refresh trigger:", refreshTrigger);

  const handleContentClick = (contentId: number, contentType: ContentType) => {
    // The onContentSelect already handles all state updates including:
    // - Setting selectedContentId
    // - Setting currentContentIndex
    // - Setting the specific content type ID (selectedQuizId, selectedVideoId, etc.)
    // So we don't need to call the individual handlers anymore
    onContentSelect(contentId, contentType);
  };

  // Get actual data to use - prioritize fresh submoduleData over stale temp data
  const w = window as unknown as { temporarySubmoduleData?: SubmoduleData };
  const actualData =
    submoduleData ||
    (refreshTrigger > 0 && w.temporarySubmoduleData
      ? w.temporarySubmoduleData
      : undefined);

  // Show loading state when no data is available
  if (!actualData) {
    return (
      <div className="bg-white h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#17627A] mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading content...</p>
        </div>
      </div>
    );
  }

  // Transform submodule data into videos if available
  const videos = actualData?.data
    ? actualData.data
        .filter(
          (content: SubmoduleContent) =>
            content.content_type === "VideoTutorial"
        )
        .map((content: SubmoduleContent) => ({
          id: content.id.toString(),
          title: content.title,
          duration: `${content.duration_in_minutes} min`,
          marks: content.marks || 10,
          completed: content.status === "complete",
          progress:
            content.status === "complete"
              ? 100
              : content.status === "in_progress"
              ? content.progress_percentage ||
                Math.floor(Math.random() * 70) + 10
              : 0,
        }))
    : [];

  // Transform submodule data for AllContent
  const allContents = actualData?.data
    ? actualData.data.map((content: SubmoduleContent) => ({
        id: content.id,
        title: content.title,
        content_type: content.content_type,
        order: content.order,
        duration_in_minutes: content.duration_in_minutes,
        marks: content.marks || 0,
        status: content.status,
        progress_percentage:
          content.content_type === "VideoTutorial"
            ? content.status === "complete"
              ? 100
              : content.status === "in_progress"
              ? content.progress_percentage ||
                Math.floor(Math.random() * 70) + 10
              : 0
            : undefined,
      }))
    : [];

  // Transform submodule data into problems if available
  const problems = actualData?.data
    ? actualData.data
        .filter(
          (content: SubmoduleContent) =>
            content.content_type === "CodingProblem"
        )
        .map((content: SubmoduleContent) => ({
          id: content.id.toString(),
          title: content.title,
          marks: content.marks || 10,
          accuracy: content.accuracy || 0,
          submissions: content.submissions || 0,
          status: content.status || "non-complete",
        }))
    : [];

  // Transform submodule data into articles if available
  const articles = actualData?.data
    ? actualData.data
        .filter(
          (content: SubmoduleContent) => content.content_type === "Article"
        )
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          duration: content.duration_in_minutes,
          marks: content.marks || 10,
          status: content.status || "non-complete",
        }))
    : [];

  // Transform submodule data into quizzes if available
  const quizzes = actualData?.data
    ? actualData.data
        .filter((content: SubmoduleContent) => content.content_type === "Quiz")
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          duration: `${content.duration_in_minutes} min`,
          marks: content.marks || 10,
          submissions: content.submissions || 0,
          questions: content.questions || 10,
          status: content.status || "non-complete",
        }))
    : [];

  // Transform submodule data into assignments if available
  const assignments = actualData?.data
    ? actualData.data
        .filter(
          (content: SubmoduleContent) => content.content_type === "Assignment"
        )
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          content_type: content.content_type,
          duration_in_minutes: content.duration_in_minutes,
          order: content.order,
          status: content.status || "non-complete",
        }))
    : [];

  return (
    <div
      className={`relative bg-white ${
        isMobile
          ? "h-full overflow-y-auto rounded-l-lg shadow-xl p-4"
          : "w-[500px] min-h-screen rounded-lg px-4 py-3 mt-5 shadow-xl"
      }`}
    >
      <button
        onClick={onClose}
        className={`${
          isMobile
            ? "absolute top-3 right-3 z-10 bg-white rounded-full shadow-md p-2"
            : "absolute top-1 -right-10 z-10 bg-white rounded-full shadow-md p-2"
        } hover:bg-gray-100 transition cursor-pointer`}
      >
        <img src={closeSidebarIcon} alt="Close" className="w-4 h-4" />
      </button>

      <div className="text-sm text-gray-700">
        {activeLabel === "Dashboard" && (
          <DashboardContent
            courseTitle={actualData?.moduleName || "Course"}
            courseType="Self pace"
            stats={actualData?.data ? getDashboardStats(actualData.data) : []}
            overallProgress={
              actualData?.data ? getOverallProgress(actualData.data) : 0
            }
          />
        )}
        {activeLabel === "All" && (
          <AllContent
            contents={allContents}
            onContentClick={handleContentClick}
            selectedContentId={selectedContentId}
            activeLabel={activeLabel}
          />
        )}
        {activeLabel === "Article" && (
          <ArticleContent
            articles={articles}
            selectedArticleId={articleProps.selectedArticleId}
            onArticleClick={(id) => {
              handleContentClick(id, "Article");
            }}
          />
        )}
        {activeLabel === "Videos" && (
          <VideoContent
            videos={videos.map((v) => ({
              ...v,
              id: Number(v.id), // 👈 convert string -> number
            }))}
            selectedVideoId={Number(videoProps.selectedVideoId) || 0} // ensure numeric too
            onVideoClick={(id) => handleContentClick(id, "VideoTutorial")}
            topicNo={actualData?.weekNo || 1}
            topicTitle={actualData?.submoduleName || "Topic 1"}
            week={`Week ${actualData?.weekNo || 1}`}
            difficulty="Beginner"
            completionPercentage={
              videos.length > 0
                ? Math.round(
                    (videos.reduce(
                      (sum, video) =>
                        sum + (video.completed ? 100 : video.progress || 0),
                      0
                    ) /
                      (videos.length * 100)) *
                      100
                  )
                : 0
            }
            totalDuration={`${
              actualData?.data
                ?.filter(
                  (curr: SubmoduleContent) =>
                    curr.content_type === "VideoTutorial"
                )
                .reduce(
                  (acc: number, curr: SubmoduleContent) =>
                    acc + curr.duration_in_minutes,
                  0
                ) || 0
            } min`}
          />
        )}
        {activeLabel === "Problems" && problemProps && (
          <ProblemContent
            problems={problems}
            selectedProblemId={problemProps.selectedProblemId}
            onSelect={(id) => {
              handleContentClick(parseInt(id), "CodingProblem");
            }}
          />
        )}
        {activeLabel === "Quiz" && (
          <QuizContent
            quizzes={quizzes}
            selectedQuizId={quizProps.selectedQuizId}
            onSelect={(id) => {
              handleContentClick(id, "Quiz");
            }}
          />
        )}
        {activeLabel === "Development" && developmentProps && (
          <DevelopmentContent
            projects={[]}
            selectedProjectId={developmentProps.selectedProjectId}
            onProjectSelect={(id) => {
              handleContentClick(parseInt(id), "Development");
            }}
          />
        )}
        {activeLabel === "Subjective" && (
          <SubjectiveContent
            assignments={assignments}
            selectedAssignmentId={selectedContentId || 0}
            onAssignmentClick={(id) => handleContentClick(id, "Assignment")}
          />
        )}
      </div>
    </div>
  );
};

export default CourseSidebarContent;
