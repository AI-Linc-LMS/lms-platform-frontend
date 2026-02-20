"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from "@mui/material";
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
import { formatDate } from "@/lib/utils/date-utils";

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const studentId = params?.id ? Number(params.id) : null;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assessmentPage, setAssessmentPage] = useState(1);
  const [assessmentLimit, setAssessmentLimit] = useState(10);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLimit, setActivityLimit] = useState(10);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });;
    } catch {
      return value;
    }
  };

  const sectionPaperSx = {
    p: 3,
    borderRadius: 3,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e5e7eb",
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,250,251,0.8) 100%)",
  } as const;

  const tableHeaderRowSx = {
    backgroundColor: "#f8fafc",
    "& .MuiTableCell-root": {
      fontWeight: 700,
      color: "#334155",
      borderBottom: "1px solid #e2e8f0",
    },
  } as const;

  const tableContainerSx = {
    border: "1px solid #e5e7eb",
    borderRadius: 2,
    overflowX: "auto",
    "&::-webkit-scrollbar": { height: 8, width: 8 },
    "&::-webkit-scrollbar-track": { backgroundColor: "#f1f5f9" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#cbd5e1",
      borderRadius: 4,
    },
  } as const;

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


  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <CircularProgress size={36} />
          <Typography variant="body1" sx={{ color: "#64748b", fontWeight: 500 }}>
            Loading student profile...
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            sx={{
              px: 4,
              py: 5,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Box sx={{ mb: 1.5 }}>
              <IconWrapper icon="mdi:account-alert-outline" size={38} color="#94a3b8" />
            </Box>
            <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600 }}>
              Student not found
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
              The requested student profile is unavailable.
            </Typography>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  const { personal_info, academic_summary, enrolled_courses } = student;
  const assessmentTotalPages = Math.max(
    1,
    Math.ceil((student.assessments?.length || 0) / assessmentLimit)
  );
  const assessmentStartIndex = (assessmentPage - 1) * assessmentLimit;
  const assessmentEndIndex = assessmentStartIndex + assessmentLimit;
  const paginatedAssessments = (student.assessments || []).slice(
    assessmentStartIndex,
    assessmentEndIndex
  );
  const activityTotalPages = Math.max(
    1,
    Math.ceil((student.activity_pattern_30_days?.length || 0) / activityLimit)
  );
  const activityStartIndex = (activityPage - 1) * activityLimit;
  const activityEndIndex = activityStartIndex + activityLimit;
  const paginatedActivity = (student.activity_pattern_30_days || []).slice(
    activityStartIndex,
    activityEndIndex
  );

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
                 {/* Activity Breakdown */}
                 <Paper sx={sectionPaperSx}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#0f172a", mb: 2, letterSpacing: 0.2 }}
                >
                  Activity Breakdown
                </Typography>
                {student.activity_breakdown &&
                Object.keys(student.activity_breakdown).length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {Object.entries(student.activity_breakdown).map(([type, count]) => (
                      <Chip key={type} label={`${type}: ${count}`} sx={{ fontWeight: 500 }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    No activity breakdown available.
                  </Typography>
                )}
              </Paper>
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

              {/* Assessment History */}
              <Paper sx={sectionPaperSx}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#0f172a", mb: 2, letterSpacing: 0.2 }}
                >
                  Assessment History
                </Typography>
                {student.assessments?.length ? (
                  <>
                    <TableContainer sx={tableContainerSx}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={tableHeaderRowSx}>
                            <TableCell>Assessment</TableCell>
                            <TableCell>Score</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Started At</TableCell>
                            <TableCell>Submitted At</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedAssessments.map((assessment) => (
                            <TableRow
                              key={assessment.id}
                              sx={{
                                "&:nth-of-type(odd)": { backgroundColor: "#fcfdff" },
                                "&:hover": { backgroundColor: "#f8fafc" },
                              }}
                            >
                              <TableCell>
                                {assessment.assessment_title || assessment.title || `Assessment #${assessment.id}`}
                              </TableCell>
                              <TableCell>{assessment.score ?? "-"}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={assessment.status || "N/A"}
                                  sx={{
                                    backgroundColor:
                                      assessment.status === "submitted" ? "#d1fae5" : "#f3f4f6",
                                    color:
                                      assessment.status === "submitted" ? "#065f46" : "#6b7280",
                                  }}
                                />
                              </TableCell>
                              <TableCell>{formatDateTime(assessment.started_at || assessment.date)}</TableCell>
                              <TableCell>{formatDateTime(assessment.submitted_at || assessment.date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#6b7280",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          Showing{" "}
                          {paginatedAssessments.length === 0 ? 0 : assessmentStartIndex + 1} to{" "}
                          {Math.min(assessmentEndIndex, student.assessments.length)} of{" "}
                          {student.assessments.length} assessments
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={assessmentLimit}
                            onChange={(e) => {
                              setAssessmentLimit(Number(e.target.value));
                              setAssessmentPage(1);
                            }}
                            displayEmpty
                            inputProps={{ "aria-label": "Assessments per page" }}
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          >
                            <MenuItem value={5}>5 per page</MenuItem>
                            <MenuItem value={10}>10 per page</MenuItem>
                            <MenuItem value={15}>15 per page</MenuItem>
                            <MenuItem value={30}>30 per page</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      <Pagination
                        count={assessmentTotalPages}
                        page={assessmentPage}
                        onChange={(_, value) => setAssessmentPage(value)}
                        color="primary"
                        size="small"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    No assessments found for this student.
                  </Typography>
                )}
              </Paper>

           

              {/* Activity Pattern - 30 Days */}
              <Paper sx={sectionPaperSx}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#0f172a", mb: 2, letterSpacing: 0.2 }}
                >
                  Last 30 Days Activity
                </Typography>
                {student.activity_pattern_30_days?.length ? (
                  <>
                    <TableContainer sx={tableContainerSx}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={tableHeaderRowSx}>
                            <TableCell>Date</TableCell>
                            <TableCell>Activities</TableCell>
                            <TableCell>Time Spent (hrs)</TableCell>
                            <TableCell>Marks Earned</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedActivity.map((day) => (
                            <TableRow
                              key={day.date}
                              sx={{
                                "&:nth-of-type(odd)": { backgroundColor: "#fcfdff" },
                                "&:hover": { backgroundColor: "#f8fafc" },
                              }}
                            >
                              <TableCell>{formatDate(day.date)}</TableCell>
                              <TableCell>{day.activity_count}</TableCell>
                              <TableCell>{day.time_spent_hours}</TableCell>
                              <TableCell>{day.marks_earned}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        Showing{" "}
                        {paginatedActivity.length === 0 ? 0 : activityStartIndex + 1} to{" "}
                        {Math.min(
                          activityEndIndex,
                          student.activity_pattern_30_days.length
                        )}{" "}
                        of {student.activity_pattern_30_days.length} days
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={activityLimit}
                          onChange={(e) => {
                            setActivityLimit(Number(e.target.value));
                            setActivityPage(1);
                          }}
                          displayEmpty
                          inputProps={{ "aria-label": "Days per page" }}
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          <MenuItem value={5}>5 per page</MenuItem>
                          <MenuItem value={10}>10 per page</MenuItem>
                          <MenuItem value={15}>15 per page</MenuItem>
                          <MenuItem value={30}>30 per page</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Pagination
                      count={activityTotalPages}
                      page={activityPage}
                      onChange={(_, value) => setActivityPage(value)}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                    />
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    No 30-day activity data available.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
