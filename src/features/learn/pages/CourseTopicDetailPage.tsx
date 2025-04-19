import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import { mockCourseContent } from "../data/mockCourseContent";
import VideoPlayer from "../components/video-player/VideoPlayer";
import BackToPreviousPage from "../../../commonComponents/common-buttons/back-buttons/back-to-previous-page/BackToPreviousPage";

const CourseTopicDetailPage: React.FC = () => {
  const { weekId, topicId } = useParams<{ weekId: string; topicId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"description" | "comments">("description");
  const [currentContentIndex, setCurrentContentIndex] = useState(0);

  // Find the current week and topic from mock data
  const currentWeek = mockCourseContent.find((week) => week.id === weekId);
  const currentTopic = currentWeek?.modules.find((module) => module.id === topicId);

  // If topic not found, redirect to courses page
  if (!currentWeek || !currentTopic) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl mb-4">Topic not found</p>
        <button
          className="px-4 py-2 bg-[#255C79] text-white rounded-xl"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    );
  }

  // Handle navigation to next content item
  const nextContent = () => {
    if (currentContentIndex < currentTopic.content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else if (currentWeek.modules.length > 1) {
      // Move to next topic if available
      const currentTopicIndex = currentWeek.modules.findIndex(m => m.id === topicId);
      if (currentTopicIndex < currentWeek.modules.length - 1) {
        const nextTopic = currentWeek.modules[currentTopicIndex + 1];
        navigate(`/learn/course/${weekId}/${nextTopic.id}`);
      }
    }
  };

  // Find the next topic to show in the Next button
  const getNextTopicTitle = () => {
    const currentTopicIndex = currentWeek.modules.findIndex(m => m.id === topicId);
    if (currentTopicIndex < currentWeek.modules.length - 1) {
      return currentWeek.modules[currentTopicIndex + 1].title;
    }
    return "Next Topic";
  };

  // Sample video URL - in a real app, this would come from your API
  const sampleVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  return (
    <div className="container mx-auto px-4 py-8">

      <BackToPreviousPage />


      {/* Week and Topic Navigation */}
      <div className="bg-gray-100 p-4 rounded-t-2xl mt-4">
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
          className="px-4 py-2 bg-[#255C79] text-white rounded-xl flex items-center"
        >
          Next: {getNextTopicTitle()}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 ml-2">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Likes and Report */}
      <div className="flex justify-between items-center my-4">
        <div className="flex items-center space-x-2">
          <button className="flex items-center text-blue-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.2699 16.265L20.9754 12.1852C21.1516 11.1662 20.368 10.2342 19.335 10.2342H14.1539C13.6404 10.2342 13.2494 9.77328 13.3325 9.26598L13.9952 5.22142C14.1028 4.56435 14.0721 3.892 13.9049 3.24752C13.7664 2.71364 13.3545 2.28495 12.8128 2.11093L12.6678 2.06435C12.3404 1.95918 11.9831 1.98365 11.6744 2.13239C11.3347 2.29611 11.0861 2.59473 10.994 2.94989L10.5183 4.78374C10.3669 5.36723 10.1465 5.93045 9.86218 6.46262C9.44683 7.24017 8.80465 7.86246 8.13711 8.43769L6.69838 9.67749C6.29272 10.0271 6.07968 10.5506 6.12584 11.0844L6.93801 20.4771C7.0125 21.3386 7.7328 22 8.59658 22H13.2452C16.7265 22 19.6975 19.5744 20.2699 16.265Z" fill="#255C79" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M2.96767 9.48508C3.36893 9.46777 3.71261 9.76963 3.74721 10.1698L4.71881 21.4063C4.78122 22.1281 4.21268 22.7502 3.48671 22.7502C2.80289 22.7502 2.25 22.1954 2.25 21.5129V10.2344C2.25 9.83275 2.5664 9.5024 2.96767 9.48508Z" fill="#255C79" />
            </svg>

            368
          </button>
          <button className="flex items-center text-gray-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.2699 16.265L20.9754 12.1852C21.1516 11.1662 20.368 10.2342 19.335 10.2342H14.1539C13.6404 10.2342 13.2494 9.77328 13.3325 9.26598L13.9952 5.22142C14.1028 4.56435 14.0721 3.892 13.9049 3.24752C13.7664 2.71364 13.3545 2.28495 12.8128 2.11093L12.6678 2.06435C12.3404 1.95918 11.9831 1.98365 11.6744 2.13239C11.3347 2.29611 11.0861 2.59473 10.994 2.94989L10.5183 4.78374C10.3669 5.36723 10.1465 5.93045 9.86218 6.46262C9.44683 7.24017 8.80465 7.86246 8.13711 8.43769L6.69838 9.67749C6.29272 10.0271 6.07968 10.5506 6.12584 11.0844L6.93801 20.4771C7.0125 21.3386 7.7328 22 8.59658 22H13.2452C16.7265 22 19.6975 19.5744 20.2699 16.265Z" fill="#255C79" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M2.96767 9.48508C3.36893 9.46777 3.71261 9.76963 3.74721 10.1698L4.71881 21.4063C4.78122 22.1281 4.21268 22.7502 3.48671 22.7502C2.80289 22.7502 2.25 22.1954 2.25 21.5129V10.2344C2.25 9.83275 2.5664 9.5024 2.96767 9.48508Z" fill="#255C79" />
            </svg>

          </button>
        </div>
        <button className="flex items-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Report an issue
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("description")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "description"
                ? "border-[#255C79] text-[#255C79]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "comments"
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
            <h2 className="text-xl font-bold mb-4">Are you ready to embark on an exhilarating journey of discovery?</h2>
            <p className="mb-4">
              Brace yourself as we delve into the captivating world of Arrays. Prepare to unlock the power of organized data,
              where each element holds a unique story waiting to be explored. Embrace the thrill of manipulating, sorting, and
              transforming arrays, and witness the magic as your code springs to life!!!
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">What is an Array??</h3>
            <p className="mb-4">
              An array is a collection of items of the same data type stored at contiguous memory locations. This makes it
              easier to calculate the position of each element by simply adding an offset to a base value, i.e., the memory
              location of the first element of the array (generally denoted by the name of the array).
            </p>

            <div className="border rounded-lg p-4 my-6">
              <h4 className="font-bold mb-2">Array Elements</h4>
              <div className="flex justify-center">
                <div className="flex">
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300">2</div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300">4</div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300">10</div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300">5</div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300">5</div>
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center border border-gray-300">3</div>
                </div>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex">
                  <div className="w-12 h-8 flex items-center justify-center">1</div>
                  <div className="w-12 h-8 flex items-center justify-center">2</div>
                  <div className="w-12 h-8 flex items-center justify-center">3</div>
                  <div className="w-12 h-8 flex items-center justify-center">4</div>
                  <div className="w-12 h-8 flex items-center justify-center">5</div>
                  <div className="w-12 h-8 flex items-center justify-center">6</div>
                </div>
              </div>
              <div className="text-center mt-2">Array Indexes</div>
            </div>

            <h3 className="text-lg font-bold mt-6 mb-2">This video will enlighten you with the following concepts:</h3>
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
              <p className="text-sm text-gray-500">Share your thoughts about this lesson with other students</p>
            </div>

            {/* Comment Input */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <img src="/placeholder-avatar.jpg" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#255C79]"
                  placeholder="Add a comment..."
                  rows={3}
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button className="px-4 py-2 bg-[#255C79] text-white rounded-xl">
                    Comment
                  </button>
                </div>
              </div>
            </div>

            {/* No comments message */}
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          </div>
        )}
      </div>

      {/* Got a question? Ask AI */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-[#255C79] text-white px-4 py-2 rounded-full flex items-center shadow-lg">
          <span className="mr-2">Got a question? Ask AI</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CourseTopicDetailPage; 