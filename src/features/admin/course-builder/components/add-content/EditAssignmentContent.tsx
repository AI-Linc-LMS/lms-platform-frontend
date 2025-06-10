import React, { useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateSubmoduleContent,
  getSubmoduleContentById,
  AssignmentContentUpdateData,
} from "../../../../../services/admin/courseApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface EditAssignmentContentProps {
  onBack: () => void;
  clientId: number;
  courseId: number;
  submoduleId: number;
  contentId: number;
  onSuccess?: () => void;
}

const EditAssignmentContent: React.FC<EditAssignmentContentProps> = ({
  onBack,
  clientId,
  courseId,
  submoduleId,
  contentId,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Fetch existing assignment data
  const { data: assignmentData, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [
      "submodule-content-detail",
      clientId,
      courseId,
      submoduleId,
      contentId,
    ],
    queryFn: () => {
      console.log("=== FETCHING ASSIGNMENT DATA FOR EDIT ===");
      console.log("Client ID:", clientId);
      console.log("Course ID:", courseId);
      console.log("Submodule ID:", submoduleId);
      console.log("Content ID:", contentId);

      return getSubmoduleContentById(
        clientId,
        courseId,
        submoduleId,
        contentId
      );
    },
    enabled: !!contentId && !!courseId && !!submoduleId,
  });

  // Populate form with existing data
  useEffect(() => {
    if (assignmentData) {
      console.log("=== LOADED ASSIGNMENT DATA FOR EDITING ===");
      console.log("Assignment data:", assignmentData);

      const contentDetails = assignmentData.details || assignmentData;

      setTitle(contentDetails.title || assignmentData.title || "");
      setMarks(
        contentDetails.marks?.toString() ||
          assignmentData.marks?.toString() ||
          ""
      );
      setDescription(
        contentDetails.description || assignmentData.description || ""
      );
      setDueDate(contentDetails.due_date || assignmentData.due_date || "");

      console.log("Form populated with:", {
        title: contentDetails.title || assignmentData.title,
        marks: contentDetails.marks || assignmentData.marks,
        description: contentDetails.description || assignmentData.description,
        due_date: contentDetails.due_date || assignmentData.due_date,
      });
    }
  }, [assignmentData]);

  const updateMutation = useMutation({
    mutationFn: (data: AssignmentContentUpdateData) => {
      console.log("=== UPDATING ASSIGNMENT ===");
      console.log("Client ID:", clientId);
      console.log("Course ID:", courseId);
      console.log("Submodule ID:", submoduleId);
      console.log("Content ID:", contentId);
      console.log("Update data:", data);

      return updateSubmoduleContent(
        clientId,
        courseId,
        submoduleId,
        contentId,
        data
      );
    },
    onSuccess: () => {
      console.log("✅ Assignment updated successfully!");
      success("Assignment Updated", "Assignment content updated successfully!");
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("assignments") ||
            (queryKey.includes("submodule-content-detail") && 
             queryKey.includes(clientId) && 
             queryKey.includes(courseId) && 
             queryKey.includes(submoduleId))
          );
        },
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onBack();
    },
    onError: (error: Error) => {
      console.error("❌ Failed to update assignment:", error);
      showError(
        "Update Failed",
        error.message || "Failed to update assignment content"
      );
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
      return;
    }

    if (!description.trim()) {
      showError("Validation Error", "Please enter description");
      return;
    }

    if (!marks.trim()) {
      showError("Validation Error", "Please enter marks");
      return;
    }

    const marksNumber = parseInt(marks, 10);
    if (isNaN(marksNumber) || marksNumber < 0) {
      showError("Validation Error", "Please enter a valid marks value");
      return;
    }

    console.log("=== SAVING ASSIGNMENT UPDATE ===");
    console.log("Form data:", {
      title: title.trim(),
      marks: marksNumber,
      description: description.trim(),
      due_date: dueDate,
    });

    const contentData: AssignmentContentUpdateData = {
      title: title.trim(),
      marks: marksNumber,
      description: description.trim(),
      due_date: dueDate || undefined,
    };

    updateMutation.mutate(contentData);
  };

  if (isLoadingAssignment) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#255C79]"></div>
          <span className="ml-2 text-gray-600">Loading assignment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm font-medium mb-4 flex items-center"
        disabled={updateMutation.isPending}
      >
        <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
        Back to Content Library
      </button>

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Edit Assignment</h2>
        <p className="text-sm text-gray-600">
          Update the assignment information
        </p>
      </div>

      {/* Assignment Details */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Assignment Title
            </label>
            <input
              type="text"
              placeholder="Enter assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium text-gray-700">Marks</label>
            <input
              type="number"
              placeholder="Enter marks"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              disabled={updateMutation.isPending}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Due Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            disabled={updateMutation.isPending}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            placeholder="Enter assignment description and requirements"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            rows={8}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Action Buttons - Fixed positioning and styling */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-[#255C79] border border-transparent rounded-lg hover:bg-[#1e4a61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255C79] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              "Update Assignment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAssignmentContent;
