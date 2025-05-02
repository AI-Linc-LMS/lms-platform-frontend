import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddTopicModal from '../components/modals/AddTopicModal';

interface TopicProps {
  id: string;
  title: string;
  description: string;
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goBack = () => {
    navigate('/admin/course-builder');
  };

  const deleteCourse = () => {
    // Implement delete course functionality
    console.log('Deleting course:', courseId);
    navigate('/admin/course-builder');
  };

  const addTopic = () => {
    setIsModalOpen(true);
  };

  const handleSaveTopic = (topicData: { title: string; description: string }) => {
    const newTopic: TopicProps = {
      id: `topic-${Date.now()}`, // Generate a unique ID
      ...topicData,
    };
    setTopics([...topics, newTopic]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Back Navigation */}
        <div className="flex items-center mb-8">
          <button 
            onClick={goBack} 
            className="flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 px-4 py-2 text-gray-700 mr-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Courses
          </button>
          
          <div className="h-0.5 bg-gray-200 flex-grow"></div>
        </div>

        {/* Header with Title and Pro Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold mr-3">Lorem Ipsum</h1>
            <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-md">Pro</span>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={deleteCourse}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
            >
              Delete this Course
            </button>
            <button 
              onClick={addTopic}
              className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 flex items-center"
            >
              <span className="mr-2">+</span>
              Add Topics
            </button>
          </div>
        </div>

        {/* Subheader with Description */}
        <p className="text-gray-600 mb-10">
          Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Ut Et Massa MI.
        </p>

        {/* Main Content Area - Add Topics */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
          {topics.length === 0 ? (
            <>
              <div className="mb-6 text-center">
                <div className="flex justify-center mb-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Add Topics</h2>
                <p className="text-gray-500">
                  Start building your course by adding topics
                </p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={goBack}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button 
                  onClick={addTopic}
                  className="bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-900"
                >
                  Add Topics
                </button>
              </div>
            </>
          ) : (
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-6">Course Topics</h2>
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div 
                    key={topic.id} 
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <h3 className="text-xl font-semibold mb-2">{topic.title}</h3>
                    <p className="text-gray-600">{topic.description}</p>
                  </div>
                ))}
                <button 
                  onClick={addTopic}
                  className="w-full p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center"
                >
                  <span className="mr-2">+</span>
                  Add Another Topic
                </button>
              </div>
              
              <div className="mt-8 flex justify-between">
                <button 
                  onClick={goBack}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Courses
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Topic Modal */}
      <AddTopicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTopic}
      />
    </div>
  );
};

export default CourseDetail; 