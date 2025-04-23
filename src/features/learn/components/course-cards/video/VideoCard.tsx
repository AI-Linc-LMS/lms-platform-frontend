import React, { useState } from "react";
import VideoPlayer from "../../video-player/VideoPlayer";

interface Props {
  currentWeek: { title: string };
  currentTopic: { title: string };
  sampleVideoUrl: string;
  nextContent: () => void;
  getNextTopicTitle: () => string;
}

const VideoCard: React.FC<Props> = ({
  currentWeek,
  currentTopic,
  sampleVideoUrl,
  nextContent,
  getNextTopicTitle,
}) => {
  const [activeTab, setActiveTab] = useState<"description" | "comments">("description");

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
        videoUrl={sampleVideoUrl}
        title={currentTopic.title}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
        <button className="flex items-center text-red-500 cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Report an issue
        </button>
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
              Are you ready to embark on an exhilarating journey of discovery?
            </h2>
            <p className="mb-4">
              Brace yourself as we delve into the captivating world of Arrays. Prepare to unlock
              the power of organized data, where each element holds a unique story waiting to be
              explored...
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">What is an Array??</h3>
            <p className="mb-4">
              An array is a collection of items of the same data type stored at contiguous memory
              locations...
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
                    <div key={i} className="w-12 h-8 flex items-center justify-center">
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
                  <button className="px-4 py-2 bg-[#255C79] text-white rounded-xl cursor-pointer">Comment</button>
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
      <div className="fixed bottom-6 right-6">
        <button className="bg-[#255C79] text-white px-4 py-2 rounded-full flex items-center shadow-lg cursor-pointer">
          <span className="mr-2">Got a question? Ask AI</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
