import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getManageStudentDetail,
  postManageStudentAction,
  deactivateManageStudent,
  StudentDetail,
  patchManageStudent,
} from "../../../../services/admin/studentApis";
import { useToast } from "../../../../contexts/ToastContext";
import { 
  FiUser, 
  FiMail, 
  FiCalendar, 
  FiAward, 
  FiClock, 
  FiBookOpen, 
  FiCheckCircle,
  FiTrendingUp,
  FiActivity,
  FiX,
  FiSave,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
  FiPlusCircle,
  FiMinusCircle
} from "react-icons/fi";

type CourseOption = { id: number; title: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  studentId?: number;
  availableCourses: CourseOption[];
  onChanged?: () => void; // callback to refresh list
}

export default function StudentDetailDrawer({
  isOpen,
  onClose,
  clientId,
  studentId,
  availableCourses,
  onChanged,
}: Props) {
  const { success, error } = useToast();
  const {
    data,
    refetch,
    isFetching,
  } = useQuery<StudentDetail>({
    queryKey: ["admin-student-detail", clientId, studentId],
    queryFn: () => getManageStudentDetail(clientId, studentId as number),
    enabled: isOpen && Boolean(studentId),
  });

  useEffect(() => {
    if (isOpen && studentId) refetch();
  }, [isOpen, studentId, refetch]);

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
    mutationFn: () => postManageStudentAction(clientId, studentId as number, { action: "activate" }),
    onSuccess: () => {
      success("Activated", "Student activated successfully.");
      refetch();
      onChanged?.();
    },
    onError: (e: unknown) => error("Failed to activate", (e as Error)?.message ?? ""),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateManageStudent(clientId, studentId as number),
    onSuccess: () => {
      success("Deactivated", "Student deactivated successfully.");
      refetch();
      onChanged?.();
    },
    onError: (e: unknown) => error("Failed to deactivate", (e as Error)?.message ?? ""),
  });

  const resetMutation = useMutation({
    mutationFn: (courseId?: number) =>
      courseId
        ? postManageStudentAction(clientId, studentId as number, { action: "reset_progress", course_id: courseId })
        : postManageStudentAction(clientId, studentId as number, { action: "reset_progress" }),
    onSuccess: () => {
      success("Progress reset", "Progress reset successfully.");
      refetch();
      onChanged?.();
    },
    onError: (e: unknown) => error("Failed to reset", (e as Error)?.message ?? ""),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: number) =>
      postManageStudentAction(clientId, studentId as number, { action: "enroll_course", course_id: courseId }),
    onSuccess: () => {
      success("Enrolled", "Student enrolled successfully.");
      refetch();
      onChanged?.();
    },
    onError: (e: unknown) => error("Failed to enroll", (e as Error)?.message ?? ""),
  });

  const unenrollMutation = useMutation({
    mutationFn: (courseId: number) =>
      postManageStudentAction(clientId, studentId as number, { action: "unenroll_course", course_id: courseId }),
    onSuccess: () => {
      success("Unenrolled", "Student unenrolled successfully.");
      refetch();
      onChanged?.();
    },
    onError: (e: unknown) => error("Failed to unenroll", (e as Error)?.message ?? ""),
  });

  const updateInfoMutation = useMutation({
    mutationFn: () =>
      patchManageStudent(clientId, studentId as number, {
        first_name: firstName,
        last_name: lastName,
        email: emailAddr,
      }),
    onSuccess: () => {
      success("Updated", "Student information updated successfully.");
      refetch();
      onChanged?.();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      
      {/* Drawer */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-4xl bg-gradient-to-br from-gray-50 to-white shadow-2xl overflow-y-auto transform transition-transform">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FiUser className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Student Details</h2>
                <p className="text-sm text-white/80">Manage student information and progress</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isFetching && (
          <div className="p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading student data...</p>
            </div>
          </div>
        )}

        {data && (
          <div className="p-6 space-y-6">
            {/* Personal Info Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-[var(--primary-500)]" />
                  <h3 className="font-semibold text-gray-800 text-lg">Personal Information</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FiMail className="w-3 h-3" />
                      Email Address
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none transition-all"
                      type="email"
                      value={emailAddr}
                      onChange={(e) => setEmailAddr(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 block mb-1">Username</span>
                    <span className="font-medium text-gray-900">{data.personal_info.username}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 block mb-1">Status</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      data.personal_info.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {data.personal_info.is_active ? <FiUserCheck className="w-3 h-3" /> : <FiUserX className="w-3 h-3" />}
                      {data.personal_info.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <FiCalendar className="w-3 h-3" />
                      Joined Date
                    </span>
                    <span className="font-medium text-gray-900 text-sm">
                      {new Date(data.personal_info.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 block mb-1">Last Login</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {data.personal_info.last_login 
                        ? new Date(data.personal_info.last_login).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => updateInfoMutation.mutate()} 
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-500)] text-white rounded-lg hover:bg-[var(--primary-600)] transition-colors shadow-sm font-medium"
                  >
                    <FiSave className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button 
                    onClick={toggleActive} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium ${
                      data.personal_info.is_active
                        ? 'border-red-300 text-red-700 hover:bg-red-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {data.personal_info.is_active ? (
                      <>
                        <FiUserX className="w-4 h-4" />
                        Deactivate Student
                      </>
                    ) : (
                      <>
                        <FiUserCheck className="w-4 h-4" />
                        Activate Student
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => resetMutation.mutate(undefined)} 
                    className="flex items-center gap-2 px-4 py-2.5 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors font-medium ml-auto"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Reset All Progress
                  </button>
                </div>
              </div>
            </section>

            {/* Course Management Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FiBookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800 text-lg">Course Management</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Select Course</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      value={selectedCourseId}
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
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                  >
                    <FiPlusCircle className="w-4 h-4" />
                    Enroll
                  </button>
                  <button
                    onClick={() => {
                      if (selectedCourseId) unenrollMutation.mutate(selectedCourseId);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm font-medium"
                  >
                    <FiMinusCircle className="w-4 h-4" />
                    Unenroll
                  </button>
                  <button
                    onClick={() => {
                      resetMutation.mutate(selectedCourseId);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors font-medium"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Reset Progress
                  </button>
                </div>
              </div>
            </section>

            {/* Academic Summary Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FiAward className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800 text-lg">Academic Summary</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Marks</span>
                      <FiAward className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{data.academic_summary.total_marks}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Time Spent</span>
                      <FiClock className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {data.academic_summary.total_time_spent.value} 
                      <span className="text-sm ml-1 font-normal">{data.academic_summary.total_time_spent.unit}</span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Enrollments</span>
                      <FiBookOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{data.academic_summary.enrolled_courses_count}</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Submissions</span>
                      <FiCheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{data.academic_summary.assessment_submissions_count}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Current Streak</span>
                      <FiTrendingUp className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {data.academic_summary.current_streak}
                      <span className="text-sm ml-1 font-normal">days</span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-pink-700 uppercase tracking-wide">Activities</span>
                      <FiActivity className="w-4 h-4 text-pink-600" />
                    </div>
                    <p className="text-2xl font-bold text-pink-900">{data.academic_summary.total_activities}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Enrolled Courses Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-800 text-lg">Enrolled Courses</h3>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    {data.enrolled_courses.length} {data.enrolled_courses.length === 1 ? 'Course' : 'Courses'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {data.enrolled_courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiBookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No courses enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.enrolled_courses.map((c) => (
                      <div key={c.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">{c.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiAward className="w-3.5 h-3.5" />
                                Marks: <strong className="text-gray-900">{c.marks ?? 0}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                <FiCheckCircle className="w-3.5 h-3.5" />
                                Contents: <strong className="text-gray-900">{c.completed_contents ?? 0}/{c.total_contents ?? 0}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">Progress</span>
                            <span className="text-gray-700 font-semibold">{c.progress_percentage ?? 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${c.progress_percentage ?? 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
