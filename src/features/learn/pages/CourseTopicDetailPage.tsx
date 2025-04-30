import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockCourseContent } from "../data/mockCourseContent";
import CourseSidebar from "../../../commonComponents/sidebar/courseSidebar/CourseSidebar";
import CourseSidebarContent from "../../../commonComponents/sidebar/courseSidebar/CourseSidebarContent";

import VideoCard from "../components/course-cards/video/VideoCard";
import QuizCard from "../components/course-cards/quiz/QuizCard";
import ArticleCard from "../components/course-cards/article/ArticleCard";
import { quizData } from "../../../commonComponents/sidebar/courseSidebar/component/data/mockQuizData";
import expandSidebarIcon from "../../../assets/course_sidebar_assets/expandSidebarIcon.png";
import { dummyArticles } from "../data/mockArticleData";
import ProblemCard from "../components/course-cards/problem/ProblemCard";
import { mockProblems } from "../data/mockProblemData";
import BackToPreviousPage from "../../../commonComponents/common-buttons/back-buttons/back-to-previous-page/BackToPreviousPage";
import SubjectiveCard from "../components/course-cards/subjective/SubjectiveCard";
import DevelopmentCard from "../components/course-cards/development/DevelopmentCard";
import { mockDevelopmentProjects } from "../data/mockDevelopmentData";

const CourseTopicDetailPage: React.FC = () => {
  const { weekId, topicId } = useParams<{ weekId: string; topicId: string }>();
  const navigate = useNavigate();
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number>(1);
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>("p1"); // Initialize with a default problem
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>("dev1"); // Initialize with a default development project
  // State for sidebar
  const [activeSidebarLabel, setActiveSidebarLabel] =
    useState<string>("Videos");
  const [isSidebarContentOpen, setIsSidebarContentOpen] =
    useState<boolean>(true);

  // Find the current week and topic from mock data
  const currentWeek = mockCourseContent.find((week) => week.id === weekId);
  const currentTopic = currentWeek?.modules.find(
    (module) => module.id === topicId
  );

  // Define the fallback for early return, so hooks are still called
  if (!currentWeek || !currentTopic) {
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

  // Handle navigation to next content item
  const nextContent = () => {
    if (currentContentIndex < currentTopic.content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else if (currentWeek.modules.length > 1) {
      // Move to next topic if available
      const currentTopicIndex = currentWeek.modules.findIndex(
        (m) => m.id === topicId
      );
      if (currentTopicIndex < currentWeek.modules.length - 1) {
        const nextTopic = currentWeek.modules[currentTopicIndex + 1];
        navigate(`/learn/course/${weekId}/${nextTopic.id}`);
      }
    }
  };

  // Find the next topic to show in the Next button
  const getNextTopicTitle = () => {
    const currentTopicIndex = currentWeek.modules.findIndex(
      (m) => m.id === topicId
    );
    if (currentTopicIndex < currentWeek.modules.length - 1) {
      return currentWeek.modules[currentTopicIndex + 1].title;
    }
    return "Next Topic";
  };

  // Handle sidebar label selection
  const handleSidebarLabelSelect = (label: string) => {
    setActiveSidebarLabel(label);
    setIsSidebarContentOpen(true);
  };

  const handleProblemSelect = (id: string) => {
    setSelectedProblemId(id);
    setActiveSidebarLabel("Problems");
    console.log("Selected problem:", id);
  };

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    setActiveSidebarLabel("Development");
    console.log("Selected development project:", id);
  };

  // Sample video URL - in a real app, this would come from your API
  const sampleVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  const quizProps = {
    selectedQuizId,
    onSelectQuiz: (id: number) => setSelectedQuizId(id),
    quizzes: quizData,
  };

  const articleProps = {
    articles: dummyArticles,
    selectedArticleId,
    onArticleClick: (id: number) => setSelectedArticleId(id),
  };


  const problemProps = {
    selectedProblemId,
    onProblemSelect: handleProblemSelect,
  };

  const developmentProps = {
    selectedProjectId,
    onProjectSelect: handleProjectSelect,
  };

  // Find the selected problem by ID
  const selectedProblem = mockProblems.find(problem => problem.id === selectedProblemId);
  
  // Find the selected development project by ID
  const selectedProject = selectedProjectId ? mockDevelopmentProjects[selectedProjectId] : undefined;

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
              activeLabel={activeSidebarLabel}
              onClose={() => setIsSidebarContentOpen(false)}
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
          {activeSidebarLabel !== "Problems" && 
            activeSidebarLabel !== "Quiz" && 
            activeSidebarLabel !== "Article" && 
            activeSidebarLabel !== "Subjective" &&
            activeSidebarLabel !== "Development" && (
            <VideoCard
              currentWeek={currentWeek}
              currentTopic={currentTopic}
              sampleVideoUrl={sampleVideoUrl}
              nextContent={nextContent}
              getNextTopicTitle={getNextTopicTitle}
            />
          )}
          {activeSidebarLabel === "Problems" && selectedProblem && (
            <div className="h-[calc(100vh-10rem)] w-full">
              <ProblemCard
                problemId={selectedProblem.id}
                title={selectedProblem.title}
                description={selectedProblem.description}
                difficulty={selectedProblem.difficulty}
                testCases={selectedProblem.testCases}
                initialCode={selectedProblem.initialCode["javascript"]}
                language="javascript"
                onSubmit={(code) => {
                  console.log("Submitted code:", code);
                  // Here you would typically send the code to your API for evaluation
                }}
              />
            </div>
          )}
          {activeSidebarLabel === "Quiz" && (
            <QuizCard
              quizId={selectedQuizId}
              isSidebarContentOpen={isSidebarContentOpen}
            />
          )}
          {activeSidebarLabel === "Article" && (
            <ArticleCard
              title={dummyArticles[selectedArticleId - 1]?.title}
              content={dummyArticles[selectedArticleId - 1]?.content}
              marks={dummyArticles[selectedArticleId - 1]?.marks}
              completed={dummyArticles[selectedArticleId - 1]?.completed}
              onMarkComplete={() => {
                console.log("Marked as completed");
              }}
            />
          )}
          {activeSidebarLabel === "Subjective" && (
            <SubjectiveCard
              title="Comparison Of Electric Supercar And IC Engine Supercar Specs"
              overview="The aim of this project is to compare the specs of two supercar models: an Electric supercar and an IC Engine supercar. The comparison will be based on performance, cost, environmental impact, maintenance and repairs, comfort and convenience, and driving experience."
            />
          )}
          {activeSidebarLabel === "Development" && selectedProject && (
            <div className="h-full min-h-[calc(100vh-10rem)] w-full max-w-full pr-4 overflow-auto">
              <DevelopmentCard
                projectId={selectedProject.id}
                title={selectedProject.title}
                description={selectedProject.description}
                initialHtml={selectedProject.initialHtml}
                initialCss={selectedProject.initialCss}
                initialJs={selectedProject.initialJs}
                difficulty={selectedProject.difficulty}
                onSubmit={(html, css, js) => {
                  console.log("Submitted development project:", { html, css, js });
                  // Here you would typically send the code to your API for evaluation
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseTopicDetailPage;