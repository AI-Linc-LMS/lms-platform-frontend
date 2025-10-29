import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getManageStudentDetail,
  postManageStudentAction,
  deactivateManageStudent,
  StudentDetail,
  patchManageStudent,
} from "../../../../services/admin/studentApis";
import { useToast } from "../../../../contexts/ToastContext";
import { getCourses } from "../../../../services/admin/courseApis";
import { 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiAward, 
  FiClock, 
  FiBookOpen, 
  FiCheckCircle,
  FiActivity,
  FiArrowLeft,
  FiSave,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
  FiPlusCircle,
  FiMinusCircle,
  FiZap
} from "react-icons/fi";

type CourseOption = { id: number; title: string };

export default function StudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { success, error } = useToast();

  // Load available courses
  const { data: coursesData } = useQuery({
    queryKey: ["admin-courses", clientId],
    queryFn: () => getCourses(clientId),
  });
  
  const availableCourses = useMemo<CourseOption[]>(() => {
    if (!coursesData) return [];
    const arr = (coursesData as Array<{ id: number; title: string }>) || [];
    return arr.map((c) => ({ id: c.id, title: c.title }));
  }, [coursesData]);

  const {
    data,
    refetch,
    isFetching,
  } = useQuery<StudentDetail>({
    queryKey: ["admin-student-detail", clientId, studentId],
    queryFn: () => getManageStudentDetail(clientId, Number(studentId)),
    enabled: Boolean(studentId),
  });

  // Local editable state for personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  
  useEffect(() => {
    if (data?.personal_info) {
      setFirstName(data.personal_info.first_name ?? "");
      setLastName(data.personal_info.last_name ?? "");
      setEmailAddr(data.personal_info.email ?? "");
    }
  }, [data]);

  // Controlled course select
  const defaultCourseId = useMemo(() => (availableCourses[0]?.id ?? undefined), [availableCourses]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    if (selectedCourseId === undefined) setSelectedCourseId(defaultCourseId);
  }, [defaultCourseId, selectedCourseId]);

  const activateMutation = useMutation({
    mutationFn: () => postManageStudentAction(clientId, Number(studentId), { action: "activate" }),
    onSuccess: () => {
      success("Activated", "Student activated successfully.");
      refetch();
    },
    onError: (e: unknown) => error("Failed to activate", (e as Error)?.message ?? ""),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateManageStudent(clientId, Number(studentId)),
    onSuccess: () => {
      success("Deactivated", "Student deactivated successfully.");
      refetch();
    },
    onError: (e: unknown) => error("Failed to deactivate", (e as Error)?.message ?? ""),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: number) =>
      postManageStudentAction(clientId, Number(studentId), { action: "enroll_course", course_id: courseId }),
    onSuccess: () => {
      success("Enrolled", "Student enrolled successfully.");
      refetch();
    },
    onError: (e: unknown) => error("Failed to enroll", (e as Error)?.message ?? ""),
  });

  const unenrollMutation = useMutation({
    mutationFn: (courseId: number) =>
      postManageStudentAction(clientId, Number(studentId), { action: "unenroll_course", course_id: courseId }),
    onSuccess: () => {
      success("Unenrolled", "Student unenrolled successfully.");
      refetch();
    },
    onError: (e: unknown) => error("Failed to unenroll", (e as Error)?.message ?? ""),
  });

  const resetMutation = useMutation({
    mutationFn: (courseId?: number) =>
      postManageStudentAction(clientId, Number(studentId), { action: "reset_progress", course_id: courseId }),
    onSuccess: () => {
      success("Progress reset", "Student progress has been reset.");
      refetch();
    },
    onError: (e: unknown) => error("Failed to reset", (e as Error)?.message ?? ""),
  });

  const updateInfoMutation = useMutation({
    mutationFn: () =>
      patchManageStudent(clientId, Number(studentId), {
        first_name: firstName,
        last_name: lastName,
        email: emailAddr,
      }),
    onSuccess: () => {
      success("Updated", "Student information updated successfully.");
      refetch();
    },
    onError: (e: unknown) => error("Failed to update", (e as Error)?.message ?? ""),
  });

  const toggleActive = () => {
    if (!data) return;
    if (data.personal_info.is_active) {
      if (confirm("Deactivate this student?")) deactivateMutation.mutate();
    } else {
      activateMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with gradient and glassmorphism */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-105 group"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-[var(--primary-500)] transition-colors" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Student Profile
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage student information and academic progress
                </p>
              </div>
            </div>
            
            {data && (
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  data.personal_info.is_active 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {data.personal_info.is_active ? '✓ Active' : '✗ Inactive'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isFetching && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading student data...</p>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-6 animate-fadeIn">
            {/* Student Overview Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] p-8 text-white">
                                  <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-2xl">
                      <span className="text-4xl font-bold">
                        {(data.personal_info.first_name || data.personal_info.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        {`${data.personal_info.first_name} ${data.personal_info.last_name}`.trim() || data.personal_info.email}
                      </h2>
                      <div className="flex items-center gap-4 text-white/90">
                        <div className="flex items-center gap-2">
                          <FiMail className="w-4 h-4" />
                          <span>{data.personal_info.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4" />
                          <span>@{data.personal_info.username}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50/50">
                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FiBookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Enrollments</p>
                      <p className="text-2xl font-bold text-gray-900">{data.academic_summary.enrolled_courses_count}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FiAward className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Marks</p>
                      <p className="text-2xl font-bold text-gray-900">{data.academic_summary.total_marks ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <FiActivity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Activities</p>
                      <p className="text-2xl font-bold text-gray-900">{data.academic_summary.total_activities ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <FiZap className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Streak</p>
                      <p className="text-2xl font-bold text-gray-900">{data.academic_summary.current_streak ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Personal Info & Course Management */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">Personal Information</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all hover:border-gray-300"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all hover:border-gray-300"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter last name"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                          <FiMail className="w-4 h-4" />
                          Email Address
                        </label>
                        <input
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all hover:border-gray-300"
                          type="email"
                          value={emailAddr}
                          onChange={(e) => setEmailAddr(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          Joined Date
                        </span>
                        <span className="font-semibold text-gray-900 block text-sm">
                          {new Date(data.personal_info.date_joined).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          Last Login
                        </span>
                        <span className="font-semibold text-gray-900 block text-sm">
                          {data.personal_info.last_login 
                            ? new Date(data.personal_info.last_login).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : "Never"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => updateInfoMutation.mutate()} 
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold transform hover:scale-105"
                      >
                        <FiSave className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button 
                        onClick={toggleActive} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-200 font-semibold transform hover:scale-105 shadow-sm hover:shadow-md ${
                          data.personal_info.is_active
                            ? 'border-red-300 text-red-700 hover:bg-red-50'
                            : 'border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {data.personal_info.is_active ? (
                          <>
                            <FiUserX className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <FiUserCheck className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Course Management */}
                <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-[var(--primary-50)] to-[var(--primary-100)] px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-100)] flex items-center justify-center">
                        <FiBookOpen className="w-5 h-5 text-[var(--primary-600)]" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">Course Management</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <select
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all font-medium"
                          value={selectedCourseId ?? ""}
                          onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                        >
                          {availableCourses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedCourseId) enrollMutation.mutate(selectedCourseId);
                        }}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold transform hover:scale-105"
                      >
                        <FiPlusCircle className="w-4 h-4" />
                        Enroll
                      </button>
                      <button
                        onClick={() => {
                          if (selectedCourseId) unenrollMutation.mutate(selectedCourseId);
                        }}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold transform hover:scale-105"
                      >
                        <FiMinusCircle className="w-4 h-4" />
                        Unenroll
                      </button>
                      <button
                        onClick={() => {
                          resetMutation.mutate(selectedCourseId);
                        }}
                        className="flex items-center gap-2 px-5 py-3 border-2 border-orange-300 text-orange-700 rounded-xl hover:bg-orange-50 transition-all duration-200 font-semibold transform hover:scale-105"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Reset Progress
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column - Enrolled Courses */}
              <div className="lg:col-span-1">
                <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 sticky top-24">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <FiBookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Enrolled Courses</h3>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                        {data.enrolled_courses.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 max-h-[600px] overflow-y-auto">
                    {data.enrolled_courses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <FiBookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No courses enrolled yet</p>
                        <p className="text-sm text-gray-400 mt-1">Enroll student in courses to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {data.enrolled_courses.map((c) => (
                          <div 
                            key={c.id} 
                            className="p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                          >
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-2">{c.title}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1.5">
                                    <FiAward className="w-4 h-4 text-amber-500" />
                                    <strong className="text-gray-900">{c.marks ?? 0}</strong> marks
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                                    <strong className="text-gray-900">{c.completed_contents ?? 0}</strong>/{c.total_contents ?? 0}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 font-medium">Progress</span>
                                  <span className="text-gray-700 font-bold">{c.progress_percentage ?? 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                  <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${c.progress_percentage ?? 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
