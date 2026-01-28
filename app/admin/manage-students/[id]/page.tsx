"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentService,
  StudentDetail,
} from "@/lib/services/admin/admin-student.service";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StudentMetricCards } from "@/components/admin/manage-students/StudentMetricCards";
import { StudentProfileCard } from "@/components/admin/manage-students/StudentProfileCard";
import { PersonalInformationCard } from "@/components/admin/manage-students/PersonalInformationCard";
import { AccountStatusCard } from "@/components/admin/manage-students/AccountStatusCard";
import { EnrolledCoursesTable } from "@/components/admin/manage-students/EnrolledCoursesTable";
import { CourseManagementCard } from "@/components/admin/manage-students/CourseManagementCard";

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const studentId = params?.id ? Number(params.id) : null;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  useEffect(() => {
    if (!studentId) return;

    const loadStudent = async () => {
      try {
        setLoading(true);
        const data = await adminStudentService.getStudent(studentId);
        setStudent(data);
        setFormData({
          first_name: data.personal_info.first_name || "",
          last_name: data.personal_info.last_name || "",
          email: data.personal_info.email || "",
        });
      } catch (error: any) {
        showToast(
          error?.response?.data?.detail || "Failed to load student details",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [studentId, showToast]);

  const handleSavePersonalInfo = async () => {
    if (!student || !studentId) return;
    try {
      setSaving(true);
      await adminStudentService.updateStudent(studentId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      });
      setStudent({
        ...student,
        personal_info: {
          ...student.personal_info,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        },
      });
      showToast("Personal information updated successfully", "success");
      setEditing(false);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail ||
          "Failed to update personal information",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollmentChange = async () => {
    if (!studentId) return;
    try {
      const data = await adminStudentService.getStudent(studentId);
      setStudent(data);
    } catch (error: any) {}
  };

  const handleToggleActive = async () => {
    if (!student || !studentId) return;
    try {
      setSaving(true);
      const newActiveStatus = !student.personal_info.is_active;

      if (newActiveStatus) {
        // Activate: Use POST with action: "activate"
        await adminStudentService.activateStudent(studentId);
      } else {
        // Deactivate: Use DELETE
        await adminStudentService.deactivateStudent(studentId);
      }

      setStudent({
        ...student,
        personal_info: {
          ...student.personal_info,
          is_active: newActiveStatus,
        },
      });
      showToast(
        `Student ${newActiveStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to update student status",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };


  if (!student) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h6" sx={{ color: "#6b7280" }}>
            Student not found
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  const { personal_info, academic_summary, enrolled_courses } = student;

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header with Back Button */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.push("/admin/manage-students")}
            sx={{ color: "#6366f1" }}
          >
            Back
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Student Details
          </Typography>
        </Box>

        {/* Metric Cards */}
        <StudentMetricCards
          enrollments={academic_summary.enrolled_courses_count}
          totalMarks={academic_summary.total_marks}
          activities={academic_summary.total_activities}
          streak={academic_summary.current_streak}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {/* Left Sidebar - Student Information */}
          <Box sx={{ width: { xs: "100%", md: "33.333%" } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <StudentProfileCard student={student} />
              <AccountStatusCard
                student={student}
                saving={saving}
                onToggle={handleToggleActive}
              />
            </Box>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flex: 1, width: { xs: "100%", md: "66.666%" } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Personal Information - Moved to Right */}
              <PersonalInformationCard
                student={student}
                editing={editing}
                formData={formData}
                saving={saving}
                onEdit={() => setEditing(true)}
                onCancel={() => {
                  setEditing(false);
                  setFormData({
                    first_name: personal_info.first_name || "",
                    last_name: personal_info.last_name || "",
                    email: personal_info.email || "",
                  });
                }}
                onSave={handleSavePersonalInfo}
                onFormChange={(field, value) =>
                  setFormData({ ...formData, [field]: value })
                }
              />

              {/* Course Management */}
              <CourseManagementCard
                studentId={studentId!}
                enrolledCourseIds={enrolled_courses.map((c) => c.id)}
                onEnrollmentChange={handleEnrollmentChange}
              />

              {/* Enrolled Courses Table */}
              <EnrolledCoursesTable courses={enrolled_courses} />
            </Box>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
