import React from "react";

interface VideoPlaceholderProps {
  title: string;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  title,
}) => {
  return (
    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-[var(--font-light)]">
      <div className="text-center p-4">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-lg font-semibold">{title || "Video Unavailable"}</p>
        <p className="text-sm text-gray-400 mt-1">
          The video URL is missing or invalid
        </p>
      </div>
    </div>
  );
};
