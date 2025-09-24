// Icons
import dashboardIcon from "../../../assets/course_sidebar_assets/dashboard/dashboardIcon.png";
import allIcon from "../../../assets/course_sidebar_assets/all/allIcon.png";
import articleIcon from "../../../assets/course_sidebar_assets/article/articleIcon.png";
import videosIcon from "../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import problemIcon from "../../../assets/course_sidebar_assets/problem/problemIcon.png";
import quizIcon from "../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import subjectiveicon from "../../../assets/course_sidebar_assets/subjective/subjectiveicon.png";
import developmenticon from "../../../assets/course_sidebar_assets/development/developmenticon.png";

import dashboardSelectIcon from "../../../assets/course_sidebar_assets/dashboard/dashboardSelectIcon.png";
import allSelectIcon from "../../../assets/course_sidebar_assets/all/allSelectIcon.png";
import videosSelectIcon from "../../../assets/course_sidebar_assets/video/videosSelectIcon.png";
import problemSelectIcon from "../../../assets/course_sidebar_assets/problem/problemSelectIcon.png";
import quizSelectIcon from "../../../assets/course_sidebar_assets/quiz/selectQuizIcon.png";
import subjectiveSelection from "../../../assets/course_sidebar_assets/subjective/subjectiveSelection.png";
import developmentSelection from "../../../assets/course_sidebar_assets/development/develpmentSelection.png";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

interface Props {
  activeLabel: string | null;
  onSelect: (label: string) => void;
}

const CourseSidebar = ({ activeLabel, onSelect }: Props) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Base menu items (shown on both mobile and desktop)
  const menuItems = [
    { label: "All", icon: allIcon, selectIcon: allSelectIcon },
    { label: "Article", icon: articleIcon, selectIcon: articleIcon },
    { label: "Videos", icon: videosIcon, selectIcon: videosSelectIcon },
    { label: "Quiz", icon: quizIcon, selectIcon: quizSelectIcon },
    {
      label: "Subjective",
      icon: subjectiveicon,
      selectIcon: subjectiveSelection,
    },
  ];

  if (!isMobile) {
    // Add desktop-only items in the exact order
    menuItems.unshift({
      label: "Dashboard",
      icon: dashboardIcon,
      selectIcon: dashboardSelectIcon,
    });
    // Add Problems and Development in correct positions
    const videosIndex = menuItems.findIndex((item) => item.label === "Videos");
    menuItems.splice(videosIndex + 1, 0, {
      label: "Problems",
      icon: problemIcon,
      selectIcon: problemSelectIcon,
    });
    menuItems.push({
      label: "Development",
      icon: developmenticon,
      selectIcon: developmentSelection,
    });
  }

  return (
    <div
      className={`${
        isMobile
          ? "flex flex-row justify-between items-center w-full bg-white fixed bottom-0 left-0 right-0 z-50 py-3 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-200"
          : "bg-[#D9F5FC] rounded-lg inline-flex flex-col items-center max-h-[560px] w-18 ml-5 mt-5 mr-1"
      }`}
    >
      {menuItems.map((item, idx) => {
        const isActive = item.label === activeLabel;

        return (
          <button
            key={idx}
            onClick={() => onSelect(item.label)}
            className={`flex ${
              isMobile
                ? "flex-col items-center justify-center"
                : "flex-col items-center w-full"
            } 
              ${isMobile ? "px-2" : "px-2 py-3"}
              ${
                isMobile && isActive
                  ? "border-b-2 border-[#0E1F2F] -mb-[1px]"
                  : ""
              }
              ${
                !isMobile && isActive
                  ? "bg-[#0E1F2F] rounded-lg"
                  : "bg-transparent rounded-lg"
              }
              transition-colors duration-200 cursor-pointer`}
          >
            <img
              src={isActive ? item.selectIcon : item.icon}
              alt={item.label}
              className={`object-contain ${
                isActive
                  ? `${
                      isMobile
                        ? "w-6 h-6"
                        : "w-5 h-5 md:w-6 md:h-6 filter invert brightness-0"
                    }`
                  : "w-5 h-5 md:w-6 md:h-6"
              }`}
            />

            <span
              className={`mt-1 text-[10px] md:text-[11px] font-medium ${
                isActive
                  ? `${
                      isMobile ? "text-[#0E1F2F]" : "text-[var(--font-light)]"
                    }`
                  : "text-gray-500"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CourseSidebar;
