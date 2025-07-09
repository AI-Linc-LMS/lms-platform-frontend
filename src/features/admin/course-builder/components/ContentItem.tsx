import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ArticleIcon from "../../../../commonComponents/icons/admin/content/ArticleIcon.png";
import VideosIcon from "../../../../commonComponents/icons/admin/content/VideosIcon.png";
import ProblemIcon from "../../../../commonComponents/icons/admin/content/ProblemIcon.png";
import QuizIcon from "../../../../commonComponents/icons/admin/content/QuizIcon.png";
import SubjectiveIcon from "../../../../commonComponents/icons/admin/content/SubjectiveIcon.png";
import DevelopmentIcon from "../../../../commonComponents/icons/admin/content/DevelopmentIcon.png";
import EditIcon from "../../../../commonComponents/icons/admin/EditIcon.png";

interface ContentItemProps {
  id: number;
  title: string;
  marks?: number | string;
  contentType: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDraggable?: boolean;
}

const iconMap: Record<string, string> = {
  article: ArticleIcon,
  videotutorial: VideosIcon,
  codingproblem: ProblemIcon,
  quiz: QuizIcon,
  subjective: SubjectiveIcon,
  assignment: DevelopmentIcon,
};

const SortableContentItem: React.FC<ContentItemProps> = ({
  id,
  title,
  contentType,
  onEdit,
  onDelete,
  isDraggable = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const icon = iconMap[contentType.toLowerCase()] || ArticleIcon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between border-b border-gray-200 py-2 ${
        isDragging ? "z-50" : ""
      } ${isDraggable ? "cursor-move" : ""}`}
      {...attributes}
      {...(isDraggable ? listeners : {})}
    >
      <div className="flex items-center gap-2">
        {isDraggable && (
          <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        )}
        <img src={icon} alt={contentType} className="w-5 h-5" />
        <div>
          <div className="text-sm font-medium text-[#255C79]">{title}</div>
          {contentType !== undefined && (
            <div className="text-xs text-gray-500">
              {contentType}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="ml-2 text-red-500 border border-red-200 hover:bg-red-100 rounded-md px-4 py-3 flex items-center"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
        <button
          className="bg-blue-50 text-[#17627A] border-1 border-[#255C79] rounded-md px-4 py-3 hover:bg-[#C9C9C9]"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
        >
          <img src={EditIcon} alt="Edit" className="w-3 h-4" />
        </button>
      </div>
    </div>
  );
};

const ContentItem: React.FC<ContentItemProps> = (props) => {
  console.log("marks", props.marks);
  const icon = iconMap[props.contentType.toLowerCase()] || ArticleIcon;
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2">
      <div className="flex items-center gap-2">
        <img src={icon} alt={props.contentType} className="w-5 h-5" />
        <div>
          <div className="text-sm font-medium text-[#255C79]">{props.title}</div>
          {props.contentType !== undefined && (
            <div className="text-xs text-gray-500">
              {props.contentType}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => props.onDelete(props.id)}
          className="ml-2 text-red-500 border border-red-200 hover:bg-red-100 rounded-md px-4 py-3 flex items-center"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
        <button
          className="bg-blue-50 text-[#17627A] border-1 border-[#255C79] rounded-md px-4 py-3 hover:bg-[#C9C9C9]"
          onClick={() => props.onEdit(props.id)}
        >
          <img src={EditIcon} alt="Edit" className="w-3 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ContentItem;
export { SortableContentItem };
