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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Student Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {isFetching && (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        )}

        {data && (
          <div className="p-6 space-y-6">
            <section>
              <h3 className="font-semibold text-gray-800 mb-2">Personal Info</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col">
                  <span className="text-gray-500">First Name</span>
                  <input
                    className="border rounded px-2 py-1"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-gray-500">Last Name</span>
                  <input
                    className="border rounded px-2 py-1"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>
                <label className="flex flex-col col-span-2">
                  <span className="text-gray-500">Email</span>
                  <input
                    className="border rounded px-2 py-1"
                    type="email"
                    value={emailAddr}
                    onChange={(e) => setEmailAddr(e.target.value)}
                  />
                </label>
                <div><span className="text-gray-500">Username: </span>{data.personal_info.username}</div>
                <div><span className="text-gray-500">Active: </span>{data.personal_info.is_active ? "Yes" : "No"}</div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button onClick={() => updateInfoMutation.mutate()} className="px-3 py-2 border rounded bg-[var(--primary-50)]">
                  Save Changes
                </button>
                <button onClick={toggleActive} className="px-3 py-2 border rounded">
                  {data.personal_info.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => resetMutation.mutate(undefined)} className="px-3 py-2 border rounded">
                  Reset All Progress
                </button>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-800 mb-2">Enroll/Unenroll</h3>
              <div className="flex gap-2 items-center">
                <select
                  className="border rounded px-2 py-1"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                >
                  {availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedCourseId) enrollMutation.mutate(selectedCourseId);
                  }}
                  className="px-3 py-2 border rounded text-emerald-700"
                >
                  Enroll
                </button>
                <button
                  onClick={() => {
                    if (selectedCourseId) unenrollMutation.mutate(selectedCourseId);
                  }}
                  className="px-3 py-2 border rounded text-amber-700"
                >
                  Unenroll
                </button>
                <button
                  onClick={() => {
                    resetMutation.mutate(selectedCourseId);
                  }}
                  className="px-3 py-2 border rounded text-orange-700"
                >
                  Reset Course Progress
                </button>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-800 mb-2">Academic Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Marks: </span>{data.academic_summary.total_marks}</div>
                <div><span className="text-gray-500">Time: </span>{data.academic_summary.total_time_spent.value} {data.academic_summary.total_time_spent.unit}</div>
                <div><span className="text-gray-500">Enrollments: </span>{data.academic_summary.enrolled_courses_count}</div>
                <div><span className="text-gray-500">Submissions: </span>{data.academic_summary.assessment_submissions_count}</div>
                <div><span className="text-gray-500">Streak: </span>{data.academic_summary.current_streak}</div>
                <div><span className="text-gray-500">Activities: </span>{data.academic_summary.total_activities}</div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-800 mb-2">Courses</h3>
              <div className="space-y-2">
                {data.enrolled_courses.map((c) => (
                  <div key={c.id} className="border rounded p-3 text-sm flex justify-between">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-gray-600">Progress: {c.progress_percentage ?? 0}% • Marks: {c.marks ?? 0}</div>
                    </div>
                    <div className="text-gray-500">Contents: {c.completed_contents ?? 0}/{c.total_contents ?? 0}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
