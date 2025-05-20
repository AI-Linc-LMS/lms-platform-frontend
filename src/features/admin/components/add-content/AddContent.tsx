import React from "react";
import VideoIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import ArticleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import ProblemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import QuizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import AssignmentIcon from "../../../../assets/course_sidebar_assets/subjective/subjectiveicon.png";
import DevelopmentIcon from "../../../../assets/course_sidebar_assets/development/developmenticon.png";
import { TabKey } from "../../types/course";


interface AddContentProps {
  tabKey: TabKey;
  onSave?: () => void;
  onAddNew: (tabKey: TabKey) => void;
}

const metaData: Record<
  TabKey,
  {
    label: string;
    placeholder: string;
    icon: string; // Image path
  }
> = {
  videos: {
    label: "Video",
    placeholder: "Choose a video from the library",
    icon: VideoIcon,
  },
  articles: {
    label: "Article",
    placeholder: "Choose an article from the library",
    icon: ArticleIcon,
  },
  problems: {
    label: "Problem",
    placeholder: "Choose a problem from the library",
    icon: ProblemIcon,
  },
  quiz: {
    label: "Quiz",
    placeholder: "Choose a quiz from the library",
    icon: QuizIcon,
  },
  subjective: {
    label: "Subjective",
    placeholder: "Choose a subjective from the library",
    icon: AssignmentIcon,
  },
  development: {
    label: "Development",
    placeholder: "Choose a development from the library",
    icon: DevelopmentIcon,
  },
};

const AddContent: React.FC<AddContentProps> = ({
  tabKey,
  onSave,
  onAddNew,
}) => {
  const { label, placeholder, icon } = metaData[tabKey];

  return (
    <div className="w-full p-4 rounded-lg space-y-6">
      {/* Dropdown and Save Button */}
      <div className="flex flex-col md:flex-row border border-gray-300 rounded-lg p-4 items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-3/4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Choose {label}
          </label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
            defaultValue=""
          >
            <option value="" disabled>
              {placeholder}
            </option>
            <option value="demo1">Demo {label} 1</option>
            <option value="demo2">Demo {label} 2</option>
          </select>
        </div>
        <button
          onClick={onSave}
          className="h-10 px-4 mt-2 md:mt-6 bg-[#255C79] text-white rounded-xl transition"
        >
          Save Content
        </button>
      </div>

      {/* OR Divider */}
      <div className="flex items-center justify-center gap-2">
        <hr className="w-full border-dashed border-gray-300" />
        <span className="text-gray-500 text-sm">OR</span>
        <hr className="w-full border-dashed border-gray-300" />
      </div>

      {/* Add New Content Box */}
      <div className="border border-gray-300 rounded-lg flex flex-col items-center justify-center py-10">
        <div className="bg-blue-100 p-2 rounded-full">
          <img src={icon} alt={label} className="w-8 h-8" />
        </div>
        <button
          onClick={() => onAddNew(tabKey)}
          className="mt-4 px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
        >
          Add New {label}
        </button>
      </div>
    </div>
  );
};

export default AddContent;
