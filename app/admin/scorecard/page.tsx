"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";

import { AdminScorecardSubNav } from "@/components/admin/scorecard/AdminScorecardSubNav";

import { IconWrapper } from "@/components/common/IconWrapper";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { AssessmentPerformanceSection } from "@/components/scorecard/detailed/AssessmentPerformanceSection";
import { BehavioralMetricsSection } from "@/components/scorecard/detailed/BehavioralMetricsSection";
import { AchievementsSection } from "@/components/scorecard/detailed/AchievementsSection";
import { ActionPanelSection } from "@/components/scorecard/detailed/ActionPanelSection";
import { ComparativeInsightsSection } from "@/components/scorecard/detailed/ComparativeInsightsSection";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { MockInterviewSection } from "@/components/scorecard/detailed/MockInterviewSection";
import { PerformanceTrendsSection } from "@/components/scorecard/detailed/PerformanceTrendsSection";
import { SkillScorecardSection } from "@/components/scorecard/detailed/SkillScorecardSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { WeakAreasSection } from "@/components/scorecard/detailed/WeakAreasSection";
import { adminStudentService, type Student } from "@/lib/services/admin/admin-student.service";
import {
  getAdminScorecardConfig,
  getAdminScorecardForStudent,
  updateAdminScorecardConfig,
} from "@/lib/services/admin/admin-scorecard.service";
import { profileService, type HeatmapData } from "@/lib/services/profile.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";

const MODULE_OPTIONS = [
  { id: "overview", label: "Student Overview" },
  { id: "activity_heatmap", label: "Activity Heatmap" },
  { id: "learning_consumption", label: "Learning Consumption" },
  { id: "performance_trends", label: "Performance Trends" },
  { id: "skill_scorecard", label: "Skill Scorecard" },
  { id: "weak_areas", label: "Weak Areas" },
  { id: "assessment_performance", label: "Assessment Performance" },
  { id: "mock_interview", label: "Mock Interview" },
  { id: "behavioral_metrics", label: "Behavioral & Consistency" },
  { id: "comparative_insights", label: "Comparative Insights" },
  { id: "achievements", label: "Achievements" },
  { id: "action_panel", label: "Action Panel" },
] as const;

