import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockCourseContent } from "../data/mockCourseContent";
import CourseSidebar from "../../../commonComponents/sidebar/courseSidebar/CourseSidebar";
import CourseSidebarContent from "../../../commonComponents/sidebar/courseSidebar/CourseSidebarContent";
// import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import VideoCard from "../components/course-cards/video/VideoCard";
import QuizCard from "../components/course-cards/quiz/QuizCard";
import ArticleCard from "../components/course-cards/article/ArticleCard";
import ProblemCard from "../components/course-cards/problem/ProblemCard";
import { quizData } from "../../../commonComponents/sidebar/courseSidebar/component/data/mockQuizData";
import expandSidebarIcon from "../../../assets/course_sidebar_assets/expandSidebarIcon.png";
import { dummyArticles } from "../data/mockArticleData";
import { mockProblems } from "../data/mockProblemData";
import BackToPreviousPage from "../../../commonComponents/common-buttons/back-buttons/back-to-previous-page/BackToPreviousPage";

const CourseTopicDetailPage: React.FC = () => {
  const { weekId, topicId } = useParams<{ weekId: string; topicId: string }>();
  const navigate = useNavigate();
  
  // State for content selection
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(0);
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>(undefined);
  
  const currentContentIndex = selectedArticleId || 0;

  // State for sidebar
  const [isSidebarContentOpen, setIsSidebarContentOpen] = useState(false);
  const [activeSidebarLabel, setActiveSidebarLabel] = useState("Dashboard");

  // Find the current week and topic from mock data
  const currentWeek = mockCourseContent.find((week) => week.id === weekId);
  if (!currentWeek) {
    navigate("/learn");
    return null;
  }

  const currentTopic = currentWeek.modules.find((topic) => topic.id === topicId);
  if (!currentTopic) {
    navigate(`/learn/${weekId}`);
    return null;
  }

  // Get next content
  const nextContent = () => {
    console.log("Moving to next content");
    // For now, this is just a placeholder function
  };

  // Handle sidebar label selection
  const handleSidebarLabelSelect = (label: string) => {
    setActiveSidebarLabel(label);
    setIsSidebarContentOpen(true);
  };

  // Handle problem selection
  const handleProblemSelect = (id: string) => {
    setSelectedProblemId(id);
    setActiveSidebarLabel("Problems");
    console.log("Selected problem:", id);
  };

  // Sample video URL - in a real app, this would come from your API
  const sampleVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  const handleNextQuestion = () => {
    if (selectedQuizId && selectedQuizId < quizData.length - 1) {
      setSelectedQuizId(selectedQuizId + 1);
    } else {
      // Handle the case when the quiz is finished (e.g., redirect or show results)
      alert("Quiz Completed!");
    }
  };

  const getNextQuestionTitle = () => {
    return selectedQuizId !== null && selectedQuizId < quizData.length - 1
      ? "Next Question"
      : "Finish Quiz";
  };

  const getNextTopicTitle = () => {
    const currentTopicIndex = currentWeek.modules.findIndex(
      (m) => m.id === topicId
    );
    if (currentTopicIndex < currentWeek.modules.length - 1) {
      return currentWeek.modules[currentTopicIndex + 1].title;
    }
    return "Next Topic";
  };

  const quizProps = {
    selectedQuizId,
    onSelectQuiz: (id: number) => setSelectedQuizId(id), 
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

  // Find the selected problem by ID
  const selectedProblem = mockProblems.find(problem => problem.id === selectedProblemId);

  return (
    <div className="mx-auto px-4 pb-8 w-full">
      <BackToPreviousPage/>

      <div className="flex mt-4 w-full">
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
            />
          )}
          {!isSidebarContentOpen && (
            <button
              onClick={() => setIsSidebarContentOpen(true)}
              className="absolute top-32 left-[142px] bg-white rounded-full shadow-md p-2 hover:bg-gray-100 transition z-10"
              title="Expand Sidebar"
            >
              <img src={expandSidebarIcon} alt="Expand" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${isSidebarContentOpen ? "ml-12" : ""} overflow-hidden`}>
          {(activeSidebarLabel === "Videos" ||
            activeSidebarLabel === "Dashboard" || 
            activeSidebarLabel === "All") && (
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
          {activeSidebarLabel === "Quiz" && selectedQuizId !== null && (
            <QuizCard
              quizData={quizData[selectedQuizId - 1]}
              onNext={handleNextQuestion}
              nextTitle={getNextQuestionTitle()}
              questionNumber={selectedQuizId}
              totalQuestions={quizData.length}
            />
          )}
          {activeSidebarLabel === "Article" && (
            <ArticleCard
              title={dummyArticles[currentContentIndex].title}
              content={dummyArticles[currentContentIndex].content}
              marks={dummyArticles[currentContentIndex].marks}
              completed={dummyArticles[currentContentIndex].completed}
              onMarkComplete={() => {
                console.log("Marked as completed");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseTopicDetailPage;
