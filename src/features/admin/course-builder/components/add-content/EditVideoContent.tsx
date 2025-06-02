import React, { useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  updateSubmoduleContent,
  getSubmoduleContentById,
  VideoContentUpdateData,
} from "../../../../../services/admin/courseApis";
import { useToast } from "../../../../../contexts/ToastContext";

interface EditVideoContentProps {
  onBack: () => void;
  clientId: number;
  courseId: number;
  submoduleId: number;
  contentId: number;
  onSuccess?: () => void;
}

const EditVideoContent: React.FC<EditVideoContentProps> = ({
  onBack,
  clientId,
  courseId,
  submoduleId,
  contentId,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Fetch existing video data
  const { data: videoData, isLoading: isLoadingVideo } = useQuery({
    queryKey: [
      "submodule-content-detail",
      clientId,
      courseId,
      submoduleId,
      contentId,
    ],
    queryFn: () => {
      console.log("=== FETCHING VIDEO DATA FOR EDIT ===");
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
    if (videoData) {
      console.log("=== LOADED VIDEO DATA FOR EDITING ===");
      console.log("Video data:", videoData);

      const contentDetails = videoData.details || videoData;

      setTitle(contentDetails.title || videoData.title || "");
      setMarks(
        contentDetails.marks?.toString() || videoData.marks?.toString() || ""
      );
      setVideoUrl(contentDetails.video_url || videoData.video_url || "");

      console.log("Form populated with:", {
        title: contentDetails.title || videoData.title,
        marks: contentDetails.marks || videoData.marks,
        video_url: contentDetails.video_url || videoData.video_url,
      });
    }
  }, [videoData]);

  const updateMutation = useMutation({
    mutationFn: (data: VideoContentUpdateData) => {
      console.log("=== UPDATING VIDEO ===");
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
      console.log("✅ Video updated successfully!");
      success("Video Updated", "Video content updated successfully!");
      if (onSuccess) {
        onSuccess();
      }
      onBack();
    },
    onError: (error: Error) => {
      console.error("❌ Failed to update video:", error);
      showError(
        "Update Failed",
        error.message || "Failed to update video content"
      );
    },
  });

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      showError("Validation Error", "Please enter a video title");
      return;
    }

    if (!marks.trim()) {
      showError("Validation Error", "Please enter marks for the video");
      return;
    }

    if (!videoUrl.trim()) {
      showError("Validation Error", "Please enter a video URL");
      return;
    }

    const marksNumber = parseInt(marks);
    if (isNaN(marksNumber) || marksNumber < 0) {
      showError("Validation Error", "Please enter a valid marks value");
      return;
    }

    // Validate URL format (basic validation)
    try {
      new URL(videoUrl);
    } catch {
      showError("Validation Error", "Please enter a valid video URL");
      return;
    }

    const contentData: VideoContentUpdateData = {
      title: title.trim(),
      marks: marksNumber,
      video_url: videoUrl.trim(),
    };

    updateMutation.mutate(contentData);
  };

  if (isLoadingVideo) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#255C79]"></div>
          <span className="ml-2 text-gray-600">Loading video data...</span>
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
        <h2 className="text-xl font-semibold text-gray-800">
          Edit Video Tutorial
        </h2>
        <p className="text-sm text-gray-600">
          Update the video tutorial information
        </p>
      </div>

      {/* Video Details */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Video Title
            </label>
            <input
              type="text"
              placeholder="Enter video title"
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
          <label className="text-sm font-medium text-gray-700">Video URL</label>
          <input
            type="url"
            placeholder="Enter video URL (YouTube, Vimeo, etc.)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            disabled={updateMutation.isPending}
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: YouTube, Vimeo, or direct video file URLs
          </p>
        </div>

        {/* OR Divider */}
        <div className="flex items-center justify-center gap-2">
          <hr className="w-full border-dashed border-gray-300" />
          <span className="text-gray-500 text-sm">OR</span>
          <hr className="w-full border-dashed border-gray-300" />
        </div>

        {/* Upload Box */}
        <div className="border border-gray-300 rounded-lg flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-blue-100 w-12 h-12 rounded-full mb-2 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#255C79]">+</span>
          </div>
          <p className="text-sm font-medium">Drag or Upload the file</p>
          <p className="text-xs text-gray-400">File Size Limit: 1GB</p>
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
              "Update Video"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVideoContent;
