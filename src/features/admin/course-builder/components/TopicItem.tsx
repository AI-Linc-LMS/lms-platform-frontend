import React, { useEffect, useState } from "react";
import { Topic, Subtopic, TabKey } from "../types/course";
import SubtopicItem from "./SubtopicItem";
import BottomSheet from "./BottomSheet";
import ContentManager from "./add-content/ContentManager";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  deleteCourseSubmodule,
  getSubmoduleContent,
  deleteSubmoduleContent,
} from "../../../../services/admin/courseApis";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import ContentItem from "./ContentItem";
import { useToast } from "../../../../contexts/ToastContext";
// Import edit components
import EditVideoContent from "./add-content/EditVideoContent";
import EditArticleContent from "./add-content/EditArticleContent";
import EditQuizContent from "./add-content/EditQuizContent";
import EditAssignmentContent from "./add-content/EditAssignmentContent";
import EditCodingProblemContent from "./add-content/EditCodingProblemContent";

interface TopicItemProps {
  courseId: string;
  topic: Topic;
  onDelete: (topicId: string) => void;
  onAddSubtopic: (topicId: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export const TopicItem: React.FC<TopicItemProps> = ({
  courseId,
  topic,
  onDelete,
  onAddSubtopic,
  isLoading = false,
  error = null,
}) => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  // Add state for collapsible functionality
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed for cleaner view

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<number | null>(
    null
  );
  const [isDeleteSubtopicModalOpen, setIsDeleteSubtopicModalOpen] =
    useState(false);
  const [subtopicToDelete, setSubtopicToDelete] = useState<number | null>(null);
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<number | null>(
    null
  );

  // Delete subtopic mutation
  const deleteSubtopicMutation = useMutation({
    mutationFn: (subtopicId: number) =>
      deleteCourseSubmodule(
        clientId,
        Number(courseId),
        Number(topic.id),
        subtopicId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      setIsDeleteSubtopicModalOpen(false);
      success(
        "Subtopic Deleted",
        "The subtopic has been successfully deleted."
      );
    },
    onError: () => {
      //console.error("Failed to delete subtopic:", error);
      showError(
        "Delete Failed",
        "Failed to delete subtopic. Please try again."
      );
    },
  });

  useEffect(() => {
    if (bottomSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [bottomSheetOpen]);

  const handleAddContent = (subtopicId: number) => {
    setSelectedSubtopicId(subtopicId);
    setBottomSheetOpen(true);
    setActiveTab("videos");
  };

  const handleCloseSheet = () => {
    setBottomSheetOpen(false);
    queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
  };

  const handleDeleteSubtopic = (subtopicId: number) => {
    setSubtopicToDelete(subtopicId);
    setIsDeleteSubtopicModalOpen(true);
  };

  const handleConfirmDeleteSubtopic = () => {
    if (subtopicToDelete) {
      deleteSubtopicMutation.mutate(subtopicToDelete);
    }
  };

  const handleSubtopicClick = (subtopicId: number) => {
    setExpandedSubtopicId((prev) => (prev === subtopicId ? null : subtopicId));
  };

  const getStats = (subtopic: Subtopic) => {
    return {
      videos: subtopic.video_count,
      articles: subtopic.article_count,
      problems: subtopic.coding_problem_count,
      quiz: subtopic.quiz_count,
      subjective: subtopic.assignment_count,
      development: 0, // This seems to be a custom stat not in the API
    };
  };

  const renderSubtopics = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-md border border-gray-200 px-4 py-2 mb-2">
                <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">
            Failed to load subtopics. Please try again later.
          </p>
        </div>
      );
    }

    if (!topic.subtopics || topic.subtopics.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-md">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-[#17627A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h4 className="text-[#17627A] font-medium mb-1">Add Subtopics</h4>
          <button
            onClick={() => onAddSubtopic(topic.id)}
            className="bg-[#17627A] text-[var(--font-light)] px-4 py-1 rounded-md mt-2 text-sm hover:bg-[var(--primary-800)] transition-colors"
          >
            Add Subtopics
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {topic.subtopics.map((subtopic) => (
          <div key={subtopic.id}>
            <div
              onClick={() => handleSubtopicClick(Number(subtopic.id))}
              className="cursor-pointer"
            >
              <SubtopicItem
                key={subtopic.id}
                title={subtopic.title}
                marks={0}
                stats={{
                  videos: getStats(subtopic).videos ?? 0,
                  articles: getStats(subtopic).articles ?? 0,
                  problems: getStats(subtopic).problems ?? 0,
                  quiz: getStats(subtopic).quiz ?? 0,
                  subjective: getStats(subtopic).subjective ?? 0,
                  development: getStats(subtopic).development ?? 0,
                }}
                onEdit={() => {}}
                onDelete={() => handleDeleteSubtopic(Number(subtopic.id))}
                onAddContent={() => handleAddContent(Number(subtopic.id))}
              />
            </div>
            <div
              className={`transition-all duration-300 ease-in-out`}
              style={{
                opacity: expandedSubtopicId === Number(subtopic.id) ? 1 : 0,
                pointerEvents:
                  expandedSubtopicId === Number(subtopic.id) ? "auto" : "none",
                display:
                  expandedSubtopicId === Number(subtopic.id) ? "block" : "none",
              }}
            >
              {expandedSubtopicId === Number(subtopic.id) && (
                <SubtopicContentList
                  clientId={clientId}
                  courseId={Number(courseId)}
                  submoduleId={Number(subtopic.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4">
        {/* Collapsible Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-3">
              {/* Collapse/Expand Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label={isExpanded ? "Collapse topic" : "Expand topic"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : "rotate-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <h3 className="text-lg font-semibold">{topic.title}</h3>
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                Week {topic.week}
              </div>
              <button className="text-gray-500">
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-9">
              Marks: - | {topic.subtopics.length} subtopic
              {topic.subtopics.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(topic.id)}
              className="text-red-400 hover:text-red-600 p-2 rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
              onClick={() => onAddSubtopic(topic.id)}
              className="bg-[#17627A] text-[var(--font-light)] px-3 py-1 rounded-md flex items-center hover:bg-[var(--primary-800)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Subtopics
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-9">{renderSubtopics()}</div>
        </div>
      </div>
      {/* Bottom Sheet for Add Content */}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={handleCloseSheet}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        <ContentManager
          tabKey={activeTab as TabKey}
          courseId={Number(courseId)}
          submoduleId={Number(selectedSubtopicId)}
        />
      </BottomSheet>

      {/* Delete Subtopic Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteSubtopicModalOpen}
        onClose={() => setIsDeleteSubtopicModalOpen(false)}
        onConfirm={handleConfirmDeleteSubtopic}
        title="Delete Subtopic"
        message="Are you sure you want to delete this subtopic? This will also delete all content associated with it. This action cannot be undone."
      />
    </div>
  );
};

const SubtopicContentList: React.FC<{
  clientId: number;
  courseId: number;
  submoduleId: number;
}> = ({ clientId, courseId, submoduleId }) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [isDeleteContentModalOpen, setIsDeleteContentModalOpen] =
    useState(false);
  const [contentToDelete, setContentToDelete] = useState<{
    id: number;
    type: string;
  } | null>(null);

  // Add edit state management
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState<{
    id: number;
    type: string;
  } | null>(null);

  interface SubmoduleContentItem {
    id: number;
    title: string;
    marks?: number;
    content_type: string;
  }

  const { data: contents = [], isLoading } = useQuery<SubmoduleContentItem[]>({
    queryKey: ["submodule-content", clientId, courseId, submoduleId],
    queryFn: () => getSubmoduleContent(clientId, courseId, submoduleId),
    enabled: !!submoduleId,
  });

  // Delete content mutation - COMPLETELY REWRITTEN
  const deleteContentMutation = useMutation({
    mutationFn: ({ contentId }: { contentId: number }) => {
      return deleteSubmoduleContent(clientId, courseId, submoduleId, contentId);
    },
    onSuccess: () => {
      //console.log("✅ Content deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: ["submodule-content", clientId, courseId, submoduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      setIsDeleteContentModalOpen(false);
      setContentToDelete(null);
      success("Content Deleted", "The content has been successfully deleted.");
    },
    onError: () => {
      //console.error("❌ Failed to delete content:", error);
      showError("Delete Failed", "Failed to delete content. Please try again.");
    },
  });

  const handleDeleteContent = (contentId: number, contentType: string) => {
    const contentExists = contents.find((c) => c.id === contentId);
    //console.log("Content to delete exists:", contentExists);

    if (!contentExists) {
      showError(
        "Content Not Found",
        `Content with ID ${contentId} not found. Please refresh the page and try again.`
      );
      return;
    }

    setContentToDelete({ id: contentId, type: contentType });
    setIsDeleteContentModalOpen(true);
  };

  const handleConfirmDeleteContent = () => {
    if (contentToDelete) {
      //console.log("=== CONFIRMING DELETE ===");
      //console.log("Deleting content:", contentToDelete);

      deleteContentMutation.mutate({
        contentId: contentToDelete.id,
      });
    }
  };

  // Add edit handlers
  const handleEditContent = (contentId: number, contentType: string) => {
    //console.log("=== EDIT CONTENT DEBUG ===");
    //console.log("Content ID:", contentId);
    //console.log("Content Type:", contentType);
    //console.log("Client ID:", clientId);

    const contentExists = contents.find((c) => c.id === contentId);
    //console.log("Content to edit exists:", contentExists);

    if (!contentExists) {
      showError(
        "Content Not Found",
        `Content with ID ${contentId} not found. Please refresh the page and try again.`
      );
      return;
    }

    //console.log("✅ Content validation passed - opening edit mode");
    setEditingContent({ id: contentId, type: contentType });
    setIsEditing(true);
  };

  const handleEditBack = () => {
    setIsEditing(false);
    setEditingContent(null);
  };

  const handleEditSuccess = () => {
    //console.log("✅ Content updated successfully!");
    queryClient.invalidateQueries({
      queryKey: ["submodule-content", clientId, courseId, submoduleId],
    });
    queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
    setIsEditing(false);
    setEditingContent(null);
  };

  // Render edit component based on content type
  const renderEditComponent = () => {
    if (!editingContent) return null;

    const commonProps = {
      onBack: handleEditBack,
      clientId,
      courseId,
      submoduleId,
      contentId: editingContent.id,
      onSuccess: handleEditSuccess,
    };

    switch (editingContent.type) {
      case "VideoTutorial":
        return <EditVideoContent {...commonProps} />;
      case "Article":
        return <EditArticleContent {...commonProps} />;
      case "Quiz":
        return <EditQuizContent {...commonProps} />;
      case "Assignment":
        return <EditAssignmentContent {...commonProps} />;
      case "CodingProblem":
        return <EditCodingProblemContent {...commonProps} />;
      default:
        //console.error("Unknown content type for editing:", editingContent.type);
        showError(
          "Edit Error",
          `Cannot edit content of type: ${editingContent.type}`
        );
        setIsEditing(false);
        setEditingContent(null);
        return null;
    }
  };

  //console.log("contents", contents);

  // If editing, show the edit component
  if (isEditing) {
    return (
      <div className="w-full min-h-screen bg-gray-50 p-4">
        {renderEditComponent()}
      </div>
    );
  }

  if (isLoading) return <div className="pl-8">Loading...</div>;
  if (!contents || contents.length === 0) return <div></div>;

  return (
    <>
      <div className="pl-8">
        {contents.map((item) => (
          <ContentItem
            key={item.id}
            id={item.id}
            title={item.title}
            marks={item.marks}
            contentType={item.content_type}
            onEdit={(id) => handleEditContent(id, item.content_type)}
            onDelete={(id) => handleDeleteContent(id, item.content_type)}
          />
        ))}
      </div>

      {/* Delete Content Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteContentModalOpen}
        onClose={() => {
          setIsDeleteContentModalOpen(false);
          setContentToDelete(null);
        }}
        onConfirm={handleConfirmDeleteContent}
        title="Delete Content"
        message={`Are you sure you want to delete this ${
          contentToDelete?.type === "VideoTutorial"
            ? "video tutorial"
            : contentToDelete?.type.toLowerCase()
        }? This action cannot be undone.`}
        isLoading={deleteContentMutation.isPending}
      />
    </>
  );
};
