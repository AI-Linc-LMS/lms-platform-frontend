import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCourses,
  createCourse,
  CourseData,
} from "../../../../services/admin/courseApis";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../contexts/ToastContext";
import AccessDenied from "../../../../components/AccessDenied";
import { useRole } from "../../../../hooks/useRole";
import AdminCourseCard from "../components/AdminCourseCard";

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
  rating?: number; // Course rating 0-5
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
  // Additional frontend fields
  tags?: string[];
  learning_objectives?: string;
  requirements?: string;
  whats_included?: string[];
  features?: string[];
  certificate_available?: boolean;
  duration_in_hours?: number;
  liked_by?: unknown[];
  liked_count?: number;
  is_liked_by_current_user?: boolean;
}

interface CourseFormData {
  name: string;
  level: string;
  description: string;
}

const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-[var(--primary-200)] overflow-hidden max-w-[500px] animate-pulse">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>

        <div className="grid grid-cols-6 gap-2 mb-8">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 rounded-lg p-2 flex flex-col items-center justify-center"
            >
              <div className="h-5 w-5 bg-gray-300 rounded-full mb-1"></div>
              <div className="h-4 bg-gray-300 rounded w-8"></div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="flex space-x-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-6 w-6 bg-gray-200 rounded-full"
              ></div>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CourseFormData>({
    name: "",
    level: "",
    description: "",
  });
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    data: coursesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(clientId),
  });

  // Filter courses based on search query
  const filteredCourses =
    coursesData?.filter((course: Course) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.difficulty_level.toLowerCase().includes(query) ||
        course.subtitle?.toLowerCase().includes(query)
      );
    }) || [];

  const createCourseMutation = useMutation({
    mutationFn: (courseData: CourseData) => createCourse(clientId, courseData),
    onSuccess: () => {
      // Invalidate and refetch the courses data
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      // Also refetch immediately to ensure the UI updates
      queryClient.refetchQueries({ queryKey: ["courses"] });
      setIsModalOpen(false);
      success("Course Created", "New course has been successfully created.");
    },
    onError: (error: Error) => {
      //console.error("Failed to create course:", error);

      // Log the complete error object for debugging
      //console.log("Complete error object:", JSON.stringify(error, null, 2));

      // Extract error details if available
      let errorMessage = error.message;

      // Try to parse and format the error message for better readability
      try {
        if (error.message.includes("{")) {
          const errorJson = JSON.parse(
            error.message.substring(error.message.indexOf("{"))
          );
          const formattedError = Object.entries(errorJson)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join("\n");
          errorMessage = formattedError;
        }
      } catch {
        //console.log("Error parsing error message:", e);
      }

      showError("Course Creation Failed", errorMessage);
    },
  });

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if a course with this title might already exist
    if (coursesData) {
      const similarTitles = coursesData.filter(
        (course: Course) =>
          course.title.toLowerCase() === formData.name.toLowerCase()
      );

      if (similarTitles.length > 0) {
        if (
          !confirm(
            `A course with a similar title already exists. Create anyway?`
          )
        ) {
          return;
        }
      }
    }

    createCourseMutation.mutate({
      title: formData.name,
      description: formData.description,
      slug: formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
      ...(formData.level && { difficulty_level: formData.level }),
    });

    // Reset form and close modal
    setFormData({ name: "", level: "", description: "" });
    setIsModalOpen(false);
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/admin/courses/${courseId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };
  const { isSuperAdmin } = useRole();

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
            <p className="text-red-600 text-xl mb-4">Some Error Occured !!</p>
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

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-3xl font-bold"
            onClick={() => navigate("/admin/dashboard")}
          >
            Course Builder
          </h1>
          <p className="text-gray-600 mt-2">Manage your courses and content</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">All Courses</h2>
            <p className="text-gray-600">
              Here is a glimpse of your overall progress.
            </p>
            {/* Course Counts */}
            {coursesData && (
              <div className="flex items-center space-x-6 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">
                      {
                        coursesData.filter(
                          (course: Course) => !course.published
                        ).length
                      }
                    </span>{" "}
                    Drafts
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-green-600">
                      {
                        coursesData.filter((course: Course) => course.published)
                          .length
                      }
                    </span>{" "}
                    Published
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-600">
                      {coursesData.length}
                    </span>{" "}
                    Total
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="flex flex-col sm:flex-row gap-4 lg:items-center">
            <div className="relative flex-1 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search courses by title, description, or difficulty..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#17627A] focus:border-[#17627A] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <button
              className="bg-[#17627A] text-[var(--font-light)] px-4 py-2 rounded-md flex items-center whitespace-nowrap hover:bg-[var(--primary-800)] transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              <span className="mr-1">+</span> Add New Course
            </button>
          </div>
        </div>

        {/* Course Statistics Cards */}
        {!searchQuery && coursesData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Draft Courses
                  </p>
                  <p className="text-2xl font-bold text-blue-800">
                    {
                      coursesData.filter((course: Course) => !course.published)
                        .length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Published Courses
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {
                      coursesData.filter((course: Course) => course.published)
                        .length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {coursesData.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              {filteredCourses.length === 0 ? (
                <>
                  No courses found for "
                  <span className="font-semibold">{searchQuery}</span>"
                </>
              ) : (
                <>
                  Found {filteredCourses.length} course
                  {filteredCourses.length !== 1 ? "s" : ""}
                  {filteredCourses.length !== coursesData?.length && (
                    <> out of {coursesData?.length} total</>
                  )}
                  for "<span className="font-semibold">{searchQuery}</span>"
                </>
              )}
            </p>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or browse all courses.
            </p>
            <button
              onClick={clearSearch}
              className="text-[#17627A] hover:text-[var(--primary-800)] font-medium transition-colors"
            >
              Clear search and view all courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: Course) => (
              <AdminCourseCard
                key={course.id}
                course={course}
                onEditClick={() => handleEditCourse(course.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add New Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-lg w-full max-w-md shadow-xl"
          >
            <div className="flex justify-between items-center px-6 pt-6 pb-4">
              <h2 className="text-xl font-bold">Add New Course</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
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
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
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
                className="w-full bg-[#17627A] text-[var(--font-light)] py-3 rounded-md font-medium hover:bg-[var(--primary-800)] transition-colors"
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

export default AdminDashboard;
