import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiEdit2, FiTrash2 } from "react-icons/fi";
import AddStudentModal from "../components/AddStudentModal";
import FilterModal, { FilterCriteria } from "../components/FilterModal";

interface Student {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  enrolledCourses: string[];
}

interface StudentFormData {
  name: string;
  email: string;
  mobileNumber: string;
  enrolledCourses: string[];
}

const ManageStudents = () => {
  //   const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    courses: [],
    searchTerm: "",
  });
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      name: "Avish Shetty",
      email: "avishvshetty@gmail.com",
      mobileNumber: "+91 9839487393",
      enrolledCourses: ["Deployment in ML", "Full-Stack Development"],
    },
    {
      id: 2,
      name: "Avish Shetty",
      email: "avishvshetty@gmail.com",
      mobileNumber: "+91 9839487393",
      enrolledCourses: ["Deployment in ML"],
    },
    {
      id: 3,
      name: "Avish Shetty",
      email: "avishvshetty@gmail.com",
      mobileNumber: "+91 9839487393",
      enrolledCourses: ["Deployment in ML", "Front-End Development"],
    },
    {
      id: 4,
      name: "Avish Shetty",
      email: "avishvshetty@gmail.com",
      mobileNumber: "+91 9839487393",
      enrolledCourses: ["Deployment in ML", "Back-End Development"],
    },
    {
      id: 5,
      name: "Avish Shetty",
      email: "avishvshetty@gmail.com",
      mobileNumber: "+91 9839487393",
      enrolledCourses: ["Deployment in ML"],
    },
    {
      id: 6,
      name: "Avish Shetty",
      email: "avishvshetty@gmail.com",
      mobileNumber: "+91 9839487393",
      enrolledCourses: ["Deployment in ML", "Full-Stack Development"],
    },
  ]);

  //   const handleBackToMain = () => {
  //     navigate("/");
  //   };

  const handleAddStudent = () => {
    setIsAddModalOpen(true);
  };

  const handleAddStudentSubmit = (studentData: StudentFormData) => {
    const newStudent: Student = {
      id: Math.max(...students.map((s) => s.id)) + 1,
      ...studentData,
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleEditStudent = () => {
    // TODO: Implement edit student functionality
    //console.log("Edit student:", studentId);
  };

  const handleDeleteStudent = (studentId: number) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
    }
  };

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setSearchTerm(newFilters.searchTerm);
  };

  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Course filter
    const matchesCourses =
      filters.courses.length === 0 ||
      filters.courses.some((course) =>
        student.enrolledCourses.includes(course)
      );

    return matchesSearch && matchesCourses;
  });

  const hasActiveFilters = filters.courses.length > 0;

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-4">
            {/* <button
              onClick={handleBackToMain}
              className="w-fit flex items-center gap-2 px-4 py-2 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 12H5M12 19l-7-7 7-7" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Back to Main
            </button> */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Students
              </h1>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Name, Email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none"
              />
            </div>

            {/* Filter and Add Student Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  hasActiveFilters
                    ? "border-[#255C79] bg-[#255C79] text-white"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filter
                {hasActiveFilters && (
                  <span className="bg-white text-[#255C79] text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {filters.courses.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleAddStudent}
                className="flex items-center gap-2 px-4 py-2 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors"
              >
                <span className="text-lg">+</span>
                Add Student
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.courses.map((course) => (
                  <span
                    key={course}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#255C79] text-white"
                  >
                    {course}
                    <button
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          courses: filters.courses.filter((c) => c !== course),
                        };
                        setFilters(newFilters);
                      }}
                      className="ml-1 text-white hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setFilters({ courses: [], searchTerm: "" })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Mobile Number
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Enrolled Courses
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 px-6 text-center text-gray-500"
                    >
                      {searchTerm || hasActiveFilters
                        ? "No students found matching your criteria."
                        : "No students found."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {student.mobileNumber}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {student.enrolledCourses.map((course, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {course}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditStudent()}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Student"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Student"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Student Modal */}
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddStudentSubmit}
        />

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={filters}
        />
      </div>
    </div>
  );
};

export default ManageStudents;
