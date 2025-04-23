// Icons
import dashboardIcon from "../../../assets/course_sidebar_assets/dashboard/dashboardIcon.png";
import allIcon from "../../../assets/course_sidebar_assets/all/allIcon.png";
import articleIcon from "../../../assets/course_sidebar_assets/article/articleIcon.png";
import videosIcon from "../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import problemIcon from "../../../assets/course_sidebar_assets/problem/problemIcon.png";
import quizIcon from "../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";

import dashboardSelectIcon from "../../../assets/course_sidebar_assets/dashboard/dashboardSelectIcon.png";
import allSelectIcon from "../../../assets/course_sidebar_assets/all/allSelectIcon.png";
import videosSelectIcon from "../../../assets/course_sidebar_assets/video/videosSelectIcon.png";
import problemSelectIcon from "../../../assets/course_sidebar_assets/problem/problemSelectIcon.png";
import quizSelectIcon from "../../../assets/course_sidebar_assets/quiz/selectQuizIcon.png";

interface Props {
  activeLabel: string | null;
  onSelect: (label: string) => void;
}

const CourseSidebar = ({ activeLabel, onSelect }: Props) => {
  const menuItems = [
    {
      label: "Dashboard",
      icon: dashboardIcon,
      selectIcon: dashboardSelectIcon,
    },
    { label: "All", icon: allIcon, selectIcon: allSelectIcon },
    { label: "Article", icon: articleIcon, selectIcon: articleIcon },
    { label: "Videos", icon: videosIcon, selectIcon: videosSelectIcon },
    { label: "Problems", icon: problemIcon, selectIcon: problemSelectIcon },
    { label: "Quiz", icon: quizIcon, selectIcon: quizSelectIcon },
  ];

  return (
    <div className="bg-[#D9F5FC] rounded-lg inline-flex flex-col items-center max-h-[410px] w-18 ml-5 mt-5 mr-1">
      {menuItems.map((item, idx) => {
        const isActive = item.label === activeLabel;

        return (
          <button
            key={idx}
            onClick={() => onSelect(item.label)}
            className={`flex flex-col items-center px-2 py-3 rounded-lg w-full transition-colors duration-200 cursor-pointer ${
              isActive ? "bg-[#0E1F2F]" : "bg-transparent"
            }`}
          >
            <img
              src={isActive ? item.selectIcon : item.icon}
              alt={item.label}
              className={`object-contain ${
                isActive ? "w-6 h-6 filter invert brightness-0" : "w-6 h-6"
              }`}
            />

            <span
              className={`text-[11px] font-medium mt-1 ${
                isActive ? "text-white" : "text-[#0E1F2F]"
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
