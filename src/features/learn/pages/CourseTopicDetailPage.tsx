import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSubmoduleById } from "../../../services/courses-content/courseContentApis";
import CourseSidebar from "../../../commonComponents/sidebar/courseSidebar/CourseSidebar";
import CourseSidebarContent from "../../../commonComponents/sidebar/courseSidebar/CourseSidebarContent";
import VideoCard from "../components/course-cards/video/VideoCard";
import QuizCard from "../components/course-cards/quiz/QuizCard";
import ArticleCard from "../components/course-cards/article/ArticleCard";
// import { quizData } from "../../../commonComponents/sidebar/courseSidebar/component/data/mockQuizData";
import expandSidebarIcon from "../../../assets/course_sidebar_assets/expandSidebarIcon.png";
import { dummyArticles } from "../data/mockArticleData";
import ProblemCard from "../components/course-cards/problem/ProblemCard";
import BackToPreviousPage from "../../../commonComponents/common-buttons/back-buttons/back-to-previous-page/BackToPreviousPage";
import SubjectiveCard from "../components/course-cards/subjective/SubjectiveCard";
import DevelopmentCard from "../components/course-cards/development/DevelopmentCard";

interface SubmoduleContent {
  content_type: string;
  duration_in_minutes: number;
  id: number;
  order: number;
  title: string;
  description?: string;
  difficulty?: string;
}

interface SubmoduleData {
  data: SubmoduleContent[];
  moduleName: string;
  submoduleName: string;
  submoduleId: number;
  weekNo: number;
}

interface VideoItem {
  id: string;
  title: string;
  duration: string;
  marks: number;
  completed: boolean;
}

interface ProblemItem {
  id: string;
  title: string;
  marks: number;
  accuracy: number;
  submissions: number;
  completed: boolean;
}

