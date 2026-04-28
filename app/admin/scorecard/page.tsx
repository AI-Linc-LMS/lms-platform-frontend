"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { MainLayout } from "@/components/layout/MainLayout";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
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
] as const;

const ALLOWED_MODULE_IDS: string[] = MODULE_OPTIONS.map((m) => m.id);

const headerFadeIn = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

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
  const { showToast } = useToast();
  const [mainTab, setMainTab] = useState<"scorecard" | "config">("scorecard");
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
      const res = await adminStudentService.getManageStudents({ limit: 200, page: 1 });
      setStudents(res.students);
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
      const toSave =
        enabledModules.length === 0
          ? moduleOrder
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
    <MainLayout>
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          position: "relative",
          pb: 6,
        }}
      >
        <Box
          sx={{
            position: "relative",
            marginLeft: { xs: -2, sm: -3, md: -4 },
            marginRight: { xs: -2, sm: -3, md: -4 },
            width: { xs: "calc(100% + 32px)", sm: "calc(100% + 48px)", md: "calc(100% + 64px)" },
            pt: { xs: 2, md: 3 },
            pb: { xs: 8, md: 10 },
            px: { xs: 2, sm: 3, md: 4 },
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              maxWidth: 1536,
              mx: "auto",
              width: "100%",
            }}
          >
            <Box
              component={motion.div}
              variants={headerFadeIn}
              initial="initial"
              animate="animate"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                component={motion.div}
                variants={headerFadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.05 }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "0 4px 12px color-mix(in srgb, var(--font-primary) 16%, transparent)",
                  }}
                >
                  <IconWrapper icon="mdi:chart-box-outline" size={28} color="var(--font-light)" />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: "var(--font-primary)",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.2,
                      }}
                    >
                      Scorecard Admin
                    </Typography>
                    <Chip
                      label="Admin"
                      size="small"
                      color="primary"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--font-secondary)",
                      mt: 0.5,
                      fontWeight: 400,
                    }}
                  >
                    View student scorecards and configure visible modules
                  </Typography>
                </Box>
              </Box>
              <Button
                component={motion.button}
                whileHover={{ x: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                variant="text"
                startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
                onClick={() => router.push("/admin/dashboard")}
                sx={{
                  color: "var(--font-primary)",
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                Back
              </Button>
            </Box>

            <Box
              component={motion.div}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  key: "students",
                  icon: "mdi:account-group",
                  label: "Students",
                  value: loadingStudents ? "—" : stats.students,
                  gradient:
                    "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                  delay: 0,
                },
                {
                  key: "sections",
                  icon: "mdi:view-dashboard-outline",
                  label: "Scorecard sections",
                  value: stats.sectionTypes,
                  gradient:
                    "linear-gradient(135deg, var(--success-500) 0%, color-mix(in srgb, var(--success-500) 82%, var(--accent-indigo-dark)) 100%)",
                  delay: 0.08,
                },
                {
                  key: "modules",
                  icon: "mdi:view-module",
                  label: "Modules visible",
                  value: loadingConfig ? "—" : stats.modulesEnabled,
                  gradient:
                    "linear-gradient(135deg, var(--accent-purple) 0%, color-mix(in srgb, var(--accent-purple) 82%, var(--accent-indigo-dark)) 100%)",
                  delay: 0.16,
                },
              ].map((stat) => (
                <Paper
                  key={stat.key}
                  component={motion.div}
                  variants={statCardVariants}
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    minWidth: 140,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    color: "var(--font-primary)",
                    "&:hover": {
                      borderColor: "primary.main",
                      transform: "translateY(-2px)",
                      boxShadow:
                        "0 8px 24px color-mix(in srgb, var(--font-primary) 18%, transparent)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      background: stat.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow:
                        "0 4px 12px color-mix(in srgb, var(--font-primary) 20%, transparent)",
                    }}
                  >
                    <IconWrapper icon={stat.icon} size={24} color="var(--font-light)" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary)", lineHeight: 1.2 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            mt: -5,
            pt: 1,
            pb: 6,
            marginLeft: { xs: -2, sm: -3, md: -4 },
            marginRight: { xs: -2, sm: -3, md: -4 },
            width: { xs: "calc(100% + 32px)", sm: "calc(100% + 48px)", md: "calc(100% + 64px)" },
            px: { xs: 2, sm: 3, md: 4 },
            bgcolor: "var(--background)",
            minHeight: "60vh",
          }}
        >
          <Box sx={{ maxWidth: 1536, mx: "auto", width: "100%" }}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "var(--card-bg)",
                overflow: "hidden",
                boxShadow:
                  "0 4px 24px color-mix(in srgb, var(--font-primary) 14%, transparent)",
              }}
            >
              <Tabs
                value={mainTab}
                onChange={(_, v) => setMainTab(v)}
                sx={{
                  px: 1,
                  "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 56 },
                  "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
                  "& .MuiTabs-flexContainer": { gap: 0 },
                }}
              >
                <Tab
                  value="scorecard"
                  label="Student Scorecard"
                  icon={<IconWrapper icon="mdi:chart-box-outline" size={20} />}
                  iconPosition="start"
                />
                <Tab
                  value="config"
                  label="Configuration"
                  icon={<IconWrapper icon="mdi:cog-outline" size={20} />}
                  iconPosition="start"
                />
              </Tabs>
            </Paper>

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
                      value={selectedStudent}
                      onChange={(_, v) => setSelectedStudent(v)}
                      loading={loadingStudents}
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
        </Box>
      </Box>
    </MainLayout>
  );
}
