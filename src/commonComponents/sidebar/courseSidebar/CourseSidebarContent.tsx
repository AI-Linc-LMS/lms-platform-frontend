import { useState } from "react";
import DashboardContent from "./component/DashboardContent";
import AllContent from "./component/AllContent";
import { dummyContent } from "./component/data/mockAllData";
import ArticleContent from "./component/ArticleContent";
import { dummyArticleContent } from "./component/data/mockArticleData";
import { dummyVideos } from "./component/data/mockVideoData";
import { problemsDummy } from "./component/data/mockProblemData";
import VideoContent from "./component/VideoContent";
import ProblemContent from "./component/ProblemContent";
import closeSidebarIcon from "../../../assets/course_sidebar_assets/closeSidebarIcon.png";

const dummyStats = [
  { title: "Articles", progress: 25, count: "1/3" },
  { title: "Videos", progress: 25, count: "1/3" },
  { title: "Problems", progress: 25, count: "1/3" },
  { title: "Quiz", progress: 25, count: "1/3" },
];

interface CourseSidebarContentProps {
  activeLabel: string;
  onClose: () => void;
}

const CourseSidebarContent = ({ activeLabel, onClose }: CourseSidebarContentProps) => {
  const [currentArticleTitle, setCurrentArticleTitle] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");

  const handleVideoClick = (id: string) => {
    setSelectedVideoId(id);
    // Your video playing logic here
    console.log("Play video with ID:", id);
  };

  const [selectedProblemId, setSelectedProblemId] = useState<
    string | undefined
  >(undefined);

  const handleProblemSelect = (id: string) => {
    setSelectedProblemId(id);
    // open the problem (navigate, show modal, etc.)
    console.log("Open problem with id:", id);
  };

  return (
    <div className="relative bg-white w-[500px] max-h-screen shadow-xl rounded-lg px-4 py-3 transition-all duration-300 mt-5">
      <button
        onClick={onClose}
        className="absolute top-1 -right-10 z-10 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 transition"
      >
        <img src={closeSidebarIcon} alt="Close" className="w-4 h-4" />
      </button>

      <div className="text-sm text-gray-700">
        {activeLabel === "Dashboard" && (
          <DashboardContent
            courseTitle="Machine Learning"
            courseType="Self pace"
            stats={dummyStats}
          />
        )}
        {activeLabel === "All" && <AllContent contents={dummyContent} />}
        {activeLabel === "Article" && (
          <ArticleContent
            articles={dummyArticleContent}
            selectedArticleId={currentArticleTitle}
            onArticleClick={(title) => setCurrentArticleTitle(title)}
          />
        )}
        {activeLabel === "Videos" && (
          <VideoContent
            videos={dummyVideos}
            selectedVideoId={selectedVideoId}
            onVideoClick={handleVideoClick}
            totalDuration="2hr 19m"
            topicNo={1}
            topicTitle="Introduction to machine learning model deployment"
            week="Week 1"
            difficulty="Beginner"
            completionPercentage={12}
          />
        )}
        {activeLabel === "Problems" && (
          <ProblemContent
            problems={problemsDummy}
            selectedProblemId={selectedProblemId}
            onSelect={handleProblemSelect}
          />
        )}
        {activeLabel === "Quiz" && <div>Quiz area and results.</div>}
      </div>
    </div>
  );
};

export default CourseSidebarContent;