const CourseTopicDetailPage: React.FC = () => {
  const { courseId, submoduleId } = useParams<{ courseId: string; submoduleId: string }>();
  const navigate = useNavigate();
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number>(1);
  const [selectedSubjectiveId, setSelectedSubjectiveId] = useState<string | null>(null);
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [activeSidebarLabel, setActiveSidebarLabel] = useState<string>("Videos");
  const [isSidebarContentOpen, setIsSidebarContentOpen] = useState<boolean>(true);

  // Fetch submodule data
  const { data: submoduleData, isLoading: isSubmoduleLoading, error: submoduleError } = useQuery<SubmoduleData>({
    queryKey: ['submodule', submoduleId],
    queryFn: () => getSubmoduleById(1, parseInt(courseId || "0"), parseInt(submoduleId || "0")),
    enabled: !!courseId && !!submoduleId,
  });

  // Transform submodule data into videos if available
  const videos: VideoItem[] = submoduleData?.data
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
  const problems: ProblemItem[] = submoduleData?.data
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

  // Set default selected content when submodule data changes
  useEffect(() => {
    if (submoduleData?.data) {
      // Find the first video
      const firstVideo = submoduleData.data.find(content => content.content_type === 'VideoTutorial');
      if (firstVideo) {
        setSelectedVideoId(firstVideo.id.toString());
        setCurrentContentIndex(submoduleData.data.indexOf(firstVideo));
        setActiveSidebarLabel("Videos");  // Set Videos as active label
        setIsSidebarContentOpen(true);    // Open the sidebar
      }

      // Find the first problem
      const firstProblem = submoduleData.data.find(content => content.content_type === 'CodingProblem');
      if (firstProblem) {
        setSelectedProblemId(firstProblem.id.toString());
      }

      // Find the first quiz
      const firstQuiz = submoduleData.data.find(content => content.content_type === 'Quiz');
      if (firstQuiz) {
        setSelectedQuizId(firstQuiz.id);
      }

      // Find the first article
      const firstArticle = submoduleData.data.find(content => content.content_type === 'Article');
      if (firstArticle) {
        setSelectedArticleId(firstArticle.id);
      }

      // Find the first assignment
      const firstAssignment = submoduleData.data.find(content => content.content_type === 'Assignment');
      if (firstAssignment) {
        setSelectedSubjectiveId(firstAssignment.id.toString());
      }

      // Find the first development project
      const firstDevelopment = submoduleData.data.find(content => content.content_type === 'Development');
      if (firstDevelopment) {
        setSelectedProjectId(firstDevelopment.id.toString());
      }
    }
  }, [submoduleData]);

  // Props objects for each content type
  const videoProps = {
    selectedVideoId,
    onVideoClick: (id: string) => {
      console.log("Video Clicked - ID:", id);
      setSelectedVideoId(id);
      setActiveSidebarLabel("Videos");
      const videoIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (videoIndex !== undefined && videoIndex !== -1) {
        setCurrentContentIndex(videoIndex);
      }
    },
    videos
  };

  const quizProps = {
    selectedQuizId,
    onSelectQuiz: (id: number) => {
      console.log("Quiz Selected - ID:", id);
      setSelectedQuizId(id);
      setActiveSidebarLabel("Quiz");
      const quizIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (quizIndex !== undefined && quizIndex !== -1) {
        setCurrentContentIndex(quizIndex);
      }
    },
    quizzes
  };

  const problemProps = {
    selectedProblemId,
    onProblemSelect: (id: string) => {
      console.log("Problem Selected - ID:", id);
      setSelectedProblemId(id);
      setActiveSidebarLabel("Problems");
      const problemIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (problemIndex !== undefined && problemIndex !== -1) {
        setCurrentContentIndex(problemIndex);
      }
    },
    problems
  };

  const articleProps = {
    articles: dummyArticles,
    selectedArticleId,
    onArticleClick: (id: number) => setSelectedArticleId(id),
  };

  const developmentProps = {
    selectedProjectId,
    onProjectSelect: (id: string) => {
      console.log("Project Selected - ID:", id);
      setSelectedProjectId(id);
      setActiveSidebarLabel("Development");
      const projectIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (projectIndex !== undefined && projectIndex !== -1) {
        setCurrentContentIndex(projectIndex);
      }
    },
  };

  // Handle navigation to next content item
  const nextContent = () => {
    if (!submoduleData?.data) return;
    
    const nextIndex = currentContentIndex + 1;
    if (nextIndex < submoduleData.data.length) {
      setCurrentContentIndex(nextIndex);
      // Update the selected video ID if we're in the Videos section
      if (activeSidebarLabel === "Videos") {
        setSelectedVideoId(submoduleData.data[nextIndex].id.toString());
      }
    }
  };

  const getNextTopicTitle = () => {
    return submoduleData?.data?.[currentContentIndex + 1]?.title || "Next Content";
  };

  // Handle sidebar label selection
  const handleSidebarLabelSelect = (label: string) => {
    setActiveSidebarLabel(label);
    setIsSidebarContentOpen(true);

    // Find the first content of the selected type
    const firstContent = submoduleData?.data?.find(content => {
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
      const contentIndex = submoduleData?.data?.indexOf(firstContent) ?? 0;
      setCurrentContentIndex(contentIndex);

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
          setSelectedSubjectiveId(firstContent.id.toString());
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

  // Add useEffect to log content changes
  useEffect(() => {
    console.log("Content Changed - Current Content:", {
      id: submoduleData?.data?.[currentContentIndex]?.id,
      type: submoduleData?.data?.[currentContentIndex]?.content_type,
      title: submoduleData?.data?.[currentContentIndex]?.title,
      index: currentContentIndex
    });
  }, [currentContentIndex, submoduleData]);

  if (isSubmoduleLoading) {
    return <div>Loading...</div>;
  }

  if (submoduleError || !submoduleData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl mb-4">Topic not found</p>
        <button
          className="px-4 py-2 bg-[#255C79] text-white rounded-xl cursor-pointer"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    );
  }

  // Find the current content item
  const currentContent = submoduleData.data[currentContentIndex];
  console.log("Current Content ID:", currentContent?.id);
  console.log("Current Content Type:", currentContent?.content_type);
  console.log("Current Content Title:", currentContent?.title);

  return (
    <div className="pb-8">
      <BackToPreviousPage />

      <div className="flex mt-4">
        <div className="flex">
          <CourseSidebar
            activeLabel={activeSidebarLabel}
            onSelect={handleSidebarLabelSelect}
          />
          {isSidebarContentOpen && (
            <CourseSidebarContent
              submoduleId={parseInt(submoduleId || "0")}
              courseId={parseInt(courseId || "0")}
              activeLabel={activeSidebarLabel}
              onClose={() => setIsSidebarContentOpen(false)}
              videoProps={videoProps}
              quizProps={quizProps}
              articleProps={articleProps}
              problemProps={problemProps}
              developmentProps={developmentProps}
            />
          )}
          {!isSidebarContentOpen && (
            <button
              onClick={() => setIsSidebarContentOpen(true)}
              className="absolute top-32 left-[142px] bg-white rounded-full shadow-md p-2 hover:bg-gray-100 transition z-10 cursor-pointer"
              title="Expand Sidebar"
            >
              <img src={expandSidebarIcon} alt="Expand" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className={`flex-1 mt-6 ${isSidebarContentOpen ? "ml-12" : ""} overflow-hidden`}>
          {activeSidebarLabel === "Videos" && currentContent?.content_type === "VideoTutorial" && (
            <VideoCard
              currentWeek={{ title: `Week ${submoduleData.weekNo}` }}
              currentTopic={{ title: currentContent.title }}
              contentId={currentContent.id}
              courseId={parseInt(courseId || "0")}
              nextContent={nextContent}
              getNextTopicTitle={getNextTopicTitle}
            />
          )}
          {activeSidebarLabel === "Problems" && currentContent?.content_type === "CodingProblem" && (
            <ProblemCard
              contentId={currentContent.id}
              courseId={parseInt(courseId || "0")}
              onSubmit={(code) => {
                console.log("Submitted code:", code);
              }}
            />
          )}
          {activeSidebarLabel === "Quiz" && currentContent?.content_type === "Quiz" && (
            <QuizCard
              contentId={currentContent.id}
              courseId={parseInt(courseId || "0")}
              isSidebarContentOpen={isSidebarContentOpen}
            />
          )}
          {activeSidebarLabel === "Article" && currentContent?.content_type === "Article" && (
            <ArticleCard
              contentId={currentContent.id}
              courseId={parseInt(courseId || "0")}
              onMarkComplete={() => {
                console.log("Marked as completed");
              }}
            />
          )}
          {activeSidebarLabel === "Subjective" && currentContent?.content_type === "Assignment" && (
            <SubjectiveCard
              contentId={currentContent.id}
              courseId={parseInt(courseId || "0")}
            />
          )}
          {activeSidebarLabel === "Development" && (
            <DevelopmentCard
              projectId={selectedProjectId || "dev1"}
              title="Development Project"
              description="Project description"
              initialHtml=""
              initialCss=""
              initialJs=""
              difficulty="Medium"
              onSubmit={(html, css, js) => {
                console.log("Submitted development project:", { html, css, js });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseTopicDetailPage;