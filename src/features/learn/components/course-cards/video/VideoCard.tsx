import React, { useState } from "react";
import VideoPlayer from "../../video-player/VideoPlayer";
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";
import { useQuery } from "@tanstack/react-query";
import { getCourseContent } from "../../../../../services/courses-content/courseContentApis";

interface VideoCardProps {
  currentWeek: { title: string };
  currentTopic: { title: string };
  contentId: number;
  courseId: number;
  nextContent: () => void;
  getNextTopicTitle: () => string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  currentWeek,
  currentTopic,
  contentId,
  courseId,
  nextContent,
  getNextTopicTitle,
}) => {
  const [activeTab, setActiveTab] = useState<"description" | "comments">(
    "description"
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['video', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/6 mb-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading video. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 p-4">
        No video data available.
      </div>
    );
  }

  console.log('Video Data:', data);

  return (
    <div className="flex-1">
      {/* Week and Topic Navigation */}
      <div className="bg-gray-100 p-4 rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">{currentWeek.title}</span>
          <span className="text-gray-500">›</span>
          <span className="font-medium">{currentTopic.title}</span>
        </div>
      </div>

      {/* Video Player Section */}
      <VideoPlayer
        videoUrl={data.video_url}
        title={data.title}
        onComplete={nextContent}
      />

      {/* Next Button */}
      <div className="bg-gray-100 p-4 flex justify-end">
        <button
          onClick={nextContent}
          className="px-4 py-2 bg-[#255C79] text-white rounded-xl flex items-center cursor-pointer"
        >
          Next: {getNextTopicTitle()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-4 h-4 ml-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Likes and Report */}
      <div className="flex justify-between items-center my-4">
        <div className="flex items-center space-x-2">
          <button className="flex items-center text-blue-500 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            368
          </button>
          <button className="flex items-center text-gray-500 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
          </button>
        </div>
        <div>
          <button className="flex flex-row gap-3 cursor-pointer">
            <svg
              width="22"
              height="21"
              viewBox="0 0 22 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 5.75C11.4142 5.75 11.75 6.08579 11.75 6.5V11.5C11.75 11.9142 11.4142 12.25 11 12.25C10.5858 12.25 10.25 11.9142 10.25 11.5V6.5C10.25 6.08579 10.5858 5.75 11 5.75Z"
                fill="#AE0606"
              />
              <path
                d="M11 15.5C11.5523 15.5 12 15.0523 12 14.5C12 13.9477 11.5523 13.5 11 13.5C10.4477 13.5 9.99998 13.9477 9.99998 14.5C9.99998 15.0523 10.4477 15.5 11 15.5Z"
                fill="#AE0606"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M7.2944 2.97643C8.36631 1.61493 9.50182 0.75 11 0.75C12.4981 0.75 13.6336 1.61493 14.7056 2.97643C15.7598 4.31544 16.8769 6.29622 18.3063 8.83053L18.7418 9.60267C19.9234 11.6976 20.8566 13.3523 21.3468 14.6804C21.8478 16.0376 21.9668 17.2699 21.209 18.3569C20.4736 19.4118 19.2466 19.8434 17.6991 20.0471C16.1576 20.25 14.0845 20.25 11.4248 20.25H10.5752C7.91552 20.25 5.84239 20.25 4.30082 20.0471C2.75331 19.8434 1.52637 19.4118 0.790989 18.3569C0.0331793 17.2699 0.152183 16.0376 0.653135 14.6804C1.14334 13.3523 2.07658 11.6977 3.25818 9.6027L3.69361 8.83067C5.123 6.29629 6.24019 4.31547 7.2944 2.97643ZM8.47297 3.90432C7.49896 5.14148 6.43704 7.01988 4.96495 9.62994L4.60129 10.2747C3.37507 12.4488 2.50368 13.9986 2.06034 15.1998C1.6227 16.3855 1.68338 17.0141 2.02148 17.4991C2.38202 18.0163 3.05873 18.3706 4.49659 18.5599C5.92858 18.7484 7.9026 18.75 10.6363 18.75H11.3636C14.0974 18.75 16.0714 18.7484 17.5034 18.5599C18.9412 18.3706 19.6179 18.0163 19.9785 17.4991C20.3166 17.0141 20.3773 16.3855 19.9396 15.1998C19.4963 13.9986 18.6249 12.4488 17.3987 10.2747L17.035 9.62993C15.5629 7.01987 14.501 5.14148 13.527 3.90431C12.562 2.67865 11.8126 2.25 11 2.25C10.1874 2.25 9.43793 2.67865 8.47297 3.90432Z"
                fill="#AE0606"
              />
            </svg>
            <p className="text-[#AE0606] font-medium text-[14px] ">
              Report an issue
            </p>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("description")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "description"
                ? "border-[#255C79] text-[#255C79]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "comments"
                ? "border-[#255C79] text-[#255C79]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Comments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "description" && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              {data.title}
            </h2>
            <p className="mb-4">
              {data.description}
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">What is an Array??</h3>
            <p className="mb-4">
              An array is a collection of items of the same data type stored at
              contiguous memory locations...
            </p>

            <div className="border rounded-lg p-4 my-6">
              <h4 className="font-bold mb-2">Array Elements</h4>
              <div className="flex justify-center">
                <div className="flex">
                  {[2, 4, 10, 5, 5, 3].map((num, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5, 6].map((index, i) => (
                    <div
                      key={i}
                      className="w-12 h-8 flex items-center justify-center"
                    >
                      {index}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-2">Array Indexes</div>
            </div>

            <h3 className="text-lg font-bold mt-6 mb-2">
              This video will enlighten you with the following concepts:
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Introduction to the World of Arrays</li>
              <li>What is an Array?</li>
              <li>Use of an Array</li>
              <li>Memory Allocation in Arrays</li>
              <li>Advantages of using Array</li>
              <li>Random Access</li>
              <li>Cache Friendliness</li>
              <li>Declaration and Initialization of an Array</li>
              <li>In C++</li>
              <li>In Java</li>
            </ul>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-bold mb-2">Course Comments</h3>
              <p className="text-sm text-gray-500">
                Share your thoughts about this lesson with other students
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <img
                  src="/placeholder-avatar.jpg"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#255C79]"
                  placeholder="Add a comment..."
                  rows={3}
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button className="px-4 py-2 bg-[#255C79] text-white rounded-xl cursor-pointer">
                    Comment
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          </div>
        )}
      </div>

      {/* Floating Ask AI Button */}
      <FloatingAIButton
        onClick={() => console.log("Floating AI Button clicked")}
      />
    </div>
  );
};

export default VideoCard;
