import React, { useState } from "react";
import backIcon from "../../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadContent } from "../../../../../services/admin/contentApis";
import { useToast } from "../../../../../contexts/ToastContext";
import RichTextEditor from "../RichTextEditor";

interface AddVideoContentProps {
  onBack: () => void;
  clientId: number;
}

interface VideoContentData {
  title: string;
  marks: number;
  video_url: string;
  description?: string;
}

const AddVideoContent: React.FC<AddVideoContentProps> = ({
  onBack,
  clientId,
}) => {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [video_url, setVideo_url] = useState("");
  const [description, setDescription] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (data: VideoContentData) =>
      uploadContent(clientId, "video-tutorials", data),
    onSuccess: () => {
      success("Video Uploaded", "Video content uploaded successfully!");

      // Invalidate all content-related queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey.includes("submodule-content") ||
            queryKey.includes("submodule") ||
            queryKey.includes("course-modules") ||
            queryKey.includes("video-tutorials")
          );
        },
      });

      onBack();
    },
    onError: (error: Error) => {
      showError(
        "Upload Failed",
        error.message || "Failed to upload video content"
      );
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      showError("Validation Error", "Please enter a title");
      return;
    }

    if (!video_url.trim()) {
      showError("Validation Error", "Please enter video URL");
      return;
    }

    if (!marks.trim()) {
      showError("Validation Error", "Please enter marks");
      return;
    }

    //console.log(title, marks, video_url, description);
    const contentData: VideoContentData = {
      title: title.trim(),
      marks: parseInt(marks, 10),
      video_url: video_url.trim(),
      description: description.trim() || undefined,
    };
    uploadMutation.mutate(contentData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-8 pt-4 h-screen overflow-y-auto">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-sm font-medium mb-6 flex items-center mt-4"
          disabled={uploadMutation.isPending}
        >
          <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
          Back to Content Library
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Add Video Tutorial
          </h2>
          <p className="text-sm text-gray-600">
            Create a new video tutorial with rich description
          </p>
        </div>

        {/* Form Content */}
        <div className="border border-gray-300 rounded-lg p-6 space-y-8 bg-white shadow-sm">
          {/* Title & Marks */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Video Title<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={uploadMutation.isPending}
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Marks<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                placeholder="Enter marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Video URL<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="url"
              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              value={video_url}
              onChange={(e) => setVideo_url(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploadMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: YouTube, Vimeo, or direct video file URLs
            </p>
          </div>

          {/* Description with Rich Text Editor */}
          <div>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter a detailed description of the video content..."
              label="Video Description"
              disabled={uploadMutation.isPending}
            />
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
              <span className="text-2xl font-bold text-[var(--default-primary)]">
                +
              </span>
            </div>
            <p className="text-sm font-medium">Drag or Upload the file</p>
            <p className="text-xs text-gray-400">File Size Limit: 1GB</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onBack}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              disabled={uploadMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={uploadMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-[var(--default-primary)] border border-transparent rounded-lg hover:bg-[#1e4a61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--default-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Video"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVideoContent;