const ALLOWED_MODULE_IDS: string[] = MODULE_OPTIONS.map((m) => m.id);

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const statCardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function AdminScorecardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const initialView = searchParams.get("view") === "config" ? "config" : "scorecard";
  const [mainTab, setMainTab] = useState<"scorecard" | "config">(initialView);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingScorecard, setLoadingScorecard] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => [...ALLOWED_MODULE_IDS]);
  const [configDirty, setConfigDirty] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});

  const stats = useMemo(
    () => ({
      students: students.length,
      sectionTypes: MODULE_OPTIONS.length,
      modulesEnabled: enabledModules.length === 0 ? MODULE_OPTIONS.length : enabledModules.length,
    }),
    [students.length, enabledModules.length]
  );

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const pageSize = 200;
      let page = 1;
      let hasNext = true;
      const allStudents: Student[] = [];

      while (hasNext) {
        const res = await adminStudentService.getManageStudents({ limit: pageSize, page });
        allStudents.push(...res.students);
        hasNext = res.pagination.has_next;
        page += 1;
      }

      const uniqueStudents = Array.from(
        new Map(allStudents.map((student) => [student.id, student])).values()
      );
      setStudents(uniqueStudents);
    } catch {
      showToast("Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }, [showToast]);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const config = await getAdminScorecardConfig();
      const raw = config.enabled_modules || [];
      const loaded = raw.filter((id: string) => ALLOWED_MODULE_IDS.includes(id));
      setEnabledModules(loaded);
      if (loaded.length > 0) {
        const ordered = [
          ...loaded,
          ...ALLOWED_MODULE_IDS.filter((id) => !loaded.includes(id)),
        ];
        setModuleOrder(ordered);
      } else {
        setModuleOrder([...ALLOWED_MODULE_IDS]);
      }
    } catch {
      showToast("Failed to load config", "error");
    } finally {
      setLoadingConfig(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadStudents();
    loadConfig();
  }, [loadStudents, loadConfig]);

  useEffect(() => {
    if (!selectedStudent) {
      setScorecardData(null);
      setHeatmapData({});
      return;
    }
    setLoadingScorecard(true);
    Promise.all([
      getAdminScorecardForStudent(selectedStudent.id),
      profileService
        .getUserActivityHeatmap(undefined, undefined, selectedStudent.id)
        .then((res) => res.heatmap_data ?? {})
        .catch(() => ({} as HeatmapData)),
    ])
      .then(([sc, hm]) => {
        setScorecardData(sc);
        setHeatmapData(hm);
      })
      .catch(() => {
        showToast("Failed to load scorecard", "error");
        setScorecardData(null);
        setHeatmapData({});
      })
      .finally(() => setLoadingScorecard(false));
  }, [selectedStudent, showToast]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(moduleOrder);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    setModuleOrder(items);
    setConfigDirty(true);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      // Persist what the admin actually intended:
      //   • empty array  → "show all sections" (one canonical encoding)
      //   • non-empty    → explicit allowlist in `moduleOrder` order
      // Previously we expanded the empty case to the full moduleOrder, which
      // made "show all" a one-way trip: after reload the array was length 12,
      // so toggling one off looked the same as before, but the UI could never
      // collapse back to the implicit "all" state.
      const toSave =
        enabledModules.length === 0
          ? []
          : moduleOrder.filter((id) => enabledModules.includes(id));
      await updateAdminScorecardConfig({ enabled_modules: toSave });
      setConfigDirty(false);
      showToast("Configuration saved", "success");
    } catch {
      showToast("Failed to save config", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleModule = (id: string) => {
    setConfigDirty(true);
    setEnabledModules((prev) => {
      if (prev.length === 0) return moduleOrder.filter((m) => m !== id);
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      return moduleOrder.filter((m) => prev.includes(m) || m === id);
    });
  };

  const enabledModulesSet = new Set(enabledModules);
  const showAllModules = enabledModules.length === 0;
  const displayOrder = showAllModules
    ? moduleOrder
    : moduleOrder.filter((id) => enabledModulesSet.has(id));

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Assessments"
        title="Scorecard"
        description="Track student performance and readiness scorecards."
        accent="emerald"
        icon="mdi:chart-box-outline"
        action={
          <HeaderActionButton
            icon="mdi:arrow-left"
            variant="ghost"
            onClick={() => router.push("/admin/dashboard")}
          >
            Back to Dashboard
          </HeaderActionButton>
        }
      />

      {/* Editorial KPI rail - hairline-divided cells */}
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          borderTop:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          borderBottom:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          bgcolor:
            "color-mix(in srgb, var(--card-bg) 70%, transparent)",
          backdropFilter: "blur(6px)",
          borderRadius: 0,
          mb: 4,
        }}
      >
        {[
          {
            key: "students",
            icon: "mdi:account-group",
            label: "Students",
            value: loadingStudents ? "-" : String(stats.students),
            accent: "var(--accent-indigo)",
          },
          {
            key: "sections",
            icon: "mdi:view-dashboard-outline",
            label: "Scorecard sections",
            value: String(stats.sectionTypes),
            accent: "#10b981",
          },
          {
            key: "modules",
            icon: "mdi:view-module",
            label: "Modules visible",
            value: loadingConfig ? "-" : String(stats.modulesEnabled),
            accent: "var(--accent-purple)",
          },
        ].map((stat, idx) => (
          <Box
            key={stat.key}
            component={motion.div}
            variants={statCardVariants}
            sx={{
              position: "relative",
              py: { xs: 2.5, md: 3 },
              px: { xs: 2, md: 3 },
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRight: {
                sm:
                  idx < 2
                    ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                    : "none",
              },
              borderBottom: {
                xs:
                  idx < 2
                    ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                    : "none",
                sm: "none",
              },
              backgroundImage: `linear-gradient(180deg, transparent 0%, color-mix(in srgb, ${stat.accent} 4%, transparent) 100%)`,
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: 36,
                height: 2,
                background: stat.accent,
              },
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                backgroundColor: `color-mix(in srgb, ${stat.accent} 14%, transparent)`,
              }}
            >
              <IconWrapper icon={stat.icon} size={22} color={stat.accent} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: "var(--font-primary)",
                  fontSize: { xs: "2rem", md: "2.4rem" },
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  mt: 0.5,
                }}
              >
                {stat.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ maxWidth: 1536, mx: "auto", width: "100%" }}>
        <AdminScorecardSubNav active={mainTab} onLocalTabChange={setMainTab} />

        {mainTab === "scorecard" && (
          <>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "var(--card-bg)",
                boxShadow:
                  "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ color: "primary.main" }}>
                  <IconWrapper icon="mdi:account-search" size={24} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Select Student
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                    Search by name or email to view their scorecard
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Autocomplete
                  options={students}
                  getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={selectedStudent}
                  onChange={(_, v) => setSelectedStudent(v)}
                  loading={loadingStudents}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {`${option.name} (${option.email})`}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name or email..."
                      size="medium"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconWrapper icon="mdi:magnify" size={22} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {loadingStudents ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        minWidth: 320,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "var(--surface)",
                          "&:hover": {
                            bgcolor:
                              "color-mix(in srgb, var(--surface) 88%, var(--card-bg) 12%)",
                          },
                        },
                      }}
                    />
                  )}
                  sx={{ flex: 1, minWidth: 280 }}
                />
                {selectedStudent && (
                  <Chip
                    icon={<IconWrapper icon="mdi:check-circle" size={16} />}
                    label={`Viewing: ${selectedStudent.name}`}
                    color="primary"
                    variant="outlined"
                    onDelete={() => setSelectedStudent(null)}
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
            </Paper>

            {!selectedStudent ? (
              <Paper
                component={motion.div}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                elevation={0}
                sx={{
                  p: 8,
                  textAlign: "center",
                  borderRadius: 2,
                  border: "2px dashed",
                  borderColor: "divider",
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                  }}
                >
                  <IconWrapper icon="mdi:chart-box-outline" size={40} />
                </Box>
                <Typography
                  component={motion.span}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  variant="h6"
                  sx={{ mt: 2, fontWeight: 600, display: "block" }}
                >
                  No student selected
                </Typography>
                <Typography
                  component={motion.span}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    mt: 1,
                    maxWidth: 360,
                    mx: "auto",
                    display: "block",
                  }}
                >
                  Use the search above to find and select a student. Their scorecard will appear here.
                </Typography>
              </Paper>
            ) : loadingScorecard ? (
              <Paper
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                elevation={0}
                sx={{
                  overflow: "hidden",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
                  }}
                >
                  <Skeleton variant="circular" width={48} height={48} animation="wave" sx={{ flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                      {selectedStudent.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <CircularProgress size={14} sx={{ color: "primary.main" }} />
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                        Loading scorecard data...
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton
                        key={i}
                        variant="rounded"
                        height={88}
                        animation="wave"
                        sx={{ flex: "1 1 140px", minWidth: 120, borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Skeleton variant="rounded" height={200} animation="wave" sx={{ borderRadius: 2, width: "100%" }} />
                    <Skeleton variant="rounded" height={200} animation="wave" sx={{ borderRadius: 2, width: "100%" }} />
                  </Box>
                </Box>
              </Paper>
            ) : scorecardData ? (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                data-scorecard-pdf-content
              >
                {displayOrder.map((sectionId) => {
                  switch (sectionId) {
                    case "overview":
                      return <StudentOverviewSection key={sectionId} data={scorecardData.overview} readOnly />;
                    case "activity_heatmap":
                      return (
                        <ActivityHeatmap
                          key={sectionId}
                          heatmapData={heatmapData}
                          subtitle="Learning activity this year"
                        />
                      );
                    case "learning_consumption":
                      return <LearningConsumptionSection key={sectionId} data={scorecardData.learningConsumption} />;
                    case "performance_trends":
                      if (!scorecardData.performanceTrends) return null;
                      return (
                        <PerformanceTrendsSection
                          key={sectionId}
                          initialData={scorecardData.performanceTrends}
                          readOnly
                        />
                      );
                    case "skill_scorecard":
                      return <SkillScorecardSection key={sectionId} data={scorecardData.skills ?? []} />;
                    case "weak_areas":
                      if (!scorecardData.weakAreas) return null;
                      return <WeakAreasSection key={sectionId} data={scorecardData.weakAreas} />;
                    case "assessment_performance":
                      if (!scorecardData.assessmentPerformance || scorecardData.assessmentPerformance.length === 0) return null;
                      return (
                        <AssessmentPerformanceSection
                          key={sectionId}
                          data={scorecardData.assessmentPerformance}
                        />
                      );
                    case "mock_interview":
                      if (!scorecardData.mockInterviewPerformance) return null;
                      return (
                        <MockInterviewSection
                          key={sectionId}
                          data={scorecardData.mockInterviewPerformance}
                        />
                      );
                    case "behavioral_metrics":
                      if (!scorecardData.behavioralMetrics) return null;
                      return (
                        <BehavioralMetricsSection
                          key={sectionId}
                          data={scorecardData.behavioralMetrics}
                        />
                      );
                    case "comparative_insights":
                      if (!scorecardData.comparativeInsights) return null;
                      return (
                        <ComparativeInsightsSection
                          key={sectionId}
                          data={scorecardData.comparativeInsights}
                        />
                      );
                    case "achievements":
                      if (!scorecardData.achievements) return null;
                      return (
                        <AchievementsSection
                          key={sectionId}
                          data={scorecardData.achievements}
                        />
                      );
                    case "action_panel":
                      if (!scorecardData.actionPanel) return null;
                      return (
                        <ActionPanelSection
                          key={sectionId}
                          data={scorecardData.actionPanel}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </Box>
            ) : (
              <Paper sx={{ p: 6, textAlign: "center", bgcolor: "var(--card-bg)", color: "var(--font-primary)" }}>
                <Typography color="error">Failed to load scorecard</Typography>
              </Paper>
            )}
          </>
        )}

        {mainTab === "config" && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: "66.666%", lg: "50%" },
              }}
            >
              <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "var(--card-bg)",
                    boxShadow:
                      "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      <IconWrapper icon="mdi:eye-settings" size={20} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Visible Modules
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                        Control which sections appear on student scorecards (overview, heatmap, learning consumption)
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mt: 2, mb: 1 }}>
                    Drag to reorder • Toggle to show/hide
                  </Typography>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="visible-modules">
                      {(provided) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                        >
                          {moduleOrder.map((id, index) => {
                            const opt = MODULE_OPTIONS.find((m) => m.id === id);
                            if (!opt) return null;
                            return (
                              <Draggable key={opt.id} draggableId={opt.id} index={index}>
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      p: 1.5,
                                      borderRadius: 1.5,
                                      border: "1px solid",
                                      borderColor: snapshot.isDragging ? "primary.main" : "divider",
                                      bgcolor: snapshot.isDragging
                                        ? (t) => alpha(t.palette.primary.main, 0.06)
                                        : "background.paper",
                                      boxShadow: snapshot.isDragging ? 2 : 0,
                                      transition: "all 0.2s",
                                      "&:hover": { bgcolor: "action.hover" },
                                    }}
                                  >
                                    <Box
                                      {...provided.dragHandleProps}
                                      sx={{
                                        cursor: "grab",
                                        color: "var(--font-secondary)",
                                        display: "flex",
                                        alignItems: "center",
                                        "&:active": { cursor: "grabbing" },
                                      }}
                                    >
                                      <IconWrapper icon="mdi:drag" size={20} />
                                    </Box>
                                    <Checkbox
                                      checked={showAllModules || enabledModulesSet.has(opt.id)}
                                      onChange={() => toggleModule(opt.id)}
                                      size="small"
                                      sx={{ py: 0.25 }}
                                    />
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                      {opt.label}
                                    </Typography>
                                  </Box>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                  {configDirty && (
                    <Button
                      variant="contained"
                      startIcon={
                        savingConfig ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <IconWrapper icon="mdi:content-save" size={18} />
                        )
                      }
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      sx={{ mt: 3, textTransform: "none", borderRadius: 2 }}
                    >
                      {savingConfig ? "Saving..." : "Save Module Settings"}
                    </Button>
                  )}
                </Paper>
            </Box>
          </Box>
        )}
      </Box>
    </PageShell>
  );
}
