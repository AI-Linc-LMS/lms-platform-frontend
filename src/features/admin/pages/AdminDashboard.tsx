import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, createCourse, CourseData } from '../../../services/admin/courseApis';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import articleIcon from '../../../commonComponents/icons/admin/content/ArticleIcon.png';
import videoIcon from '../../../commonComponents/icons/admin/content/VideosIcon.png';
import quizIcon from '../../../commonComponents/icons/admin/content/QuizIcon.png';
import assignmentIcon from '../../../commonComponents/icons/admin/content/SubjectiveIcon.png';
import codingProblemIcon from '../../../commonComponents/icons/admin/content/ProblemIcon.png';
import { useToast } from '../../../contexts/ToastContext';

interface Course {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty_level: string;
  language: string;
  price: string;
  is_free: boolean;
  published: boolean;
  enrolled_students: {
    total: number;
    students_profile_pic: string[];
  };
  stats: {
    video: { total: number };
    article: { total: number };
    quiz: { total: number };
    assignment: { total: number };
    coding_problem: { total: number };
  };
  trusted_by: string[];
  thumbnail: string | null;
}

interface CourseFormData {
  name: string;
  level: string;
  description: string;
}

const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-[#80C9E0] overflow-hidden max-w-[500px] animate-pulse">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>

        <div className="grid grid-cols-6 gap-2 mb-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg p-2 flex flex-col items-center justify-center">
              <div className="h-5 w-5 bg-gray-300 rounded-full mb-1"></div>
              <div className="h-4 bg-gray-300 rounded w-8"></div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="flex space-x-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-6 w-6 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>

        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    level: '',
    description: ''
  });
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses(clientId)
  });

  // Log difficulty levels of existing courses to discover valid values
  useEffect(() => {
    if (coursesData && coursesData.length > 0) {
      console.log('Analyzing existing courses for valid difficulty levels...');
      const difficultyLevels = coursesData.map((course: Course) => course.difficulty_level);
      const uniqueDifficultyLevels = [...new Set(difficultyLevels)];
      console.log('Found difficulty levels:', uniqueDifficultyLevels);

      // If there are valid difficulty levels, automatically update the dropdown options
      if (uniqueDifficultyLevels.length > 0) {
        console.log('Found valid difficulty levels in existing courses:', uniqueDifficultyLevels);
      }
    }
  }, [coursesData]);

  const createCourseMutation = useMutation({
    mutationFn: (courseData: CourseData) => createCourse(clientId, courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', clientId] });
      setIsModalOpen(false);
      success('Course Created', 'New course has been successfully created.');
    },
    onError: (error: Error) => {
      console.error('Failed to create course:', error);

      // Log the complete error object for debugging
      console.log('Complete error object:', JSON.stringify(error, null, 2));

      // Extract error details if available
      let errorMessage = error.message;

      // Try to parse and format the error message for better readability
      try {
        if (error.message.includes('{')) {
          const errorJson = JSON.parse(error.message.substring(error.message.indexOf('{')));
          console.log('Parsed error JSON:', errorJson);

          // Special handling for difficulty_level errors
          if (errorJson.difficulty_level) {
            console.log('Difficulty level error details:', errorJson.difficulty_level);

            // Check if the error message contains hints about valid choices
            const errorText = errorJson.difficulty_level[0];
            if (typeof errorText === 'string') {
              console.log('Error text:', errorText);

              // Try different regex patterns to extract choices
              let validChoices = null;

              // Pattern 1: "X is not a valid choice. Valid choices are: [a, b, c]"
              const pattern1 = /valid choice[s]?[.\s]*[^[]*\[(.*?)\]/i;
              const match1 = errorText.match(pattern1);
              if (match1 && match1[1]) {
                validChoices = match1[1].split(',').map(c => c.trim());
                console.log('Extracted choices (pattern 1):', validChoices);
              }

              // Pattern 2: Look for quoted values in the error message
              const pattern2 = /"([^"]+)"/g;
              const matches2 = [...errorText.matchAll(pattern2)];
              if (matches2.length > 1) { // First match is usually the invalid choice
                validChoices = matches2.map(m => m[1]);
                console.log('Extracted choices (pattern 2):', validChoices);
              }

              if (validChoices) {
                console.log('*** IMPORTANT: Valid choices for difficulty_level appear to be:', validChoices);
                console.log('Please update your form to use these values.');
              }
            }
          }

          const formattedError = Object.entries(errorJson)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join('\n');
          errorMessage = formattedError;
        }
      } catch (e) {
        // If parsing fails, use the original error message
        console.log('Error parsing error message:', e);
      }

      showError('Course Creation Failed', errorMessage);
    }
  });

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if a course with this title might already exist
    if (coursesData) {
      const similarTitles = coursesData.filter((course: Course) =>
        course.title.toLowerCase() === formData.name.toLowerCase()
      );

      if (similarTitles.length > 0) {
        if (!confirm(`A course with a similar title already exists. Create anyway?`)) {
          return;
        }
      }
    }

    createCourseMutation.mutate({
      title: formData.name,
      description: formData.description,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      ...(formData.level && { difficulty_level: formData.level })
    });

    // Reset form and close modal
    setFormData({ name: '', level: '', description: '' });
    setIsModalOpen(false);
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/admin/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className='text-red-600 text-xl mb-4'>Some Error Occured !!</p>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          {coursesData?.map((course: Course) => (
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
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
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
  course: Course;
  onEditClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEditClick }) => {
  return (
    <div className="bg-white rounded-lg border border-[#80C9E0] overflow-hidden max-w-[500px] flex flex-col h-full">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{course.title}</h3>
          <span className={`${course.is_free ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'} text-sm px-3 py-1 rounded-full`}>
            {course.is_free ? 'Free' : 'Pro'}
          </span>
        </div>
        <p className="text-gray-600 mb-8">{course.description || 'No description available'}</p>

        <div className="grid grid-cols-6 gap-2 mb-8">
          <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative group transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{course.enrolled_students?.total || 0}</span>
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
              Students
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
            </div>
          </div>
          <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative group transition-all duration-200">
            <img src={articleIcon} alt="Article" className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-sm font-medium">{course.stats?.article?.total || 0}</span>
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
              Articles
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
            </div>
          </div>
          <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative group transition-all duration-200">
            <img src={quizIcon} alt="Quiz" className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-sm font-medium">{course.stats?.quiz?.total || 0}</span>
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
              Quizzes
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
            </div>
          </div>
          <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative group transition-all duration-200">
            <img src={assignmentIcon} alt="Assignment" className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-sm font-medium">{course.stats?.assignment?.total || 0}</span>
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
              Assignments
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
            </div>
          </div>
          <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative group transition-all duration-200">
            <img src={codingProblemIcon} alt="Coding Problem" className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-sm font-medium">{course.stats?.coding_problem?.total || 0}</span>
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
              Coding Problems
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
            </div>
          </div>
          <div className="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 flex flex-col items-center justify-center relative group transition-all duration-200">
            <img src={videoIcon} alt="Video" className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-sm font-medium">{course.stats?.video?.total || 0}</span>
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-[#343A40] text-white text-xs rounded pointer-events-none transition-opacity duration-200">
              Videos
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#343A40]"></div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-sm text-gray-600 mb-2">Trusted by:</div>
          <div className="flex space-x-2">
            {course.trusted_by && course.trusted_by.length > 0 ? (
              course.trusted_by.map((company, index) => (
                <img
                  key={index}
                  src={company}
                  alt={`Company ${index + 1}`}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/24';
                  }}
                />
              ))
            ) : (
              <span className="text-gray-500 text-sm">No companies listed</span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button
            className="w-full bg-[#D7EFF6] text-[#264D64] border border-[#80C9E0] py-3 rounded-md flex items-center justify-center hover:bg-[#C4E5F0] transition-colors"
            onClick={onEditClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 