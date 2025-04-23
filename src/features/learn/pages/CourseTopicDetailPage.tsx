import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockCourseContent } from "../data/mockCourseContent";
import CourseSidebar from "../../../commonComponents/sidebar/courseSidebar/CourseSidebar";
import CourseSidebarContent from "../../../commonComponents/sidebar/courseSidebar/CourseSidebarContent";
import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import VideoCard from "../components/course-cards/video/VideoCard";
import QuizCard from "../components/course-cards/quiz/QuizCard";
import ArticleCard from "../components/course-cards/article/ArticleCard";
import { quizData } from "../../../commonComponents/sidebar/courseSidebar/component/data/mockQuizData";
import expandSidebarIcon from "../../../assets/course_sidebar_assets/expandSidebarIcon.png";
import { dummyArticles } from "../data/mockArticleData";

const CourseTopicDetailPage: React.FC = () => {
  const { weekId, topicId } = useParams<{ weekId: string; topicId: string }>();
  const navigate = useNavigate();
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number>(1);

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
          className="px-4 py-2 bg-[#255C79] text-white rounded-xl"
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

  return (
    <div className="pb-8">
      <BackToHomeButton />

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
        <div className={`flex-1 mt-6 ${isSidebarContentOpen ? "ml-12" : ""}`}>
          {(activeSidebarLabel === "Videos" ||
            activeSidebarLabel === "Dashboard" ||
            activeSidebarLabel === "All" ||
            activeSidebarLabel === "Problems") && (
            <VideoCard
              currentWeek={currentWeek}
              currentTopic={currentTopic}
              sampleVideoUrl={sampleVideoUrl}
              nextContent={nextContent}
              getNextTopicTitle={getNextTopicTitle}
            />
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
        </div>
      </div>
    </div>
  );
};

export default CourseTopicDetailPage;
