import React, { useState } from "react";
import VideoIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import ArticleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import ProblemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import QuizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import AssignmentIcon from "../../../../assets/course_sidebar_assets/subjective/subjectiveicon.png";
import DevelopmentIcon from "../../../../assets/course_sidebar_assets/development/developmenticon.png";
import { TabKey } from "../../types/course";
import { getContent } from "../../../../services/admin/contentApis";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ContentItem {
  id: number;
  title: string;
  content: string;
  difficulty_level: string;
  client: number;
}

interface AddContentProps {
  tabKey: TabKey;
  onSave?: () => void;
  onAddNew: (tabKey: TabKey) => void;
  clientId: number;
  onContentSelect: (content: ContentItem) => void;
}

// Map TabKey to contentType
const mapTabKeyToContentType = (
  tabKey: TabKey
):
  | "articles"
  | "video-tutorials"
  | "quizzes"
  | "assignments"
  | "coding-problems"
  | "development" => {
  switch (tabKey) {
    case "articles":
      return "articles";
    case "videos":
      return "video-tutorials";
    case "quizzes":
      return "quizzes";
    case "subjective":
      return "assignments";
    case "problems":
      return "coding-problems";
    case "development":
      return "development";
    default:
      return "articles"; // fallback
  }
};

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
  quizzes: {
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
  onAddNew,
  clientId,
  onContentSelect,
}) => {
  const { label, placeholder, icon } = metaData[tabKey];
  const [selectedContent, setSelectedContent] = useState<string>("");
  const queryClient = useQueryClient();

  const contentType = mapTabKeyToContentType(tabKey);

  const {
    data: contentItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[]>({
    queryKey: ["content", clientId, contentType],
    queryFn: () => getContent(clientId, contentType),
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContent(e.target.value);
  };

  const handleAddNew = async () => {
    // First invalidate the query
    await queryClient.invalidateQueries({
      queryKey: ["content", clientId, contentType],
      refetchType: "all",
    });
    // Then force a refetch
    await refetch();
    // Finally call onAddNew
    onAddNew(tabKey);
  };

  const handleSave = async () => {
    // Ensure type match: item.id may be number, selectedContent is string
    const selected = contentItems.find(
      (item) => String(item.id) === String(selectedContent)
    );
    console.log("selected", selected);
    if (selected) {
      // First set the content
      onContentSelect(selected);

      // Finally refresh content
      await queryClient.invalidateQueries({
        queryKey: ["content", clientId, contentType],
        refetchType: "all",
      });
      await refetch();
    }
  };

  return (
    <div className="w-full h-[380px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 rounded-lg space-y-6">
        {/* Dropdown and Save Button */}
        <div className="flex flex-col md:flex-row border border-gray-300 rounded-lg p-4 items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-3/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choose {label}
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
              value={selectedContent}
              onChange={handleContentChange}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading
                  ? "Loading..."
                  : error
                  ? "Error loading content"
                  : placeholder}
              </option>
              {contentItems.map((item: ContentItem) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.difficulty_level})
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-sm text-red-600">
                Failed to load content. Please try again.
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            className="h-10 px-4 mt-2 md:mt-6 bg-[#255C79] text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedContent || isLoading}
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
            onClick={handleAddNew}
            className="mt-4 px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
          >
            Add New {label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContent;
