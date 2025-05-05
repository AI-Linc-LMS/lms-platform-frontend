import { useQuery } from "@tanstack/react-query";
import { getCourseContent, getSubmoduleById } from "../../../services/courses-content/courseContentApis";
import DashboardContent from "./component/DashboardContent";
import AllContent from "./component/AllContent";
import { dummyContent } from "./component/data/mockAllData";
import ArticleContent, { ArticleItem } from "./component/ArticleContent";
import VideoContent from "./component/VideoContent";
import ProblemContent from "./component/ProblemContent";
import closeSidebarIcon from "../../../assets/course_sidebar_assets/closeSidebarIcon.png";
import QuizContent from "./component/QuizContent";
import { Quiz } from "./component/data/mockQuizData";
import DevelopmentContent from "./component/DevelopmentContent";
import { developmentProjectsDummy } from "./component/data/mockDevelopmentData";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

interface SubmoduleContent {
  content_type: string;
  duration_in_minutes: number;
  id: number;
  order: number;
  title: string;
  difficulty_level?: string;
  description?: string;
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

interface CourseSidebarContentProps {
  activeLabel: string;
  onClose: () => void;
  videoProps: VideoProps;
  quizProps: QuizProps;
  articleProps: ArticleProps;
  problemProps?: ProblemProps;
  developmentProps?: DevelopmentProps;
  submoduleId?: number;
  courseId?: number;
}

const CourseSidebarContent = ({
  activeLabel,
  onClose,
  videoProps,
  quizProps,
  articleProps,
  problemProps,
  developmentProps,
  submoduleId,
  courseId,
}: CourseSidebarContentProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Fetch submodule data by ID if provided
  const { data: submoduleData } = useQuery<SubmoduleData | null>({
    queryKey: ['submodule', submoduleId],
    queryFn: () => submoduleId && courseId ? getSubmoduleById(1, courseId, submoduleId) : Promise.resolve(null),
    enabled: !!submoduleId && !!courseId,
  });

  const handleVideoClick = (id: string) => {
    videoProps.onVideoClick(id);
    if (courseId) {
      getCourseContent(1, courseId, parseInt(id));
    }
    if (isMobile) {
      onClose();
    }
  };

  const handleProblemSelect = (id: string) => {
    if (problemProps && problemProps.onProblemSelect) {
      problemProps.onProblemSelect(id);
      if (isMobile) {
        onClose();
      }
    } else if (courseId) {
      getCourseContent(1, courseId, parseInt(id));
    }
  };

  const handleProjectSelect = (id: string) => {
    if (developmentProps && developmentProps.onProjectSelect) {
      developmentProps.onProjectSelect(id);
      if (isMobile) {
        onClose();
      }
    }
  };

  const handleQuizSelect = (id: number) => {
    quizProps.onSelectQuiz(id);
    if (isMobile) {
      onClose();
    }
  };

  const handleArticleClick = (id: number) => {
    articleProps.onArticleClick(id);
    if (isMobile) {
      onClose();
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
          marks: 10,
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
          marks: 10,
          accuracy: 0,
          submissions: 0,
          completed: false
        }))
    : [];

  // Transform submodule data into articles if available
  const articles = submoduleData?.data
    ? submoduleData.data
        .filter((content: SubmoduleContent) => content.content_type === 'Article')
        .map((content: SubmoduleContent) => ({
          id: content.id,
          title: content.title,
          content: content.title,
          duration: `${content.duration_in_minutes} min`,
          marks: 10,
          completed: false
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
          marks: 10,
          submissions: 0,
          questions: [],
          completed: false
        }))
    : [];

  return (
    <div 
      className={`relative bg-white ${
        isMobile 
          ? 'h-full overflow-y-auto rounded-l-lg shadow-xl' 
          : 'w-[500px] min-h-screen rounded-lg px-4 py-3 mt-5 shadow-xl'
      }`}
    >
      <button
        onClick={onClose}
        className={`${
          isMobile 
            ? 'absolute top-3 right-3 z-10 bg-white rounded-full shadow-md p-2' 
            : 'absolute top-1 -right-10 z-10 bg-white rounded-full shadow-md p-2'
        } hover:bg-gray-100 transition cursor-pointer`}
      >
        <img src={closeSidebarIcon} alt="Close" className="w-4 h-4" />
      </button>

      <div className={`${isMobile ? 'p-4' : 'px-4 py-3'}`}>
        <div className="border-b border-gray-200 mb-4 pb-3">
          <h3 className="text-lg font-semibold text-[#255C79]">{activeLabel}</h3>
          <p className="text-xs text-gray-500">
            {submoduleData?.moduleName || "Course"} - {submoduleData?.submoduleName || "Topic"}
          </p>
        </div>
        
        <div className="text-sm text-gray-700">
          {activeLabel === "Dashboard" && (
            <DashboardContent
              courseTitle={submoduleData?.moduleName || "Course"}
              courseType="Self pace"
              stats={dummyStats}
            />
          )}
          {activeLabel === "All" && <AllContent contents={dummyContent} />}
          {activeLabel === "Article" && (
            <ArticleContent
              articles={articles}
              selectedArticleId={articleProps.selectedArticleId}
              onArticleClick={handleArticleClick}
            />
          )}
          {activeLabel === "Videos" && (
            <VideoContent
              videos={videos}
              selectedVideoId={videoProps.selectedVideoId || ""}
              onVideoClick={handleVideoClick}
              totalDuration={`${submoduleData?.data?.reduce((acc: number, curr: SubmoduleContent) => acc + curr.duration_in_minutes, 0) || 0} min`}
              topicNo={submoduleData?.weekNo || 1}
              topicTitle={submoduleData?.submoduleName || "Topic 1"}
              week={`Week ${submoduleData?.weekNo || 1}`}
              difficulty="Beginner"
              completionPercentage={0}
            />
          )}
          {activeLabel === "Problems" && (
            <ProblemContent
              problems={problems}
              selectedProblemId={problemProps?.selectedProblemId}
              onSelect={handleProblemSelect}
            />
          )}
          {activeLabel === "Quiz" && (
            <QuizContent
              onSelect={handleQuizSelect}
              selectedQuizId={quizProps.selectedQuizId}
              quizzes={quizzes.length > 0 ? quizzes : quizProps.quizzes}
              courseId={courseId}
              clientId={1}
            />
          )}
          {activeLabel === "Development" && (
            <DevelopmentContent
              projects={developmentProjectsDummy}
              selectedProjectId={developmentProps?.selectedProjectId}
              onProjectSelect={handleProjectSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSidebarContent;
