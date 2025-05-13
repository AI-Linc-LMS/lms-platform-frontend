import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface TopicFormData {
  title: string;
  week: string;
  description: string;
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicFormData, setTopicFormData] = useState<TopicFormData>({
    title: '',
    week: '',
    description: ''
  });
  const modalRef = useRef<HTMLDivElement>(null);

  // Mock course data - in a real app, this would be fetched from an API
  const courseMockData = {
    id: courseId || '1',
    title: 'Lorem Ipsum',
    description: 'Here is a glimpse of your overall progress.',
    isPro: true,
    topics: []
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTopicFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding new topic:', topicFormData);
    // Here you would make an API call to add a topic to the course
    
    // Reset form and close modal
    setTopicFormData({ title: '', week: '', description: '' });
    setIsModalOpen(false);
  };

  const handleDeleteCourse = () => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      console.log('Deleting course:', courseId);
      // In a real app, you would make an API call to delete the course
      navigate('/admin/courses'); // Redirect back to courses page
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
            onClick={() => setIsModalOpen(true)}
            className="bg-[#17627A] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#124F65] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Topics
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {courseMockData.topics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {/* Topic list would go here */}
            <p>Topics will be displayed here</p>
          </div>
        ) : (
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
              onClick={() => setIsModalOpen(true)}
              className="bg-[#17627A] text-white px-6 py-2 rounded-md hover:bg-[#124F65] transition-colors"
            >
              Add Topics
            </button>
          </div>
        )}
      </div>

      {/* Add Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg w-full max-w-md shadow-xl border border-blue-200">
            <div className="p-6 pb-3">
              <h2 className="text-2xl font-bold mb-6">Add Topic</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-lg font-medium mb-2">
                    Topic Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={topicFormData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Data Structures"
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-lg font-medium mb-2">
                    Choose Week<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="week"
                      value={topicFormData.week}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md bg-white appearance-none pr-8"
                      required
                    >
                      <option value="">Choose a week</option>
                      <option value="1">Week 1</option>
                      <option value="2">Week 2</option>
                      <option value="3">Week 3</option>
                      <option value="4">Week 4</option>
                      <option value="5">Week 5</option>
                      <option value="6">Week 6</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-lg font-medium mb-2">
                    Enter Description
                  </label>
                  <textarea
                    name="description"
                    value={topicFormData.description}
                    onChange={handleInputChange}
                    placeholder="e.g., Hills"
                    className="w-full p-3 border border-gray-300 rounded-md"
                    rows={4}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#17627A] text-white py-4 rounded-md font-medium hover:bg-[#124F65] transition-colors text-lg"
                >
                  Add Topic
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage; 