import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Topic, Subtopic } from "../types/course";
import { AddTopicModal } from "../components/AddTopicModal";
import { AddSubtopicModal } from "../components/AddSubtopicModal";
import { TopicItem } from "../components/TopicItem";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteCourse,
  updateCourse,
  createCourseModule,
  createCourseSubmodule,
  viewCourseDetails,
  deleteCourseModule,
} from "../../../../services/admin/courseApis";
import { useToast } from "../../../../contexts/ToastContext";

interface Module {
  id: number;
  weekno: number;
  title: string;
  completion_percentage: number;
  submodules: Submodule[];
}

interface Submodule {
  id: number;
  title: string;
  description: string;
  order: number;
  video_count: number;
  article_count: number;
  quiz_count: number;
  assignment_count: number;
  coding_problem_count: number;
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<number>(0);
  const [isDeleteTopicModalOpen, setIsDeleteTopicModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string>("");

  // Get course details
  const {
    data: courseDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courseDetails", courseId],
    queryFn: () => viewCourseDetails(clientId, Number(courseId)),
  });

  const [isPublished, setIsPublished] = useState<boolean>(
    courseDetails?.published || false
  );

  useEffect(() => {
    if (courseDetails) {
      setIsPublished(courseDetails.published);
    }
  }, [courseDetails]);

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: () => deleteCourse(clientId, Number(courseId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate("/admin/courses");
    },
    onError: () => {
      //console.error("Failed to delete course:", error);
      // You might want to show an error toast here
    },
  });
  //console.log("isPublished:", isPublished);
  // Update course mutation (for publishing)
  const updateCourseMutation = useMutation({
    mutationFn: (data: { published: boolean }) => {
      // Make sure we have the required fields when updating
      if (!courseDetails?.slug) {
        // If slug is missing, generate one from title
        const slug =
          courseDetails?.title
            ?.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || `course-${courseId}`;
        return updateCourse(clientId, Number(courseId), {
          ...courseDetails,
          slug,
          ...data,
        });
      }

      return updateCourse(clientId, Number(courseId), {
        ...courseDetails,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      //console.log("Course updated successfully", isPublished);
      if (isPublished) {
        success(
          "Course Unpublished",
          "Course has been successfully unpublished."
        );
        setIsPublished(false);
      } else {
        success("Course Published", "Course has been successfully published.");
        setIsPublished(true);
      }
    },
    onError: (error: Error) => {
      //console.error("Failed to update course:", error);
      showError("Update Failed", `Failed to publish course: ${error.message}`);
    },
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: (moduleData: {
      title: string;
      weekno: number;
      description: string;
    }) => {
      return createCourseModule(clientId, Number(courseId), moduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      setIsTopicModalOpen(false);
      success("Topic Created", "New topic has been successfully created.");
    },
    onError: () => {
      //console.error("Failed to create module:", error);
      showError("Creation Failed", "Failed to create topic. Please try again.");
    },
  });

  // Create submodule mutation
  const createSubmoduleMutation = useMutation({
    mutationFn: (submoduleData: {
      title: string;
      description: string;
      order: number;
    }) => {
      return createCourseSubmodule(
        clientId,
        Number(courseId),
        currentModuleId,
        submoduleData
      );
    },
    onSuccess: () => {
      // Invalidate both the course modules and the specific topic's subtopics
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      queryClient.invalidateQueries({
        queryKey: ["course", currentModuleId.toString()],
      });
      setIsSubtopicModalOpen(false);
      success(
        "Subtopic Created",
        "New subtopic has been successfully created."
      );
    },
    onError: () => {
      //console.error("Failed to create submodule:", error);
      showError(
        "Creation Failed",
        "Failed to create subtopic. Please try again."
      );
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: number) =>
      deleteCourseModule(clientId, Number(courseId), moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
      setIsDeleteTopicModalOpen(false);
      success("Topic Deleted", "The topic has been successfully deleted.");
    },
    onError: () => {
      //console.error("Failed to delete module:", error);
      showError("Delete Failed", "Failed to delete topic. Please try again.");
    },
  });

  const handleTopicSubmit = (newTopic: Topic) => {
    try {
      // Transform topic to module format and create it
      const weekno = parseInt(newTopic.week);

      if (isNaN(weekno) || weekno <= 0) {
        showError("Invalid Input", "Week number must be a positive number");
        return;
      }

      const moduleData = {
        title: newTopic.title,
        weekno: weekno,
        description: newTopic.description,
      };

      createModuleMutation.mutate(moduleData);
    } catch {
      //console.error("Error processing topic data:", error);
      showError(
        "Processing Error",
        "Failed to create topic. Please check your input and try again."
      );
    }
  };

  const handleSubtopicSubmit = (newSubtopic: Subtopic) => {
    // Transform subtopic to submodule format and create it
    const submoduleData = {
      title: newSubtopic.title,
      description: newSubtopic.description,
      order: 1, // Default order, could be calculated based on existing submodules
    };

    createSubmoduleMutation.mutate(submoduleData);
  };

  const handleAddSubtopic = (moduleId: string) => {
    setCurrentModuleId(Number(moduleId));
    setIsSubtopicModalOpen(true);
  };

  const handleDeleteCourse = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteCourseMutation.mutate();
    setIsDeleteModalOpen(false);
  };

  const handlePublish = () => {
    updateCourseMutation.mutate({ published: !isPublished });
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopicToDelete(topicId);
    setIsDeleteTopicModalOpen(true);
  };

  const handleConfirmDeleteTopic = () => {
    if (topicToDelete) {
      deleteModuleMutation.mutate(Number(topicToDelete));
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading course details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading course details</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col  gap-4">
          <button
            onClick={() => navigate("/admin/courses")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">
            {courseDetails?.course_title || "Course Details"}
          </h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Course Structure</h2>
            <p className="text-gray-600">
              Manage the modules and content of your course.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteCourse}
              className="flex items-center bg-red-50 text-red-500 px-4 py-2 rounded-md hover:bg-red-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
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
              Delete this Course
            </button>
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="bg-[#17627A] text-white px-4 py-2 rounded-md flex items-center hover:bg-[var(--primary-800)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
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
              Add Topics
            </button>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-[#17627A] hover:bg-[var(--primary-800)] text-white rounded-md transition"
                onClick={handlePublish}
              >
                {courseDetails?.published ? "Published" : "Publish"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {courseDetails?.modules && courseDetails.modules.length > 0 ? (
            courseDetails.modules.map((module: Module) => (
              <TopicItem
                key={module.id}
                courseId={courseId || ""}
                topic={{
                  id: module.id.toString(),
                  title: module.title,
                  week: module.weekno.toString(),
                  description: "",
                  subtopics: module.submodules.map((sub: Submodule) => ({
                    id: sub.id.toString(),
                    title: sub.title,
                    description: sub.description,
                    contents: [],
                    video_count: sub.video_count,
                    article_count: sub.article_count,
                    quiz_count: sub.quiz_count,
                    assignment_count: sub.assignment_count,
                    coding_problem_count: sub.coding_problem_count,
                    order: sub.order,
                  })),
                }}
                onDelete={handleDeleteTopic}
                onAddSubtopic={handleAddSubtopic}
                isLoading={isLoading}
                error={error || null}
              />
            ))
          ) : (
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
              <h4 className="text-[#17627A] font-medium mb-1">
                No Modules Yet
              </h4>
              <p className="text-gray-500 text-sm text-center max-w-md mb-4">
                Add topics to your course to create a structured learning path
                for your students.
              </p>
              <button
                onClick={() => setIsTopicModalOpen(true)}
                className="bg-[#17627A] text-white px-4 py-2 rounded-md flex items-center hover:bg-[var(--primary-800)] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
                Add Topics
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleTopicSubmit}
      />

      <AddSubtopicModal
        isOpen={isSubtopicModalOpen}
        onClose={() => setIsSubtopicModalOpen(false)}
        onSubmit={handleSubtopicSubmit}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
      />

      <DeleteConfirmationModal
        isOpen={isDeleteTopicModalOpen}
        onClose={() => setIsDeleteTopicModalOpen(false)}
        onConfirm={handleConfirmDeleteTopic}
        title="Delete Topic"
        message="Are you sure you want to delete this topic? This will also delete all subtopics and content associated with it. This action cannot be undone."
      />
    </div>
  );
};

export default CourseDetailPage;
