import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Topic, Subtopic, Course } from '../types/course';
import { AddTopicModal } from '../components/AddTopicModal';
import { AddSubtopicModal } from '../components/AddSubtopicModal';
import { TopicItem } from '../components/TopicItem';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([
    {
      id: '1',
      title: 'Lorem Ipsum Topic 1',
      week: '1',
      description: 'Description for topic 1',
      subtopics: []
    },
    {
      id: '2',
      title: 'Lorem Ipsum Topic 1',
      week: '1',
      description: 'Description for topic 2',
      subtopics: []
    }
  ]);

  // Mock course data - in a real app, this would be fetched from an API
  const courseMockData: Course = {
    id: courseId || '1',
    title: 'Lorem Ipsum',
    description: 'Here is a glimpse of your overall progress.',
    isPro: true
  };

  const handleTopicSubmit = (newTopic: Topic) => {
    setTopics(prev => [...prev, newTopic]);
    setIsTopicModalOpen(false);
  };

  const handleSubtopicSubmit = (newSubtopic: Subtopic) => {
    setTopics(prev => 
      prev.map(topic => 
        topic.id === currentTopicId 
          ? { ...topic, subtopics: [...topic.subtopics, newSubtopic] }
          : topic
      )
    );
    setIsSubtopicModalOpen(false);
  };

  const openSubtopicModal = (topicId: string) => {
    setCurrentTopicId(topicId);
    setIsSubtopicModalOpen(true);
  };

  const handleDeleteCourse = () => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      console.log('Deleting course:', courseId);
      // In a real app, you would make an API call to delete the course
      navigate('/admin/courses'); // Redirect back to courses page
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      setTopics(prev => prev.filter(topic => topic.id !== topicId));
    }
  };

  const handleGoBack = () => {
    navigate('/admin/courses');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <button 
          onClick={handleGoBack} 
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{courseMockData.title}</h1>
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">Pro</div>
            <button className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-1">{courseMockData.description}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDeleteCourse}
            className="flex items-center bg-red-50 text-red-500 px-4 py-2 rounded-md hover:bg-red-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete this Course
          </button>
          <button 
            onClick={() => setIsTopicModalOpen(true)}
            className="bg-[#17627A] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#124F65] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Topics
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {topics.length > 0 ? (
          topics.map(topic => (
            <TopicItem
              key={topic.id}
              topic={topic}
              onDelete={handleDeleteTopic}
              onAddSubtopic={openSubtopicModal}
            />
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#17627A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg text-[#17627A] font-medium mb-1">Add Topics</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Start adding topics to your course to organize your content
              </p>
              <button 
                onClick={() => setIsTopicModalOpen(true)}
                className="bg-[#17627A] text-white px-6 py-2 rounded-md hover:bg-[#124F65] transition-colors"
              >
                Add Topics
              </button>
            </div>
          </div>
        )}
      </div>

      <AddTopicModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        onSubmit={handleTopicSubmit}
      />

      <AddSubtopicModal
        isOpen={isSubtopicModalOpen}
        onClose={() => setIsSubtopicModalOpen(false)}
        onSubmit={handleSubtopicSubmit}
      />
    </div>
  );
};

export default CourseDetailPage; 