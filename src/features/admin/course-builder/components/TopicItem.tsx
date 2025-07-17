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
  reorderSubmoduleContent,
  updateSubmoduleContent,
  updateCourseModule,
} from "../../../../services/admin/courseApis";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { SortableContentItem } from "./ContentItem";
import { useToast } from "../../../../contexts/ToastContext";
// Import edit components
import EditVideoContent from "./add-content/EditVideoContent";
import EditArticleContent from "./add-content/EditArticleContent";
import EditQuizContent from "./add-content/EditQuizContent";
import EditAssignmentContent from "./add-content/EditAssignmentContent";
import EditCodingProblemContent from "./add-content/EditCodingProblemContent";
// Import drag and drop components
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

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
  
  // Add edit topic state
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopicTitle, setEditedTopicTitle] = useState(topic.title);
  const [editedTopicWeek, setEditedTopicWeek] = useState(Number(topic.week));

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

  // Define an interface for the course details
  interface CourseModule {
    id: number;
    title: string;
    weekno: number;
    submodules?: {
      id: number;
      title: string;
      description?: string;
      order?: number;
    }[];
    description?: string;
    completion_percentage?: number;
  }

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: () => updateCourseModule(
      clientId, 
      Number(courseId), 
      Number(topic.id), 
      { 
        title: editedTopicTitle, 
        weekno: editedTopicWeek,
        description: topic.description || '' // Add optional description
      }
    ),
    onSuccess: (updatedTopic) => {
      console.log("Topic update response:", updatedTopic);
      
      // Invalidate multiple query keys
      queryClient.invalidateQueries({ 
        queryKey: ["courseDetails", courseId],
        exact: false  // This will invalidate all queries that start with this key
      });
      
      // Manually update the cache if possible
      queryClient.setQueryData(
        ["courseDetails", courseId], 
        (oldData: CourseModule[] | undefined) => {
          if (!oldData) return oldData;
          
          // Deep clone the old data to avoid direct mutation
          const newData = JSON.parse(JSON.stringify(oldData));
          
          // Find and update the specific topic
          const topicIndex = newData.findIndex((m: CourseModule) => m.id === Number(topic.id));
          if (topicIndex !== -1) {
            newData[topicIndex] = {
              ...newData[topicIndex],
              title: editedTopicTitle,
              weekno: editedTopicWeek
            };
          }
          
          return newData;
        }
      );
      
      // Force a refetch to ensure data consistency
      queryClient.refetchQueries({ 
        queryKey: ["courseDetails", courseId],
        exact: false 
      });

      success("Topic Updated", "The topic has been successfully updated.");
      setIsEditingTopic(false);
    },
    onError: (error: Error) => {
      console.error("Failed to update topic:", error);
      showError("Update Failed", "Failed to update topic. Please try again.");
    }
  });

  const handleSaveTopic = () => {
    // Validate inputs
    if (!editedTopicTitle.trim()) {
      showError("Validation Error", "Topic title cannot be empty.");
      return;
    }

    if (editedTopicWeek <= 0) {
      showError("Validation Error", "Week number must be a positive number.");
      return;
    }

    updateTopicMutation.mutate();
  };

  const handleCancelEdit = () => {
    setIsEditingTopic(false);
    // Reset to original values
    setEditedTopicTitle(topic.title);
    setEditedTopicWeek(Number(topic.week));
  };

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
    onError: (error: Error) => {
      console.error("Failed to delete subtopic:", error);
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
            className="bg-[#17627A] text-white px-4 py-1 rounded-md mt-2 text-sm hover:bg-[#124F65] transition-colors"
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
              
              {isEditingTopic ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={editedTopicTitle}
                    onChange={(e) => setEditedTopicTitle(e.target.value)}
                    className="border rounded px-2 py-1 text-lg font-semibold w-64"
                    placeholder="Topic Title"
                  />
                  <input 
                    type="number" 
                    value={editedTopicWeek}
                    onChange={(e) => {
                      const weekValue = Number(e.target.value);
                      setEditedTopicWeek(isNaN(weekValue) ? 1 : weekValue);
                    }}
                    className="border rounded px-2 py-1 w-20 text-center"
                    placeholder="Week"
                    min="1"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveTopic}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      disabled={updateTopicMutation.isPending}
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                      disabled={updateTopicMutation.isPending}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{topic.title}</h3>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                    Week {topic.week}
                  </div>
                  {!isEditingTopic && (
                    <button 
                      onClick={() => setIsEditingTopic(true)} 
                      className="text-gray-500"
                    >
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
                  )}
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-9">
              Marks: - | {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 ? 's' : ''}
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
              className="bg-[#17627A] text-white px-3 py-1 rounded-md flex items-center hover:bg-[#124F65] transition-colors"
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
          <div className="ml-9">
            {renderSubtopics()}
          </div>
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

  // Add drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  interface SubmoduleContentItem {
    id: number;
    title: string;
    marks?: number;
    content_type: string;
    order: number;
  }

  const { data: contents = [], isLoading } = useQuery<SubmoduleContentItem[]>({
    queryKey: ["submodule-content", clientId, courseId, submoduleId],
    queryFn: () => getSubmoduleContent(clientId, courseId, submoduleId),
    enabled: !!submoduleId,
  });

  // Sort contents by order
  const sortedContents = [...contents].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Reorder content mutation
  const reorderContentMutation = useMutation({
    mutationFn: async (newOrder: SubmoduleContentItem[]) => {
      // Try using the bulk reorder endpoint first
      try {
        const reorderData = {
          contents: newOrder.map((item, index) => ({
            id: item.id,
            order: index + 1,
          })),
        };
        return await reorderSubmoduleContent(clientId, courseId, submoduleId, reorderData);
      } catch {
        // If bulk reorder fails, fall back to individual updates
        console.log("Bulk reorder failed, falling back to individual updates");
        const updatePromises = newOrder.map(async (item, index) => {
          const newOrderValue = index + 1;
          // Use a basic content update that only updates the order
          return await updateSubmoduleContent(clientId, courseId, submoduleId, item.id, {
            title: item.title,
            marks: item.marks || 0,
            order: newOrderValue,
          } as any);
        });
        return await Promise.all(updatePromises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["submodule-content", clientId, courseId, submoduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      success("Content Reordered", "Content has been successfully reordered.");
    },
    onError: (error: Error) => {
      console.error("Failed to reorder content:", error);
      showError("Reorder Failed", "Failed to reorder content. Please try again.");
    },
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedContents.findIndex((item) => item.id.toString() === active.id);
      const newIndex = sortedContents.findIndex((item) => item.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedContents, oldIndex, newIndex);
        // Optimistically update the UI
        queryClient.setQueryData(
          ["submodule-content", clientId, courseId, submoduleId],
          newOrder
        );
        // Persist the change
        reorderContentMutation.mutate(newOrder);
      }
    }
  };

  // Add detailed logging when contents change
  useEffect(() => {
    if (contents && contents.length > 0) {
      console.log("=== SUBMODULE CONTENT LOADED ===");
      console.log("Client ID:", clientId);
      console.log("Course ID:", courseId);
      console.log("Submodule ID:", submoduleId);
      console.log("Total contents:", contents.length);
      console.log("Content details:");
      contents.forEach((content, index) => {
        console.log(
          `  ${index + 1}. ID: ${content.id}, Type: ${
            content.content_type
          }, Title: ${content.title}`
        );
      });
      console.log(
        "Available Video Tutorial IDs:",
        contents
          .filter((c) => c.content_type === "VideoTutorial")
          .map((c) => c.id)
      );
      console.log(
        "Available Article IDs:",
        contents.filter((c) => c.content_type === "Article").map((c) => c.id)
      );
      console.log("=== END CONTENT LIST ===");
    } else if (!isLoading) {
      console.log("=== NO CONTENT FOUND ===");
      console.log("Client ID:", clientId);
      console.log("Course ID:", courseId);
      console.log("Submodule ID:", submoduleId);
      console.log("Contents array:", contents);
    }
  }, [contents, isLoading, clientId, courseId, submoduleId]);

  // Delete content mutation - COMPLETELY REWRITTEN
  const deleteContentMutation = useMutation({
    mutationFn: ({ contentId }: { contentId: number }) => {
      console.log("=== USING CORRECT DELETE API ===");
      console.log("Deleting submodule content with ID:", contentId);
      console.log(
        "API URL:",
        `/admin-dashboard/api/clients/${clientId}/courses/${courseId}/submodules/${submoduleId}/contents/${contentId}/`
      );

      return deleteSubmoduleContent(clientId, courseId, submoduleId, contentId);
    },
    onSuccess: () => {
      console.log("✅ Content deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: ["submodule-content", clientId, courseId, submoduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      setIsDeleteContentModalOpen(false);
      setContentToDelete(null);
      success("Content Deleted", "The content has been successfully deleted.");
    },
    onError: (error: Error) => {
      console.error("❌ Failed to delete content:", error);
      showError("Delete Failed", "Failed to delete content. Please try again.");
    },
  });

  const handleDeleteContent = (contentId: number, contentType: string) => {
    console.log("=== DELETE CONTENT DEBUG ===");
    console.log("Content ID:", contentId);
    console.log("Content Type:", contentType);
    console.log("Client ID:", clientId);
    console.log("Available contents:", contents);

    const contentExists = contents.find((c) => c.id === contentId);
    console.log("Content to delete exists:", contentExists);

    if (!contentExists) {
      console.error("❌ CONTENT NOT FOUND!");
      console.error(
        `Content with ID ${contentId} does not exist in the current submodule.`
      );
      console.error(
        "Available content IDs:",
        contents.map((c) => c.id)
      );
      showError(
        "Content Not Found",
        `Content with ID ${contentId} not found. Please refresh the page and try again.`
      );
      return;
    }

    console.log(
      "✅ Content validation passed - using correct submodule content API"
    );
    setContentToDelete({ id: contentId, type: contentType });
    setIsDeleteContentModalOpen(true);
  };

  const handleConfirmDeleteContent = () => {
    if (contentToDelete) {
      console.log("=== CONFIRMING DELETE ===");
      console.log("Deleting content:", contentToDelete);

      deleteContentMutation.mutate({
        contentId: contentToDelete.id,
      });
    }
  };

  // Add edit handlers
  const handleEditContent = (contentId: number, contentType: string) => {
    console.log("=== EDIT CONTENT DEBUG ===");
    console.log("Content ID:", contentId);
    console.log("Content Type:", contentType);
    console.log("Client ID:", clientId);

    const contentExists = contents.find((c) => c.id === contentId);
    console.log("Content to edit exists:", contentExists);

    if (!contentExists) {
      console.error("❌ CONTENT NOT FOUND!");
      console.error(
        `Content with ID ${contentId} does not exist in the current submodule.`
      );
      console.error(
        "Available content IDs:",
        contents.map((c) => c.id)
      );
      showError(
        "Content Not Found",
        `Content with ID ${contentId} not found. Please refresh the page and try again.`
      );
      return;
    }

    console.log("✅ Content validation passed - opening edit mode");
    setEditingContent({ id: contentId, type: contentType });
    setIsEditing(true);
  };

  const handleEditBack = () => {
    setIsEditing(false);
    setEditingContent(null);
  };

  const handleEditSuccess = () => {
    console.log("✅ Content updated successfully!");
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
        console.error("Unknown content type for editing:", editingContent.type);
        showError(
          "Edit Error",
          `Cannot edit content of type: ${editingContent.type}`
        );
        setIsEditing(false);
        setEditingContent(null);
        return null;
    }
  };

  console.log("contents", contents);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={sortedContents.map((item) => item.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {sortedContents.map((item) => (
              <SortableContentItem
                key={item.id}
                id={item.id}
                title={item.title}
                marks={item.marks}
                contentType={item.content_type}
                onEdit={(id) => handleEditContent(id, item.content_type)}
                onDelete={(id) => handleDeleteContent(id, item.content_type)}
                isDraggable={true}
              />
            ))}
          </SortableContext>
        </DndContext>
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
