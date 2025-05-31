import React, { useState } from "react";
import backIcon from "../../../../commonComponents/icons/admin/content/backIcon.png";
import { useMutation } from "@tanstack/react-query";
import { uploadContent } from "../../../../services/admin/contentApis";
import { useToast } from "../../../../contexts/ToastContext";

interface AddVideoContentProps {
  onBack: () => void;
  clientId: number;
}

interface VideoContentData {
  title: string;
  marks: number;
  video_url: string;
}

const AddVideoContent: React.FC<AddVideoContentProps> = ({
  onBack,
  clientId,
}) => {
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState("");
  const [marks, setMarks] = useState("");
  const [video_url, setVideo_url] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (data: VideoContentData) =>
      uploadContent(clientId, "video-tutorials", data),
    onSuccess: () => {
      success("Video Uploaded", "Video content uploaded successfully!");
      onBack();
    },
    onError: (error: Error) => {
      showError("Upload Failed", error.message || "Failed to upload video content");
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
    console.log(title, marks, video_url);
    const contentData: VideoContentData = {
      title: title.trim(),
      marks: parseInt(marks, 10),
      video_url: video_url.trim(),
    };
    uploadMutation.mutate(contentData);
  };

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm font-medium mb-4 flex items-center"
      >
        <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
        Back to Content Library
      </button>

      {/* Title & Marks */}
      <div className="border border-gray-300 rounded-lg p-2 px-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">
              Video Title
            </label>
            <input
              type="text"
              placeholder="Enter title here"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium text-gray-700">Marks</label>
            <input
              type="number"
              placeholder="Enter Marks"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Video video_url */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Paste the video_url to the Video
          </label>
          <input
            type="text"
            placeholder="Enter video_url here"
            value={video_url}
            onChange={(e) => setVideo_url(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
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
          <div className="bg-blue-100 w-12 h-12 rounded-full mb-2">
            <span className="text-4xl font-bold text-[#255C79]">+</span>
          </div>
          <p className="text-sm font-medium">Drag or Upload the file</p>
          <p className="text-xs text-gray-400">File Size Limit: 1GB</p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            className="px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
            onClick={handleSave}
          >
            Save Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVideoContent;
