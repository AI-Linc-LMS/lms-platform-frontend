import React, { useState, useEffect } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  updateSubmoduleContent,
  getSubmoduleContentById,
  VideoContentUpdateData,
} from "../../../../../services/admin/courseApis";
import { getContentById } from "../../../../../services/admin/contentApis";
import { useToast } from "../../../../../contexts/ToastContext";
import RichTextEditor from "../RichTextEditor";

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
  const [description, setDescription] = useState("");

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

  // Fallback query to get video content directly if description is missing
  const { data: directVideoData, isLoading: isLoadingDirectVideo } = useQuery({
    queryKey: ["video-content-direct", clientId, contentId],
    queryFn: () => {
      console.log("=== FETCHING DIRECT VIDEO DATA ===");
      return getContentById(clientId, "video-tutorials", contentId);
    },
    enabled: !!videoData && !videoData.description && !videoData.details?.description,
  });

  // Populate form with existing data
  useEffect(() => {
    // Use direct video data if available and has description, otherwise use submodule data
    const dataToUse = (directVideoData && directVideoData.description) ? directVideoData : videoData;
    
    if (dataToUse) {
      console.log("=== LOADED VIDEO DATA FOR EDITING ===");
      console.log("Using data source:", directVideoData && directVideoData.description ? "Direct API" : "Submodule API");
      console.log("Full video data:", JSON.stringify(dataToUse, null, 2));

      // Try multiple possible data structures
      let contentDetails = dataToUse;
      
      // Check if data is nested under 'details'
      if (dataToUse.details) {
        contentDetails = dataToUse.details;
        console.log("Using nested details:", JSON.stringify(contentDetails, null, 2));
      }

      // Extract values with fallbacks
      const titleValue = 
        contentDetails.title || 
        dataToUse.title || 
        contentDetails.content_title ||
        dataToUse.content_title || 
        "";

      const marksValue = 
        contentDetails.marks?.toString() || 
        dataToUse.marks?.toString() || 
        contentDetails.total_marks?.toString() ||
        dataToUse.total_marks?.toString() ||
        "";

      const videoUrlValue = 
        contentDetails.video_url || 
        dataToUse.video_url || 
        contentDetails.url ||
        dataToUse.url ||
        "";
      
      // Try multiple possible locations for description
      const descriptionValue = 
        contentDetails.description || 
        dataToUse.description || 
        contentDetails.content || 
        dataToUse.content || 
        contentDetails.video_description ||
        dataToUse.video_description ||
        contentDetails.details?.description ||
        "";

      console.log("=== EXTRACTED VALUES ===");
      console.log("Title:", titleValue);
      console.log("Marks:", marksValue);
      console.log("Video URL:", videoUrlValue);
      console.log("Description:", descriptionValue ? `Found (${descriptionValue.length} chars)` : "Not found");
      
      if (descriptionValue) {
        console.log("Description preview:", descriptionValue.substring(0, 200) + "...");
      }

      // Set form values
      setTitle(titleValue);
      setMarks(marksValue);
      setVideoUrl(videoUrlValue);
      setDescription(descriptionValue);

      console.log("=== FORM STATE UPDATED ===");
      console.log("Form populated successfully");
    }
  }, [videoData, directVideoData]);

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
      description: description.trim() || undefined,
    };

    console.log("=== SAVING VIDEO WITH DATA ===");
    console.log("Content data to save:", contentData);

    updateMutation.mutate(contentData);
  };

  if (isLoadingVideo || isLoadingDirectVideo) {
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
          Update the video tutorial information and description
        </p>
      </div>

      {/* Form Content */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-6">
        {/* Video Details */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Video Title<span className="text-red-500">*</span>
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
            <label className="text-sm font-medium text-gray-700">
              Marks<span className="text-red-500">*</span>
            </label>
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
            Video URL<span className="text-red-500">*</span>
          </label>
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

        {/* Description with Rich Text Editor */}
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Enter a detailed description of the video content..."
          label="Video Description"
          disabled={updateMutation.isPending}
        />

        {/* Debug Section - Remove this in production */}
        {/* {import.meta.env.DEV && (
          <div className="bg-gray-100 p-4 rounded-lg border">
            <h4 className="font-medium text-sm mb-2">Debug Information:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Description Length:</strong> {description.length} characters</p>
              <p><strong>Has Description:</strong> {description ? 'Yes' : 'No'}</p>
              <p><strong>Video Data Source:</strong> {directVideoData && directVideoData.description ? 'Direct API' : 'Submodule API'}</p>
              <p><strong>Raw Description Preview:</strong> {description.substring(0, 100)}...</p>
            </div>
          </div>
        )} */}

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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
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
