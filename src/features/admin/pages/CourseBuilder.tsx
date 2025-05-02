import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  isPro?: boolean;
}

// Course card component
const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, isPro = false }) => {
  const navigate = useNavigate();

  const handleEditCourse = () => {
    navigate(`/admin/course-builder/edit/${id}`);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 flex flex-col h-full">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 flex-grow">{description}</p>
      <div className="mt-auto">
        <div className="mb-4">
          <span className="bg-gray-200 text-gray-800 text-sm font-medium px-4 py-1 rounded-md">
            {isPro ? "Pro" : "Free"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="bg-gray-200 p-2 rounded-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6V18M16 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="ml-1 text-sm">86</span>
            </div>
          ))}
        </div>
        <button 
          className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-md"
          onClick={handleEditCourse}
        >
          Edit Course
        </button>
      </div>
    </div>
  );
};

interface Course {
  id: number;
  title: string;
  description: string;
  isPro: boolean;
}

const CourseBuilder: React.FC = () => {
  const [courses] = useState<Course[]>([
    {
      id: 1,
      title: 'Lorem Ipsum',
      description: 'Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Ut Et Massa Mi.',
      isPro: true
    },
    {
      id: 2,
      title: 'Lorem Ipsum',
      description: 'Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Ut Et Massa Mi.',
      isPro: true
    },
    {
      id: 3,
      title: 'Lorem Ipsum',
      description: 'Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit. Ut Et Massa Mi.',
      isPro: true
    }
  ]);

  const navigate = useNavigate();

  const addNewCourse = () => {
    // Functionality to add a new course
    console.log('Add new course');
    // Navigate to the course detail page with a temporary ID
    // In a real app, you would create the course first and then navigate with the new ID
    navigate('/admin/course-builder/detail/new');
  };

  const goToHomePage = () => {
    navigate('/');
  };

  return (
    <div className="px-4 py-6">
      {/* Back Button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={goToHomePage} 
          className="flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 px-4 py-2 text-gray-700"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Courses</h1>
        <button 
          onClick={addNewCourse}
          className="bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-md flex items-center"
        >
          <span className="mr-2">+</span>
          Add New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <CourseCard 
            key={course.id}
            id={course.id}
            title={course.title}
            description={course.description}
            isPro={course.isPro}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseBuilder; 