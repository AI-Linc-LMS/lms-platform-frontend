import closeIcon from "../../../commonComponents/icons/admin/content/CloseCircleIcon.png";
import ArticleIcon from "../../../assets/course_sidebar_assets/article/articleIcon.png";
import VideoIcon from "../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import ProblemIcon from "../../../assets/course_sidebar_assets/problem/problemIcon.png";
import QuizIcon from "../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import AssignmentIcon from "../../../assets/course_sidebar_assets/subjective/subjectiveicon.png";
import DevelopmentIcon from "../../../assets/course_sidebar_assets/development/developmenticon.png";
import { TabKey } from "../types/course";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  setActiveTab: (tab: TabKey) => void;
  activeTab: TabKey;
  children: React.ReactNode;
}

const tabList = [
  { key: "videos" as TabKey, label: "Videos", icon: VideoIcon },
  { key: "articles" as TabKey, label: "Articles", icon: ArticleIcon },
  { key: "problems" as TabKey, label: "Problems", icon: ProblemIcon },
  { key: "quizzes" as TabKey, label: "Quiz", icon: QuizIcon },
  { key: "subjective" as TabKey, label: "Subjective", icon: AssignmentIcon },
  { key: "development" as TabKey, label: "Development", icon: DevelopmentIcon },
];

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  setActiveTab,
  activeTab,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1112] flex items-end justify-center w-full bg-black/30">
      <div
        className={`bg-white w-full rounded-t-2xl p-6 shadow-lg relative animate-slideUp`}
      >
        <div className="text-xl font-bold mb-4 w-full">Add Content</div>
        <button
          className="absolute top-2 right-4 text-2xl"
          onClick={onClose}
          aria-label="Close bottom sheet"
        >
          <img src={closeIcon} alt="close" className="w-6 h-6 relative mt-2" />
        </button>
        <div className="flex gap-2 mb-6 w-full">
          {tabList.map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center gap-1 px-4 py-1 rounded-md border text-xs transition-colors text-[#255C79] bg-[#D7EFF6] 
                                ${
                                  activeTab === tab.key
                                    ? "border-[#255C79]"
                                    : "border-blue-100 bg-[#F4FDFF]"
                                }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <img src={tab.icon} alt={tab.label} className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[#E5E5E5] mb-5"></div>
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
