import React, { useState, useRef, useEffect } from "react";
import VideoIcon from "../../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import ArticleIcon from "../../../../../assets/course_sidebar_assets/article/articleIcon.png";
import ProblemIcon from "../../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import QuizIcon from "../../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import AssignmentIcon from "../../../../../assets/course_sidebar_assets/subjective/subjectiveicon.png";
import DevelopmentIcon from "../../../../../assets/course_sidebar_assets/development/developmenticon.png";
import { TabKey } from "../../types/course";
import { getContent } from "../../../../../services/admin/contentApis";
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
  const { label, icon } = metaData[tabKey];
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Filter content items based on search query
  const filteredItems = contentItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.difficulty_level.toLowerCase().includes(query)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleItemSelect = (item: ContentItem) => {
    setSelectedItem(item);
    setSelectedContent(String(item.id));
    setSearchQuery(item.title);
    setIsDropdownOpen(false);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const clearSelection = () => {
    setSelectedItem(null);
    setSelectedContent("");
    setSearchQuery("");
    setIsDropdownOpen(false);
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
    //console.log("selected", selected);
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
        {/* Searchable Dropdown and Save Button */}
        <div className="flex flex-col md:flex-row border border-gray-300 rounded-lg p-4 items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-3/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choose {label}
            </label>

            {/* Custom Searchable Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    isLoading
                      ? "Loading..."
                      : error
                      ? "Error loading content"
                      : `Search ${label.toLowerCase()}s...`
                  }
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleInputFocus}
                  disabled={isLoading}
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79] transition-colors"
                />

                {/* Search Icon */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {selectedItem ? (
                    <button
                      onClick={clearSelection}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear selection"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  ) : (
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && !isLoading && !error && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {searchQuery
                        ? `No ${label.toLowerCase()}s found for "${searchQuery}"`
                        : `No ${label.toLowerCase()}s available`}
                    </div>
                  ) : (
                    <>
                      {/* Search Results Info */}
                      {searchQuery && (
                        <div className="px-3 py-2 text-xs text-blue-600 bg-blue-50 border-b border-gray-200">
                          Found {filteredItems.length} {label.toLowerCase()}
                          {filteredItems.length !== 1 ? "s" : ""}
                          {filteredItems.length !== contentItems.length && (
                            <> out of {contentItems.length} total</>
                          )}
                        </div>
                      )}

                      {/* Content Items */}
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleItemSelect(item)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">
                              {item.title}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {item.difficulty_level}
                            </span>
                          </div>
                          {item.content && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {item.content.length > 100
                                ? `${item.content.substring(0, 100)}...`
                                : item.content}
                            </div>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Selected Item Display */}
            {selectedItem && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium">
                    Selected: {selectedItem.title}
                  </span>
                  <span className="text-green-600 text-xs">
                    ({selectedItem.difficulty_level})
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-1 text-sm text-red-600">
                Failed to load content. Please try again.
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            className="h-10 px-4 mt-2 md:mt-6 bg-[#255C79] text-white rounded-xl transition hover:bg-[#1e4a63] disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="mt-4 px-6 py-2 bg-[#255C79] text-white rounded-xl transition hover:bg-[#1e4a63]"
          >
            Add New {label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContent;
