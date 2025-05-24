import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseFormData {
  name: string;
  level: string;
  description: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    level: '',
    description: ''
  });
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Mock course data
  const courses = [
    {
      id: '1',
      title: 'Deployment In ML',
      description: 'Lorem ipsum dolor sit amet.',
    },
    {
      id: '2',
      title: 'Deployment In ML',
      description: 'Lorem ipsum dolor sit amet.',
    },
    {
      id: '3',
      title: 'Deployment In ML',
      description: 'Lorem ipsum dolor sit amet.',
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating new course:', formData);
    
    // In a real app, this would be an API call to create the course
    // and then the server would return the new course ID
    
    // For demo purposes, we'll just generate a random ID
    const newCourseId = Math.floor(Math.random() * 1000).toString();
    
    // Reset form and close modal
    setFormData({ name: '', level: '', description: '' });
    setIsModalOpen(false);
    
    // Navigate to the course detail page
    navigate(`/admin/courses/${newCourseId}`);
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/admin/courses/${courseId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your courses and content</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">All Courses</h2>
            <p className="text-gray-600">Here is a glimpse of your overall progress.</p>
          </div>
          <button 
            className="bg-[#17627A] text-white px-4 py-2 rounded-md flex items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="mr-1">+</span> Add New Course
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onEditClick={() => handleEditCourse(course.id)}
            />
          ))}
        </div>
      </div>

      {/* Add New Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center px-6 pt-6 pb-4">
              <h2 className="text-xl font-bold">Add New Course</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Data Structures"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white appearance-none pr-8"
                    required
                  >
                    <option value="">Choose a level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., This course covers..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={4}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#17627A] text-white py-3 rounded-md font-medium hover:bg-[#124F65] transition-colors"
              >
                Create Course
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
  };
  onEditClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEditClick }) => {
  return (
    <div className="bg-white rounded-lg border border-[#80C9E0] overflow-hidden max-w-[500px]">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{course.title}</h3>
          <span className="bg-blue-50 text-blue-800 text-sm px-3 py-1 rounded-full">Pro</span>
        </div>
        <p className="text-gray-600 mb-8">{course.description}</p>

        <div className="grid grid-cols-6 gap-2 mb-8">
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">86</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">86</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">86</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9 1a1 1 0 00-1 1v6a1 1 0 002 0V7a1 1 0 00-1-1zm-5 1a1 1 0 00-1 1v6a1 1 0 002 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">86</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">86</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">86</span>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
        </p>

        <div className="mb-8">
          <div className="text-sm text-gray-600 mb-2">Trusted by:</div>
          <div className="flex space-x-2">
            <img src="https://via.placeholder.com/24" alt="Google" className="w-6 h-6 rounded-full" />
            <img src="https://via.placeholder.com/24" alt="Microsoft" className="w-6 h-6 rounded-full" />
            <img src="https://via.placeholder.com/24" alt="TCS" className="w-6 h-6 rounded-full" />
            <img src="https://via.placeholder.com/24" alt="Wipro" className="w-6 h-6 rounded-full" />
          </div>
        </div>

        <button 
          className="w-full bg-[#D7EFF6] text-[#264D64] border border-[#80C9E0] py-3 rounded-md flex items-center justify-center"
          onClick={onEditClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Course
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard; 