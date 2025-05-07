import { useQuery } from "@tanstack/react-query";
import {getSubmoduleById } from "../../../services/courses-content/courseContentApis";
import DashboardContent from "./component/DashboardContent";
import AllContent, { ContentType } from "./component/AllContent";
import ArticleContent, { ArticleItem } from "./component/ArticleContent";
import VideoContent from "./component/VideoContent";
import ProblemContent from "./component/ProblemContent";
import closeSidebarIcon from "../../../assets/course_sidebar_assets/closeSidebarIcon.png";
import QuizContent, { Quiz } from "./component/QuizContent";
import DevelopmentContent from "./component/DevelopmentContent";
import { developmentProjectsDummy } from "./component/data/mockDevelopmentData";
import SubjectiveContent, { AssignmentItem } from "./component/SubjectiveContent";

interface SubmoduleContent {
  content_type: ContentType;
  duration_in_minutes: number;
  id: number;
  order: number;
  title: string;
  difficulty_level?: string;
  description?: string;
  status?: string;
  marks?: number;
  submissions?: number;
  questions?: number;
  accuracy?: number;
}

interface SubmoduleData {
  data: SubmoduleContent[];
  moduleName: string;
  submoduleName: string;
  submoduleId: number;
  weekNo: number;
}

const dummyStats = [
  { title: "Articles", progress: 25, count: "1/3" },
  { title: "Videos", progress: 25, count: "1/3" },
  { title: "Problems", progress: 25, count: "1/3" },
  { title: "Quiz", progress: 25, count: "1/3" },
  { title: "Subjective", progress: 0, count: "0/1" },
  { title: "Development", progress: 0, count: "0/4" },
];

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
  submoduleId?: number;
  courseId?: number;
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
  subjectiveProps,
  submoduleId,
  courseId,
  selectedContentId,
  onContentSelect,
}: CourseSidebarContentProps) => {
  // Fetch submodule data by ID if provided
  const { data: submoduleData } = useQuery<SubmoduleData | null>({
    queryKey: ['submodule', submoduleId],
    queryFn: () => submoduleId && courseId ? getSubmoduleById(1, courseId, submoduleId) : Promise.resolve(null),
    enabled: !!submoduleId && !!courseId,
  });

  console.log("submoduleData", submoduleData);

  const handleContentClick = (contentId: number, contentType: ContentType) => {
    onContentSelect(contentId, contentType);
    
    // Only trigger the specific content type handler without changing activeSidebarLabel
    switch (contentType) {
      case "VideoTutorial":
        videoProps.onVideoClick(contentId.toString());
        break;
      case "Article":
        articleProps.onArticleClick(contentId);
        break;
      case "CodingProblem":
        if (problemProps?.onProblemSelect) {
          problemProps.onProblemSelect(contentId.toString());
        }
        break;
      case "Quiz":
        quizProps.onSelectQuiz(contentId);
        break;
      case "Assignment":
        if (subjectiveProps?.onAssignmentClick) {
          subjectiveProps.onAssignmentClick(contentId);
        }
        break;
      case "Development":
        if (developmentProps?.onProjectSelect) {
          developmentProps.onProjectSelect(contentId.toString());
        }
        break;
    }
  };

  // Transform submodule data into videos if available
  const videos = submoduleData?.data
    ? submoduleData.data
        .filter((content: SubmoduleContent) => content.content_type === 'VideoTutorial')
        .map((content: SubmoduleContent) => ({
          id: content.id.toString(),
          title: content.title,
          duration: `${content.duration_in_minutes} min`,
          marks: content.marks || 10,
          completed: false
        }))
    : [];

  // Transform submodule data into problems if available
  const problems = submoduleData?.data
    ? submoduleData.data
        .filter((content: SubmoduleContent) => content.content_type === 'CodingProblem')
        .map((content: SubmoduleContent) => ({
          id: content.id.toString(),
          title: content.title,
          marks: content.marks || 10,
          accuracy: content.accuracy || 0,
          submissions: content.submissions || 0,
          status: content.status || "non-complete"
        }))
    : [];

  // Transform submodule data into articles if available
  const articles = submoduleData?.data
    ? submoduleData.data
        .filter((content: SubmoduleContent) => content.content_type === 'Article')
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          duration: content.duration_in_minutes,
          marks: content.marks || 10,
          status: content.status || "non-complete"
        }))
    : [];

  // Transform submodule data into quizzes if available
  const quizzes = submoduleData?.data
    ? submoduleData.data
        .filter((content: SubmoduleContent) => content.content_type === 'Quiz')
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          duration: `${content.duration_in_minutes} min`,
          marks: content.marks || 10,
          submissions: content.submissions || 0,
          questions: content.questions || 10,
          status: content.status || "non-complete"
        }))
    : [];

  // Transform submodule data into assignments if available
  const assignments = submoduleData?.data
    ? submoduleData.data
        .filter((content: SubmoduleContent) => content.content_type === 'Assignment')
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          content_type: content.content_type,
          duration_in_minutes: content.duration_in_minutes,
          order: content.order,
          status: content.status || "non-complete"
        }))
    : [];

  return (
    <div className="relative bg-white w-[500px] min-h-screen shadow-xl rounded-lg px-4 py-3 transition-all duration-300 mt-5">
      <button
        onClick={onClose}
        className="absolute top-1 -right-10 z-10 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 transition cursor-pointer"
      >
        <img src={closeSidebarIcon} alt="Close" className="w-4 h-4" />
      </button>

      <div className="text-sm text-gray-700">
        {activeLabel === "Dashboard" && (
          <DashboardContent
            courseTitle={submoduleData?.moduleName || "Course"}
            courseType="Self pace"
            stats={dummyStats}
          />
        )}
        {activeLabel === "All" && submoduleData && (
          <AllContent 
            contents={submoduleData.data.map(content => ({
              id: content.id,
              title: content.title,
              content_type: content.content_type,
              order: content.order,
              duration_in_minutes: content.duration_in_minutes,
              status: content.status || "non-complete"
            }))}
            onContentClick={handleContentClick}
            selectedContentId={selectedContentId}
          />
        )}
        {activeLabel === "Article" && (
          <ArticleContent
            articles={articles}
            selectedArticleId={articleProps.selectedArticleId}
            onArticleClick={articleProps.onArticleClick}
          />
        )}
        {activeLabel === "Videos" && (
          <VideoContent
            videos={videos}
            selectedVideoId={videoProps.selectedVideoId || ""}
            onVideoClick={videoProps.onVideoClick}
            topicNo={submoduleData?.weekNo || 1}
            topicTitle={submoduleData?.submoduleName || "Topic 1"}
            week={`Week ${submoduleData?.weekNo || 1}`}
            difficulty="Beginner"
            completionPercentage={0}
            totalDuration={`${submoduleData?.data?.reduce((acc: number, curr: SubmoduleContent) => acc + curr.duration_in_minutes, 0) || 0} min`}
          />
        )}
        {activeLabel === "Problems" && problemProps && (
          <ProblemContent
            problems={problems}
            selectedProblemId={problemProps.selectedProblemId}
            onSelect={problemProps.onProblemSelect}
          />
        )}
        {activeLabel === "Quiz" && (
          <QuizContent
            quizzes={quizzes}
            selectedQuizId={quizProps.selectedQuizId}
            onSelect={quizProps.onSelectQuiz}
          />
        )}
        {activeLabel === "Development" && developmentProps && (
          <DevelopmentContent
            projects={developmentProjectsDummy}
            selectedProjectId={developmentProps.selectedProjectId}
            onProjectSelect={developmentProps.onProjectSelect}
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
