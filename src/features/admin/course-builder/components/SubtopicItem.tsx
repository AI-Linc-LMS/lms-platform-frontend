import React from 'react';
import ArticleIcon from "../../../../commonComponents/icons/admin/content/ArticleIcon.png";
import VideoIcon from "../../../../commonComponents/icons/admin/content/VideosIcon.png";
import ProblemIcon from "../../../../commonComponents/icons/admin/content/ProblemIcon.png";
import QuizIcon from "../../../../commonComponents/icons/admin/content/QuizIcon.png";
import AssignmentIcon from "../../../../commonComponents/icons/admin/content/SubjectiveIcon.png";
import DevelopmentIcon from "../../../../commonComponents/icons/admin/content/DevelopmentIcon.png";


interface SubtopicItemProps {
  key: string;
  title: string;
  marks: number;
  stats: {
    videos: number;
    articles: number;
    problems: number;
    quiz: number;
    subjective: number;
    development: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onAddContent: (subtopicId: number) => void;
}

const statIcons = [
  { icon: ArticleIcon, label: "Articles", key: "articles" },
  { icon: VideoIcon, label: "Videos", key: "videos" },
  { icon: ProblemIcon, label: "Problems", key: "problems" },
  { icon: QuizIcon, label: "Quizzes", key: "quiz" },
  { icon: AssignmentIcon, label: "Assignments", key: "subjective" },
  { icon: DevelopmentIcon, label: "Development", key: "development" },
];

export const SubtopicItem: React.FC<SubtopicItemProps> = ({
  key,
  title,
  marks,
  stats,
  onEdit,
  onDelete,
  onAddContent,
}) => {
  const handleAddContent = (key: number) => {
    onAddContent(key);
  };
  return (
    <div className="flex items-center justify-between bg-white rounded-md border border-gray-200 px-4 py-2 mb-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-800">{title}</span>
          <button onClick={onEdit} className="ml-1 text-gray-400 hover:text-blue-600">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>
        <span className="text-xs text-gray-400 mt-1">Marks: {marks}</span>
      </div>
      <div className="flex items-center gap-2">
        {statIcons.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-md px-3 py-2">
            <img src={item.icon} alt={item.label} className="w-4 h-4" />
            <span className="text-xs text-gray-500 font-medium">
              {stats[item.key as keyof typeof stats]}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center gap-2">
        <button onClick={onDelete} className="ml-2 text-red-500 border border-red-200 hover:bg-red-100 rounded-md px-2 py-2 flex items-center">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
        <button onClick={() => handleAddContent(Number(key))} className="ml-2 border border-blue-200 bg-white text-[#17627A] hover:bg-blue-50 rounded-md px-4 py-2 text-sm font-medium">
          + Content
        </button>
      </div>
    </div>
  );
};

export default SubtopicItem;
