import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSubmoduleById } from "../../../services/courses-content/courseContentApis";
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
  submissions?: number;
  questions?: number;
  accuracy?: number;
}

export interface SubmoduleData {
  data: SubmoduleContent[];
  moduleName: string;
  submoduleName: string;
  submoduleId: number;
  weekNo: number;
}


const CourseTopicDetailPage: React.FC = () => {
  const { courseId, submoduleId } = useParams<{ courseId: string; submoduleId: string }>();
  const navigate = useNavigate();
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number>(1);
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [activeSidebarLabel, setActiveSidebarLabel] = useState<string>("All");
  const [isSidebarContentOpen, setIsSidebarContentOpen] = useState<boolean>(true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedContentId, setSelectedContentId] = useState<number | undefined>();

  console.log("activeSidebarLabel", activeSidebarLabel);
  // Effect to close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarContentOpen(false);
    } else if (!isMobile && !isSidebarContentOpen) {
      setIsSidebarContentOpen(true);
    }
  }, [isMobile]);

  // Fetch submodule data
  const { data: submoduleData, isLoading: isSubmoduleLoading, error: submoduleError } = useQuery<SubmoduleData>({
    queryKey: ['submodule', submoduleId],
    queryFn: () => getSubmoduleById(1, parseInt(courseId || "0"), parseInt(submoduleId || "0")),
    enabled: !!courseId && !!submoduleId,
  });

  // Set default selected content when submodule data changes
  useEffect(() => {
    if (submoduleData?.data) {
      // Only set the first video as selected if we're in the Videos section
      if (activeSidebarLabel === "Videos") {
        const firstVideo = submoduleData.data.find(content => content.content_type === 'VideoTutorial');
        if (firstVideo) {
          setSelectedVideoId(firstVideo.id.toString());
          setCurrentContentIndex(submoduleData.data.indexOf(firstVideo));
        }
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
        setSelectedAssignmentId(firstAssignment.id);
      }

      // Find the first development project
      const firstDevelopment = submoduleData.data.find(content => content.content_type === 'Development');
      if (firstDevelopment) {
        setSelectedProjectId(firstDevelopment.id.toString());
      }
    }
  }, [submoduleData, activeSidebarLabel]);

  // Props objects for each content type
  const videoProps = {
    selectedVideoId,
    onVideoClick: (id: string) => {
      console.log("Video Clicked - ID:", id);
      setSelectedVideoId(id);
      const videoIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (videoIndex !== undefined && videoIndex !== -1) {
        setCurrentContentIndex(videoIndex);
      }
    },
    videos: [] // Empty array since the actual videos are handled in CourseSidebarContent
  };

  const quizProps = {
    selectedQuizId,
    onSelectQuiz: (id: number) => {
      console.log("Quiz Selected - ID:", id);
      setSelectedQuizId(id);
      const quizIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (quizIndex !== undefined && quizIndex !== -1) {
        setCurrentContentIndex(quizIndex);
      }
    },
    quizzes: [] // Empty array since the actual quizzes are handled in CourseSidebarContent
  };

  const problemProps = {
    selectedProblemId,
    onProblemSelect: (id: string) => {
      console.log("Problem Selected - ID:", id);
      setSelectedProblemId(id);
      const problemIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id.toString() === id
      );
      if (problemIndex !== undefined && problemIndex !== -1) {
        setCurrentContentIndex(problemIndex);
      }
    },
    problems: [] // Empty array since the actual problems are handled in CourseSidebarContent
  };

  const articleProps = {
    selectedArticleId,
    onArticleClick: (id: number) => {
      console.log("Article Selected - ID:", id);
      setSelectedArticleId(id);
      const articleIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (articleIndex !== undefined && articleIndex !== -1) {
        setCurrentContentIndex(articleIndex);
      }
    },
    articles: [] // Empty array since the actual articles are handled in CourseSidebarContent
  };

  const developmentProps = {
    selectedProjectId,
    onProjectSelect: (id: string) => {
      console.log("Project Selected - ID:", id);
      setSelectedProjectId(id);
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
      console.log("Assignment Selected - ID:", id);
      setSelectedAssignmentId(id);
      const assignmentIndex = submoduleData?.data?.findIndex(
        (content: SubmoduleContent) => content.id === id
      );
      if (assignmentIndex !== undefined && assignmentIndex !== -1) {
        setCurrentContentIndex(assignmentIndex);
      }
    },
    assignments: [] // Empty array since the actual assignments are handled in CourseSidebarContent
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
    // Only change the activeSidebarLabel if it's a direct sidebar label click
    if (label !== activeSidebarLabel) {
      setActiveSidebarLabel(label);
    }
    setIsSidebarContentOpen(true);

    // Find the first content of the selected type
    const firstContent = submoduleData?.data?.find(content => {
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

  const handleContentSelect = (contentId: number, contentType: "VideoTutorial" | "CodingProblem" | "Development" | "Assignment" | "Article" | "Quiz") => {
    setSelectedContentId(contentId);
    setCurrentContentIndex(submoduleData?.data?.findIndex(content => content.id === contentId) ?? 0);
    
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
  console.log("Active Sidebar Label:", activeSidebarLabel);

  return (
    <div style={{ paddingBottom: isMobile ? "calc(60px + 1.5rem)" : "2rem" }} className="relative min-h-screen">
      <BackToPreviousPage />

      <div className="flex flex-col md:flex-row mt-4 relative">
        {/* Sidebar container - only shown as content panel on desktop */}
        {!isMobile && (
          <div className="flex">
            <CourseSidebar
              activeLabel={activeSidebarLabel}
              onSelect={handleSidebarLabelSelect}
            />
            {isSidebarContentOpen && (
              <CourseSidebarContent
                submoduleData={submoduleData}
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
                submoduleData={submoduleData}
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
            className="absolute top-20 left-[112px] bg-white rounded-full shadow-md p-2 hover:bg-gray-100 transition z-10 cursor-pointer"
            title="Expand Sidebar"
          >
            <img src={expandSidebarIcon} alt="Expand" className="w-5 h-5" />
          </button>
        )}

        {/* Main Content */}
        <div 
          className={`flex-1 mt-6 px-4 md:px-0 ${isMobile ? 'w-full mb-4' : ''} ${isSidebarContentOpen && !isMobile ? "md:ml-12" : ""} overflow-hidden`}
        >
          {isMobile && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#255C79]">{currentContent.title}</h2>
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
              className="fixed top-20 right-4 z-20 bg-[#255C79] text-white rounded-full shadow-md p-3 hover:bg-[#1a4057] transition"
              title="Open Course Contents"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          )}
          
          {/* Content display based on active tab */}
          <div className="mb-20 md:mb-0">
            {currentContent?.content_type === "VideoTutorial" && (
              <VideoCard
                currentWeek={{ title: `Week ${submoduleData.weekNo}` }}
                currentTopic={{ title: currentContent.title }}
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                nextContent={nextContent}
                getNextTopicTitle={getNextTopicTitle}
              />
            )}
            {currentContent?.content_type === "CodingProblem" && (
              <ProblemCard
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                onSubmit={(code) => {
                  console.log("Submitted code:", code);
                }}
              />
            )}
            {currentContent?.content_type === "Quiz" && (
              <QuizCard
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                isSidebarContentOpen={isSidebarContentOpen}
              />
            )}
            {currentContent?.content_type === "Article" && (
              <ArticleCard
                contentId={currentContent.id}
                courseId={parseInt(courseId || "0")}
                onMarkComplete={() => {
                  console.log("Marked as completed");
                }}
              />
            )}
            {currentContent?.content_type === "Assignment" && (
              <SubjectiveCard
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
                  console.log("Submitted development project:", { html, css, js });
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
          />
        </div>
      )}
    </div>
  );
};

export default CourseTopicDetailPage;