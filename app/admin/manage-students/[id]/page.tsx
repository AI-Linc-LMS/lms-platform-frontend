"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminStudentService,
  StudentDetail,
  StudentLearningJourney,
} from "@/lib/services/admin/admin-student.service";
import {
  SectionHero,
  KpiRail,
  SectionShell,
} from "@/components/scorecard/shared";
import { ManageTab } from "@/components/admin/manage-students/detail/ManageTab";
import { OverviewTab } from "@/components/admin/manage-students/detail/OverviewTab";
import { CoursesTab } from "@/components/admin/manage-students/detail/CoursesTab";
import { AssessmentsTab } from "@/components/admin/manage-students/detail/AssessmentsTab";
import { MockInterviewsTab } from "@/components/admin/manage-students/detail/MockInterviewsTab";
import { AdaptiveTab } from "@/components/admin/manage-students/detail/AdaptiveTab";
import { TimelineTab } from "@/components/admin/manage-students/detail/TimelineTab";
import {
  ADAPTIVE,
  ADAPTIVE_MESH,
  formatDate,
} from "@/components/admin/manage-students/detail/shared";

type TabKey =
  | "overview"
  | "courses"
  | "assessments"
  | "mock"
  | "adaptive"
  | "timeline"
  | "manage";

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const studentId = params?.id ? Number(params.id) : null;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [journey, setJourney] = useState<StudentLearningJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");

  // Manage-tab edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const loadStudent = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await adminStudentService.getStudent(studentId);
      setStudent(data);
      setFormData({
        first_name: data.personal_info.first_name || "",
        last_name: data.personal_info.last_name || "",
        email: data.personal_info.email || "",
      });
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || t("manageStudents.failedToLoadStudent"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, showToast, t]);

  const loadJourney = useCallback(async () => {
    if (!studentId) return;
    try {
      setJourneyLoading(true);
      const data = await adminStudentService.getLearningJourney(studentId);
      setJourney(data);
    } catch {
      // Journey is supplementary — keep the page usable if it fails.
      setJourney(null);
    } finally {
      setJourneyLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
    loadJourney();
  }, [loadStudent, loadJourney]);

  const handleSavePersonalInfo = async () => {
    if (!student || !studentId) return;
    try {
      setSaving(true);
      await adminStudentService.updateStudent(studentId, { ...formData });
      setStudent({
        ...student,
        personal_info: { ...student.personal_info, ...formData },
      });
      showToast(t("manageStudents.personalInfoUpdated"), "success");
      setEditing(false);
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || t("manageStudents.failedToUpdatePersonalInfo"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollmentChange = async () => {
    // Refresh both the management view and the breakdown after enroll/unenroll.
    await Promise.all([loadStudent(), loadJourney()]);
  };

  const handleToggleActive = async () => {
    if (!student || !studentId) return;
    try {
      setSaving(true);
      const newActiveStatus = !student.personal_info.is_active;
      if (newActiveStatus) {
        await adminStudentService.activateStudent(studentId);
      } else {
        await adminStudentService.deactivateStudent(studentId);
      }
      setStudent({
        ...student,
        personal_info: { ...student.personal_info, is_active: newActiveStatus },
      });
      showToast(
        newActiveStatus
          ? t("manageStudents.studentActivated")
          : t("manageStudents.studentDeactivated"),
        "success"
      );
    } catch (error: unknown) {
      showToast(
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || t("manageStudents.failedToUpdateStatus"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExportReport = () => {
    if (!journey) return;
    const s = journey.summary;
    const lines: string[] = [];
    lines.push("Field,Value");
    lines.push(`Name,"${journey.student.name}"`);
    lines.push(`Email,"${journey.student.email}"`);
    lines.push(`Active,${journey.student.is_active ? "Yes" : "No"}`);
    lines.push(`Enrolled courses,${s.enrolled_courses_count}`);
    lines.push(`Overall completion %,${s.overall_completion_pct}`);
    lines.push(`Total marks,${s.total_marks}`);
    lines.push(`Total time (hrs),${s.total_time_hours}`);
    lines.push(`Current streak,${s.current_streak}`);
    lines.push(`Assessments,${s.assessments_count}`);
    lines.push(`Mock interviews,${s.mock_interviews_count}`);
    lines.push(`Adaptive sessions,${s.adaptive_sessions_count}`);
    lines.push("");
    lines.push("Course,Completed,Total,Progress %,Marks");
    journey.courses.forEach((c) =>
      lines.push(
        `"${c.title}",${c.completed_contents},${c.total_contents},${c.progress_percentage},${c.marks}`
      )
    );
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-${studentId}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <Typography sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
            {t("manageStudents.loadingStudentProfile")}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: "center", minHeight: "50vh" }}>
          <IconWrapper icon="mdi:account-alert-outline" size={38} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
            {t("manageStudents.studentNotFound")}
          </Typography>
          <Button onClick={() => router.push("/admin/manage-students")} sx={{ mt: 2 }}>
            {t("common.back")}
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const pi = student.personal_info;
  const name = `${pi.first_name} ${pi.last_name}`.trim() || pi.username;
  const summary = journey?.summary;

  const kpis = [
    { label: "Courses", value: summary?.enrolled_courses_count ?? student.academic_summary.enrolled_courses_count, accent: ADAPTIVE.indigo },
    { label: "Completion", value: summary ? `${summary.overall_completion_pct}%` : "—", accent: ADAPTIVE.green, numeric: false },
    { label: "Marks", value: summary?.total_marks ?? student.academic_summary.total_marks, accent: ADAPTIVE.purple },
    { label: "Streak", value: summary?.current_streak ?? student.academic_summary.current_streak, accent: ADAPTIVE.amber },
    { label: "Time (hrs)", value: summary?.total_time_hours ?? student.academic_summary.total_time_spent.value, accent: ADAPTIVE.blue, numeric: false },
    { label: "Activities", value: summary?.total_activities ?? student.academic_summary.total_activities, accent: ADAPTIVE.pink },
  ];

  const tabDefs: Array<{ key: TabKey; label: string; icon: string }> = [
    { key: "overview", label: "Overview", icon: "mdi:view-dashboard-outline" },
    { key: "courses", label: "Courses & Content", icon: "mdi:book-open-variant" },
    { key: "assessments", label: "Assessments", icon: "mdi:clipboard-text-outline" },
    { key: "mock", label: "Mock Interviews", icon: "mdi:account-voice" },
    { key: "adaptive", label: "Adaptive", icon: "mdi:brain" },
    { key: "timeline", label: "Timeline", icon: "mdi:timeline-clock-outline" },
    { key: "manage", label: "Manage", icon: "mdi:cog-outline" },
  ];

  const journeyPending = journeyLoading && !journey;

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1320, mx: "auto", width: "100%" }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.back()}
          sx={{ color: "var(--accent-indigo)", mb: 2 }}
        >
          {t("common.back")}
        </Button>

        <SectionHero
          chapter="Student Profile"
          title={name}
          subtitle={pi.email}
          iconBadge={{ icon: "mdi:account-school", gradient: ADAPTIVE.gradient }}
          rightSlot={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                size="small"
                label={pi.is_active ? "Active" : "Inactive"}
                sx={{
                  fontWeight: 700,
                  color: pi.is_active ? ADAPTIVE.green : "#94a3b8",
                  bgcolor: pi.is_active
                    ? "color-mix(in srgb, #10b981 14%, transparent)"
                    : "color-mix(in srgb, #94a3b8 16%, transparent)",
                }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconWrapper icon="mdi:download" size={18} />}
                onClick={handleExportReport}
                disabled={!journey}
                sx={{ borderColor: ADAPTIVE.indigo, color: ADAPTIVE.indigo, fontWeight: 700 }}
              >
                Export
              </Button>
            </Box>
          }
        />

        <KpiRail items={kpis} />

        {summary?.last_activity_date && (
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 2, mt: -2 }}>
            Last active {formatDate(summary.last_activity_date)} · joined {formatDate(pi.date_joined)}
          </Typography>
        )}

        <Box sx={{ borderBottom: "1px solid var(--border-default)", mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": { fontWeight: 700, textTransform: "none", minHeight: 48 },
              "& .Mui-selected": { color: `${ADAPTIVE.indigo} !important` },
              "& .MuiTabs-indicator": { background: ADAPTIVE.gradient, height: 3 },
            }}
          >
            {tabDefs.map((d) => (
              <Tab
                key={d.key}
                value={d.key}
                label={d.label}
                icon={<IconWrapper icon={d.icon} size={18} />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <SectionShell radialMesh={ADAPTIVE_MESH} meshOpacity={0.35}>
          {tab === "manage" ? (
            <ManageTab
              student={student}
              studentId={studentId!}
              editing={editing}
              formData={formData}
              saving={saving}
              onEdit={() => setEditing(true)}
              onCancel={() => {
                setEditing(false);
                setFormData({
                  first_name: pi.first_name || "",
                  last_name: pi.last_name || "",
                  email: pi.email || "",
                });
              }}
              onSave={handleSavePersonalInfo}
              onFormChange={(field, value) =>
                setFormData({ ...formData, [field]: value })
              }
              onToggleActive={handleToggleActive}
              onEnrollmentChange={handleEnrollmentChange}
            />
          ) : journeyPending ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={32} />
            </Box>
          ) : !journey ? (
            <Typography sx={{ color: "var(--font-secondary)", textAlign: "center", py: 6 }}>
              Couldn&apos;t load the activity breakdown. Try refreshing.
            </Typography>
          ) : (
            <>
              {tab === "overview" && <OverviewTab journey={journey} />}
              {tab === "courses" && <CoursesTab courses={journey.courses} />}
              {tab === "assessments" && <AssessmentsTab assessments={journey.assessments} />}
              {tab === "mock" && <MockInterviewsTab data={journey.mock_interviews} />}
              {tab === "adaptive" && <AdaptiveTab adaptive={journey.adaptive} />}
              {tab === "timeline" && (
                <TimelineTab
                  timeline={journey.timeline}
                  weeklyProgress={journey.weekly_progress}
                />
              )}
            </>
          )}
        </SectionShell>
      </Box>
    </MainLayout>
  );
}
