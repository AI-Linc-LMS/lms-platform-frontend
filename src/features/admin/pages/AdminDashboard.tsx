import React, { useState, useRef, useEffect } from 'react';

interface CourseFormData {
  name: string;
  level: string;
  description: string;
}

const AdminDashboard: React.FC = () => {
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
    // Here you would typically make an API call to create the course
    
    // Reset form and close modal
    setFormData({ name: '', level: '', description: '' });
    setIsModalOpen(false);
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
            <CourseCard key={course.id} course={course} />
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
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4">
        <div className="bg-blue-50 p-2 rounded-md mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{course.title}</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">Pro</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{course.description}</p>
        </div>

        <div className="grid grid-cols-6 gap-2 mb-4">
          <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center">
            <span className="text-sm">86</span>
          </div>
          <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center">
            <span className="text-sm">86</span>
          </div>
          <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center">
            <span className="text-sm">86</span>
          </div>
          <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center">
            <span className="text-sm">86</span>
          </div>
          <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center">
            <span className="text-sm">86</span>
          </div>
          <div className="bg-gray-100 rounded-md p-2 flex items-center justify-center">
            <span className="text-sm">86</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna.
        </p>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Trusted by:</div>
          <div className="flex space-x-1">
            <div className="w-6 h-6 rounded-full bg-red-400"></div>
            <div className="w-6 h-6 rounded-full bg-blue-400"></div>
            <div className="w-6 h-6 rounded-full bg-yellow-400"></div>
            <div className="w-6 h-6 rounded-full bg-gray-400"></div>
          </div>
        </div>

        <button 
          className="w-full bg-blue-50 text-blue-700 py-2 rounded-md flex items-center justify-center"
          onClick={() => console.log('Edit course', course.id)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Course
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard; 