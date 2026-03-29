"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Autocomplete,
  TextField,
  Checkbox,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  InputAdornment,
  alpha,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  List,
  ListItem,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentService,
  Student,
} from "@/lib/services/admin/admin-student.service";
import {
  getAdminScorecardForStudent,
  getAdminScorecardConfig,
  updateAdminScorecardConfig,
  getAdminScorecardSkills,
  createAdminScorecardSkill,
  deleteAdminScorecardSkill,
  getAdminScorecardContentMapping,
  updateContentSkillMapping,
  type SkillItem,
  type ContentMappingItem,
} from "@/lib/services/admin/admin-scorecard.service";
import { profileService } from "@/lib/services/profile.service";
import { HeatmapData } from "@/lib/services/profile.service";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { ScorecardData } from "@/lib/types/scorecard.types";
import { StudentOverviewSection } from "@/components/scorecard/detailed/StudentOverviewSection";
import { LearningConsumptionSection } from "@/components/scorecard/detailed/LearningConsumptionSection";
import { PerformanceTrendsSection } from "@/components/scorecard/detailed/PerformanceTrendsSection";
import { SkillScorecardSection } from "@/components/scorecard/detailed/SkillScorecardSection";
import { WeakAreasSection, type WeakAreasSectionProps } from "@/components/scorecard/detailed/WeakAreasSection";
import { AssessmentPerformanceSection } from "@/components/scorecard/detailed/AssessmentPerformanceSection";
import { MockInterviewSection } from "@/components/scorecard/detailed/MockInterviewSection";
import { BehavioralMetricsSection } from "@/components/scorecard/detailed/BehavioralMetricsSection";
import { ComparativeInsightsSection } from "@/components/scorecard/detailed/ComparativeInsightsSection";
import { AchievementsSection } from "@/components/scorecard/detailed/AchievementsSection";
import { ActionPanelSection } from "@/components/scorecard/detailed/ActionPanelSection";
import { ContentSkillRow } from "@/components/admin/scorecard/ContentSkillRow";
import { buildAdminScorecardContentTree } from "@/lib/utils/admin-scorecard-content-tree";
// import { ExportShareSection } from "@/components/scorecard/detailed/ExportShareSection";

const MODULE_OPTIONS = [
  { id: "overview", label: "Student Overview" },
  { id: "activity_heatmap", label: "Activity Heatmap" },
  { id: "learning_consumption", label: "Learning Consumption" },
  { id: "performance_trends", label: "Performance Trends" },
  { id: "skill_scorecard", label: "Skill Scorecard" },
  { id: "weak_areas", label: "Weak Areas" },
  { id: "assessment_performance", label: "Assessment Performance" },
  { id: "mock_interview", label: "Mock Interview" },
  { id: "behavioral_metrics", label: "Behavioral Metrics" },
  { id: "comparative_insights", label: "Comparative Insights" },
  { id: "achievements", label: "Achievements" },
  { id: "action_panel", label: "Action Panel" },
  // { id: "export_share", label: "Export & Share" },
];

const CONTENT_TABS = [
  { id: "videos", label: "Videos", icon: "mdi:video" },
  { id: "articles", label: "Articles", icon: "mdi:file-document" },
  { id: "mcqs", label: "MCQs", icon: "mdi:format-list-checks" },
  { id: "coding_problems", label: "Coding", icon: "mdi:code-braces" },
  { id: "assessments", label: "Assessments", icon: "mdi:clipboard-check" },
] as const;

type ContentType = (typeof CONTENT_TABS)[number]["id"];

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
  const [moduleOrder, setModuleOrder] = useState<string[]>(() =>
    MODULE_OPTIONS.map((m) => m.id)
  );
  const [configDirty, setConfigDirty] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [contentMapping, setContentMapping] = useState<{
    videos: ContentMappingItem[];
    articles: ContentMappingItem[];
    mcqs: ContentMappingItem[];
    coding_problems: ContentMappingItem[];
    assessments: ContentMappingItem[];
  } | null>(null);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [updatingContentId, setUpdatingContentId] = useState<string | null>(null);
  const [contentSearchQuery, setContentSearchQuery] = useState("");
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [assignSkillModalOpen, setAssignSkillModalOpen] = useState(false);
  const [assignSkillId, setAssignSkillId] = useState<number | null>(null);
  const [assignSkillSelections, setAssignSkillSelections] = useState<Record<string, boolean>>({});
  const [applyingSkillAssignments, setApplyingSkillAssignments] = useState(false);
  const [assignModalSearch, setAssignModalSearch] = useState("");
  const [contentTab, setContentTab] = useState<"course" | "assessments">("course");
  const [assignModalContentTab, setAssignModalContentTab] = useState<"course" | "assessments">("course");
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  const stats = useMemo(
    () => ({
      students: students.length,
      skills: skills.length,
      modulesEnabled: enabledModules.length === 0 ? MODULE_OPTIONS.length : enabledModules.length,
    }),
    [students.length, skills.length, enabledModules.length]
  );

  const filteredSkills = useMemo(() => {
    if (!skillSearchQuery.trim()) return skills;
    const q = skillSearchQuery.toLowerCase().trim();
    return skills.filter((s) => s.name.toLowerCase().includes(q));
  }, [skills, skillSearchQuery]);

  const contentTree = useMemo(
    () => buildAdminScorecardContentTree(contentMapping, contentSearchQuery),
    [contentMapping, contentSearchQuery]
  );

  const assignModalContentTree = useMemo(
    () => buildAdminScorecardContentTree(contentMapping, assignModalSearch),
    [contentMapping, assignModalSearch]
  );

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await adminStudentService.getManageStudents({ limit: 200, page: 1 });
      setStudents(res.students);
    } catch (error) {
      console.error("Failed to load students:", error);
      showToast("Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }, [showToast]);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const config = await getAdminScorecardConfig();
      const loaded = config.enabled_modules || [];
      setEnabledModules(loaded);
      if (loaded.length > 0) {
        const ordered = [
          ...loaded,
          ...MODULE_OPTIONS.filter((m) => !loaded.includes(m.id)).map((m) => m.id),
        ];
        setModuleOrder(ordered);
      } else {
        setModuleOrder(MODULE_OPTIONS.map((m) => m.id));
      }
    } catch (error) {
      console.error("Failed to load scorecard config:", error);
      showToast("Failed to load config", "error");
    } finally {
      setLoadingConfig(false);
    }
  }, [showToast]);

  const loadSkills = useCallback(async () => {
    try {
      const data = await getAdminScorecardSkills();
      setSkills(data);
    } catch (error) {
      console.error("Failed to load skills:", error);
      showToast("Failed to load skills", "error");
    }
  }, [showToast]);

  const loadContentMapping = useCallback(async () => {
    setLoadingMapping(true);
    try {
      const data = await getAdminScorecardContentMapping();
      setContentMapping(data);
    } catch (error: unknown) {
      console.error("Failed to load content mapping:", error);
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        showToast(
          "Content mapping endpoint not found. Restart the Django server to load scorecard routes.",
          "error"
        );
      } else {
        showToast("Failed to load content mapping", "error");
      }
      setContentMapping({
        videos: [],
        articles: [],
        mcqs: [],
        coding_problems: [],
        assessments: [],
      });
    } finally {
      setLoadingMapping(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadStudents();
    loadConfig();
    loadSkills();
    loadContentMapping();
  }, [loadStudents, loadConfig, loadSkills, loadContentMapping]);

  useEffect(() => {
    if (!selectedStudent) {
      setScorecardData(null);
      setHeatmapData(null);
      return;
    }
    setLoadingScorecard(true);
    getAdminScorecardForStudent(selectedStudent.id)
      .then(setScorecardData)
      .catch((err) => {
        console.error("Failed to load scorecard:", err);
        showToast("Failed to load scorecard", "error");
        setScorecardData(null);
      })
      .finally(() => setLoadingScorecard(false));
    profileService.getUserActivityHeatmap(undefined, undefined, selectedStudent.id).then(setHeatmapData).catch(() => setHeatmapData(null));
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
    } catch (error) {
      console.error("Failed to save config:", error);
      showToast("Failed to save config", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const openAssignSkillModal = useCallback(
    (skillId: number) => {
      setAssignSkillId(skillId);
      const selections: Record<string, boolean> = {};
      if (contentMapping) {
        for (const [type, items] of Object.entries(contentMapping) as [ContentType, ContentMappingItem[]][]) {
          for (const item of items) {
            selections[`${type}-${item.id}`] = item.skill_ids.includes(skillId);
          }
        }
      }
      setAssignSkillSelections(selections);
      setAssignSkillModalOpen(true);
    },
    [contentMapping]
  );

  const closeAssignSkillModal = useCallback(() => {
    setAssignSkillModalOpen(false);
    setAssignSkillId(null);
    setAssignSkillSelections({});
    setAssignModalSearch("");
  }, []);

  const handleAddSkill = async () => {
    const name = newSkillName.trim();
    if (!name) return;
    setAddingSkill(true);
    try {
      const created = await createAdminScorecardSkill(name);
      setSkills((prev) => [...prev, created]);
      setNewSkillName("");
      showToast("Skill added. Select content to assign it to.", "success");
      openAssignSkillModal(created.id);
    } catch (error) {
      console.error("Failed to add skill:", error);
      showToast("Failed to add skill", "error");
    } finally {
      setAddingSkill(false);
    }
  };

  const handleApplySkillAssignments = async () => {
    if (assignSkillId == null || !contentMapping) return;
    setApplyingSkillAssignments(true);
    try {
      const updates: { type: ContentType; id: number; skillIds: number[] }[] = [];
      for (const [type, items] of Object.entries(contentMapping) as [ContentType, ContentMappingItem[]][]) {
        for (const item of items) {
          const key = `${type}-${item.id}`;
          const shouldHave = assignSkillSelections[key] ?? false;
          const currentHas = item.skill_ids.includes(assignSkillId);
          if (shouldHave !== currentHas) {
            const newSkillIds = shouldHave
              ? [...item.skill_ids, assignSkillId]
              : item.skill_ids.filter((id) => id !== assignSkillId);
            updates.push({ type, id: item.id, skillIds: newSkillIds });
          }
        }
      }
      for (const u of updates) {
        await updateContentSkillMapping(u.type, u.id, u.skillIds);
      }
      setContentMapping((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        for (const [type, items] of Object.entries(next) as [ContentType, ContentMappingItem[]][]) {
          (next as Record<string, ContentMappingItem[]>)[type] = items.map((item) => {
            const key = `${type}-${item.id}`;
            const shouldHave = assignSkillSelections[key] ?? false;
            const currentHas = item.skill_ids.includes(assignSkillId);
            if (shouldHave !== currentHas) {
              const newSkillIds = shouldHave
                ? [...item.skill_ids, assignSkillId]
                : item.skill_ids.filter((id) => id !== assignSkillId);
              return { ...item, skill_ids: newSkillIds };
            }
            return item;
          });
        }
        return next;
      });
      showToast(
        updates.length > 0 ? `Skill assigned to ${updates.length} content item(s)` : "No changes made",
        updates.length > 0 ? "success" : "info"
      );
      closeAssignSkillModal();
    } catch (error) {
      console.error("Failed to apply skill assignments:", error);
      showToast("Failed to apply skill assignments", "error");
    } finally {
      setApplyingSkillAssignments(false);
    }
  };

  const handleToggleAssignSelection = useCallback((key: string, checked: boolean) => {
    setAssignSkillSelections((prev) => ({ ...prev, [key]: checked }));
  }, []);

  const handleDeleteSkill = async (skillId: number): Promise<boolean> => {
    try {
      await deleteAdminScorecardSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      setContentMapping((prev) => {
        if (!prev) return prev;
        const removeSkillFromIds = (ids: number[]) => ids.filter((id) => id !== skillId);
        return {
          videos: prev.videos.map((v) => ({ ...v, skill_ids: removeSkillFromIds(v.skill_ids) })),
          articles: prev.articles.map((a) => ({ ...a, skill_ids: removeSkillFromIds(a.skill_ids) })),
          mcqs: prev.mcqs.map((m) => ({ ...m, skill_ids: removeSkillFromIds(m.skill_ids) })),
          coding_problems: prev.coding_problems.map((c) => ({ ...c, skill_ids: removeSkillFromIds(c.skill_ids) })),
          assessments: prev.assessments.map((a) => ({ ...a, skill_ids: removeSkillFromIds(a.skill_ids) })),
        };
      });
      showToast("Skill deleted", "success");
      return true;
    } catch (error) {
      console.error("Failed to delete skill:", error);
      showToast("Failed to delete skill", "error");
      return false;
    }
  };

  const handleUpdateContentSkills = async (
    contentType: ContentType,
    contentId: number,
    skillIds: number[]
  ) => {
    const key = `${contentType}-${contentId}`;
    setUpdatingContentId(key);
    try {
      await updateContentSkillMapping(contentType, contentId, skillIds);
      setContentMapping((prev) => {
        if (!prev) return prev;
        const list = prev[contentType];
        const updated = list.map((c) =>
          c.id === contentId ? { ...c, skill_ids: skillIds } : c
        );
        return { ...prev, [contentType]: updated };
      });
      showToast("Skills updated", "success");
    } catch (error) {
      console.error("Failed to update skills:", error);
      showToast("Failed to update skills", "error");
    } finally {
      setUpdatingContentId(null);
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
        {/* Hero header - full-width, breaks out of MainLayout padding */}
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
            {/* Header row - title left, Back right */}
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
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <IconWrapper icon="mdi:chart-box-outline" size={28} color="#fff" />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: "text.primary",
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
                      color: "text.secondary",
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
                  color: "text.primary",
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

            {/* Stats row - animated cards */}
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
                  gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  delay: 0,
                },
                {
                  key: "skills",
                  icon: "mdi:tag-multiple",
                  label: "Skills",
                  value: stats.skills,
                  gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  delay: 0.08,
                },
                {
                  key: "modules",
                  icon: "mdi:view-module",
                  label: "Modules visible",
                  value: loadingConfig ? "—" : stats.modulesEnabled,
                  gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
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
                    "&:hover": {
                      borderColor: "primary.main",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
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
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <IconWrapper icon={stat.icon} size={24} color="#fff" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Content area - full width, overlaps header with light background */}
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
            bgcolor: "#f8fafc",
            minHeight: "60vh",
          }}
        >
        <Box sx={{ maxWidth: 1536, mx: "auto", width: "100%" }}>
          {/* Main tabs */}
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
              bgcolor: "#fff",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
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
              {/* Student selector card */}
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
                  bgcolor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
                    <Typography variant="caption" color="text.secondary">
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
                            bgcolor: "grey.50",
                            "&:hover": { bgcolor: "grey.100" },
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

              {/* Scorecard content */}
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
                    color="text.secondary"
                    sx={{ mt: 1, maxWidth: 360, mx: "auto", display: "block" }}
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
                    bgcolor: "#fff",
                  }}
                >
                  {/* Loading header */}
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
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
                        {selectedStudent.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <CircularProgress size={14} sx={{ color: "primary.main" }} />
                        <Typography variant="caption" color="text.secondary">
                          Loading scorecard data...
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Skeleton layout mimicking scorecard structure */}
                  <Box sx={{ p: 3 }}>
                    {/* Overview stats row */}
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

                    {/* Main content blocks */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <Skeleton variant="rounded" height={200} animation="wave" sx={{ borderRadius: 2, width: "100%" }} />
                      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                        <Skeleton variant="rounded" height={280} animation="wave" sx={{ borderRadius: 2, flex: 1 }} />
                        <Skeleton variant="rounded" height={280} animation="wave" sx={{ borderRadius: 2, flex: 1 }} />
                      </Box>
                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            variant="rounded"
                            height={160}
                            animation="wave"
                            sx={{ flex: "1 1 200px", minWidth: 180, borderRadius: 2 }}
                          />
                        ))}
                      </Box>
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
                        return heatmapData ? (
                          <ActivityHeatmap key={sectionId} heatmapData={heatmapData} subtitle="Learning activity this year" />
                        ) : null;
                      case "learning_consumption":
                        return <LearningConsumptionSection key={sectionId} data={scorecardData.learningConsumption} />;
                      case "performance_trends":
                        return <PerformanceTrendsSection key={sectionId} initialData={scorecardData.performanceTrends} />;
                      case "skill_scorecard":
                        return <SkillScorecardSection key={sectionId} skills={scorecardData.skills} />;
                      case "weak_areas": {
                        const weakAreasProps: WeakAreasSectionProps = { data: scorecardData.weakAreas, readOnly: true };
                        return <WeakAreasSection key={sectionId} {...weakAreasProps} />;
                      }
                      case "assessment_performance":
                        return (
                          <AssessmentPerformanceSection
                            key={sectionId}
                            assessments={scorecardData.assessmentPerformance}
                            totalAssessmentsAvailable={scorecardData.learningConsumption?.practice?.totalAssessmentsPresent}
                          />
                        );
                      case "mock_interview":
                        return <MockInterviewSection key={sectionId} data={scorecardData.mockInterviewPerformance} readOnly />;
                      case "behavioral_metrics":
                        return <BehavioralMetricsSection key={sectionId} data={scorecardData.behavioralMetrics} />;
                      case "comparative_insights":
                        return <ComparativeInsightsSection key={sectionId} data={scorecardData.comparativeInsights} />;
                      case "achievements":
                        return <AchievementsSection key={sectionId} data={scorecardData.achievements} />;
                      case "action_panel":
                        return <ActionPanelSection key={sectionId} data={scorecardData.actionPanel} readOnly />;
                      // case "export_share":
                      //   return (
                      //     <Box key={sectionId} data-scorecard-pdf-exclude>
                      //       <ExportShareSection />
                      //     </Box>
                      //   );
                      default:
                        return null;
                    }
                  })}
                </Box>
              ) : (
                <Paper sx={{ p: 6, textAlign: "center" }}>
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
            <Grid container spacing={3}>
              {/* Module visibility */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
                      <Typography variant="caption" color="text.secondary">
                        Control which sections appear on student scorecards
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, mb: 1 }}>
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
                                        color: "text.secondary",
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
                      startIcon={savingConfig ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:content-save" size={18} />}
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      sx={{ mt: 3, textTransform: "none", borderRadius: 2 }}
                    >
                      {savingConfig ? "Saving..." : "Save Module Settings"}
                    </Button>
                  )}
                </Paper>
              </Grid>

              {/* Skills & content mapping */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    height: "100%",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      mb: 2.5,
                      pb: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.15)} 0%, ${alpha(t.palette.primary.main, 0.05)} 100%)`,
                          color: "primary.main",
                        }}
                      >
                        <IconWrapper icon="mdi:tag-multiple" size={24} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Skills & Content Mapping
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Add skills and assign them to content items
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${skills.length} skills`}
                      size="small"
                      sx={{ fontWeight: 600, bgcolor: (t) => alpha(t.palette.primary.main, 0.1) }}
                    />
                  </Box>

                  {/* Add skill */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
                      borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                      Add new skill
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <TextField
                        size="small"
                        placeholder="e.g. React, Data Structures, Communication"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                        sx={{
                          flex: 1,
                          minWidth: 200,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "background.paper",
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={addingSkill ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:plus" size={18} />}
                        onClick={handleAddSkill}
                        disabled={!newSkillName.trim() || addingSkill}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {addingSkill ? "Adding…" : "Add Skill"}
                      </Button>
                    </Box>
                  </Paper>

                  {/* Skills list */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Your skills
                      </Typography>
                      <TextField
                        size="small"
                        placeholder="Filter…"
                        value={skillSearchQuery}
                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                        sx={{ width: 140, "& .MuiOutlinedInput-root": { borderRadius: 2, height: 32 } }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ "& .MuiTypography-root": { fontSize: 14 } }}>
                              <IconWrapper icon="mdi:magnify" size={16} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "grey.50",
                        minHeight: 44,
                        alignItems: "center",
                      }}
                    >
                      {filteredSkills.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {skillSearchQuery ? "No skills match" : "No skills yet. Add one above."}
                        </Typography>
                      ) : (
                        filteredSkills.map((s) => (
                          <Tooltip key={s.id} title="Click to assign or remove from content" arrow>
                            <Chip
                              label={s.name}
                              size="small"
                              onClick={() => openAssignSkillModal(s.id)}
                              onDelete={() => openAssignSkillModal(s.id)}
                              deleteIcon={<IconWrapper icon="mdi:tag-remove" size={16} />}
                              sx={{
                                fontWeight: 500,
                                cursor: "pointer",
                                "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.12) },
                              }}
                            />
                          </Tooltip>
                        ))
                      )}
                    </Box>
                  </Box>

                  {/* Content search */}
                  <TextField
                    size="small"
                    placeholder="Search content by title…"
                    value={contentSearchQuery}
                    onChange={(e) => setContentSearchQuery(e.target.value)}
                    sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconWrapper icon="mdi:magnify" size={18} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Content tabs: Course Content | Assessments */}
                  <Tabs
                    value={contentTab}
                    onChange={(_, v: "course" | "assessments") => setContentTab(v)}
                    sx={{ mb: 2, minHeight: 36, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 36 }, "& .MuiTabs-indicator": { height: 2 } }}
                  >
                    <Tab value="course" label="Course Content" icon={<IconWrapper icon="mdi:book-open-page-variant" size={18} />} iconPosition="start" />
                    <Tab value="assessments" label="Assessments" icon={<IconWrapper icon="mdi:clipboard-check" size={18} />} iconPosition="start" />
                  </Tabs>

                  {/* Content tree: Course → Module → Submodule (or Assessments) */}
                  <Box sx={{ maxHeight: 480, overflowY: "auto", pr: 0.5 }}>
                    {loadingMapping ? (
                      <Box sx={{ py: 4 }}>
                        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2, mb: 1.5 }} />
                        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2, mb: 1.5 }} />
                        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
                      </Box>
                    ) : (() => {
                      const filteredTree = contentTree.filter((n) => (contentTab === "assessments" ? n.kind === "assessments" : n.kind === "course"));
                      return filteredTree.length === 0 ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          py: 6,
                          px: 3,
                          textAlign: "center",
                          borderRadius: 2,
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
                          borderStyle: "dashed",
                        }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 1.5,
                          }}
                        >
                          <IconWrapper icon="mdi:file-search-outline" size={32} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {contentSearchQuery ? `No content matches "${contentSearchQuery}"` : "No content found."}
                        </Typography>
                        {contentSearchQuery && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            Try a different search term
                          </Typography>
                        )}
                      </Paper>
                    ) : (
                      <Box sx={{ "& .MuiAccordion-root": { "&:before": { display: "none" }, boxShadow: "none" } }}>
                        {filteredTree.map((node, idx) =>
                          node.kind === "assessments" ? (
                            <Accordion key="assessments" defaultExpanded sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px !important", mb: 1, "&:last-of-type": { mb: 0 } }}>
                              <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={20} />} sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                                <IconWrapper icon="mdi:clipboard-check" size={20} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Assessments</Typography>
                                <Chip label={`${node.items.length} items`} size="small" sx={{ height: 20 }} />
                              </AccordionSummary>
                              <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  {node.items.map(({ type, id, item }) => (
                                    <ContentSkillRow
                                      key={`${type}-${id}`}
                                      item={item}
                                      skills={skills}
                                      contentType={type}
                                      updating={updatingContentId === `${type}-${id}`}
                                      onUpdate={(skillIds) => handleUpdateContentSkills(type, id, skillIds)}
                                      hideLocation
                                    />
                                  ))}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          ) : (
                            <Accordion key={node.courseName} defaultExpanded sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px !important", mb: 1, "&:last-of-type": { mb: 0 } }}>
                              <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={20} />} sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                                <IconWrapper icon="mdi:book-open-page-variant" size={20} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{node.courseName}</Typography>
                                <Chip label={`${node.modules.reduce((n, m) => n + m.submodules.reduce((s, sb) => s + sb.items.length, 0), 0)} items`} size="small" sx={{ height: 20 }} />
                              </AccordionSummary>
                              <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                                {node.modules.map((mod) => (
                                  <Accordion key={`${node.courseName}-${mod.moduleTitle}`} sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                                    <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={18} />} sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                                      <IconWrapper icon="mdi:folder-outline" size={18} />
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{mod.moduleTitle}</Typography>
                                      <Chip label={`${mod.submodules.reduce((n, s) => n + s.items.length, 0)}`} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0, pl: 3 }}>
                                      {mod.submodules.map((sub) => (
                                        <Box key={`${node.courseName}-${mod.moduleTitle}-${sub.submoduleTitle}`} sx={{ mb: 1.5 }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                                            {sub.submoduleTitle}
                                          </Typography>
                                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                            {sub.items.map(({ type, id, item }) => (
                                              <ContentSkillRow
                                                key={`${type}-${id}`}
                                                item={item}
                                                skills={skills}
                                                contentType={type}
                                                updating={updatingContentId === `${type}-${id}`}
                                                onUpdate={(skillIds) => handleUpdateContentSkills(type, id, skillIds)}
                                                hideLocation
                                              />
                                            ))}
                                          </Box>
                                        </Box>
                                      ))}
                                    </AccordionDetails>
                                  </Accordion>
                                ))}
                              </AccordionDetails>
                            </Accordion>
                          )
                        )}
                      </Box>
                    );
                    })()}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            </Box>
          )}
        </Box>
        </Box>
      </Box>

      <Dialog
        open={assignSkillModalOpen}
        onClose={closeAssignSkillModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <IconWrapper icon="mdi:tag-plus" size={24} />
          Assign skill to content
          {assignSkillId != null && (
            <Chip label={skills.find((s) => s.id === assignSkillId)?.name ?? "—"} size="small" color="primary" sx={{ ml: 1 }} />
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Check items to add this skill, uncheck to remove. Only changed items are updated. Use &quot;Delete skill&quot; to remove the skill from the system entirely.
          </Typography>
          <TextField
            size="small"
            placeholder="Search content…"
            value={assignModalSearch}
            onChange={(e) => setAssignModalSearch(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={18} />
                </InputAdornment>
              ),
            }}
          />
          {assignSkillId != null && contentMapping && (
            <>
              <Tabs
                value={assignModalContentTab}
                onChange={(_, v: "course" | "assessments") => setAssignModalContentTab(v)}
                sx={{ mb: 2, minHeight: 36, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 36 }, "& .MuiTabs-indicator": { height: 2 } }}
              >
                <Tab value="course" label="Course Content" icon={<IconWrapper icon="mdi:book-open-page-variant" size={18} />} iconPosition="start" />
                <Tab value="assessments" label="Assessments" icon={<IconWrapper icon="mdi:clipboard-check" size={18} />} iconPosition="start" />
              </Tabs>
              <Box sx={{ maxHeight: 420, overflowY: "auto", "& .MuiAccordion-root": { "&:before": { display: "none" }, boxShadow: "none" } }}>
                {(() => {
                  const filteredModalTree = assignModalContentTree.filter((n) => (assignModalContentTab === "assessments" ? n.kind === "assessments" : n.kind === "course"));
                  return filteredModalTree.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  {assignModalSearch ? `No content matches "${assignModalSearch}"` : "No content found."}
                </Typography>
              ) : (
                filteredModalTree.map((node) =>
                  node.kind === "assessments" ? (
                    (() => {
                      const selectionKeys = node.items.map(({ type, id }) => `assessments-${id}`);
                      const handleSelectAll = () => {
                        setAssignSkillSelections((prev) => {
                          const next = { ...prev };
                          for (const k of selectionKeys) next[k] = true;
                          return next;
                        });
                      };
                      const handleClear = () => {
                        setAssignSkillSelections((prev) => {
                          const next = { ...prev };
                          for (const k of selectionKeys) next[k] = false;
                          return next;
                        });
                      };
                      return (
                        <Accordion key="assessments" defaultExpanded sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px !important", mb: 1, "&:last-of-type": { mb: 0 } }}>
                          <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={20} />} sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                            <IconWrapper icon="mdi:clipboard-check" size={20} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Assessments</Typography>
                            <Chip label={`${node.items.length} items`} size="small" sx={{ height: 20 }} />
                            <Box sx={{ flex: 1 }} />
                            <Box component="span" onClick={(e) => { e.stopPropagation(); handleSelectAll(); }} sx={{ cursor: "pointer", color: "primary.main", fontWeight: 600, fontSize: "0.75rem", "&:hover": { textDecoration: "underline" } }}>
                              Select all
                            </Box>
                            <Box component="span" onClick={(e) => { e.stopPropagation(); handleClear(); }} sx={{ cursor: "pointer", color: "text.secondary", fontSize: "0.75rem", "&:hover": { textDecoration: "underline" } }}>
                              Clear
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                            <List dense sx={{ py: 0 }}>
                              {node.items.map(({ type, id, item }, idx) => {
                                const selKey = `assessments-${id}`;
                                const checked = assignSkillSelections[selKey] ?? false;
                                const typeIcon = CONTENT_TABS.find((t) => t.id === type)?.icon ?? "mdi:file";
                                return (
                                  <ListItem key={`assign-assessments-${id}-${idx}`} sx={{ py: 0.25, px: 0 }}>
                                    <FormControlLabel
                                      control={<Checkbox size="small" checked={checked} onChange={(_, c) => handleToggleAssignSelection(selKey, c)} />}
                                      label={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                          <IconWrapper icon={typeIcon} size={16} />
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.title.length > 60 ? `${item.title.slice(0, 60)}…` : item.title}</Typography>
                                        </Box>
                                      }
                                      sx={{ alignItems: "flex-start", mr: 0 }}
                                    />
                                  </ListItem>
                                );
                              })}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })()
                  ) : (
                    (() => {
                      const courseSelectionKeys = node.modules.flatMap((m) =>
                        m.submodules.flatMap((s) => s.items.map(({ type, id }) => `${type}-${id}`))
                      );
                      const handleCourseSelectAll = () => {
                        setAssignSkillSelections((prev) => {
                          const next = { ...prev };
                          for (const k of courseSelectionKeys) next[k] = true;
                          return next;
                        });
                      };
                      const handleCourseClear = () => {
                        setAssignSkillSelections((prev) => {
                          const next = { ...prev };
                          for (const k of courseSelectionKeys) next[k] = false;
                          return next;
                        });
                      };
                      return (
                        <Accordion key={node.courseName} defaultExpanded sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px !important", mb: 1, "&:last-of-type": { mb: 0 } }}>
                          <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={20} />} sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                            <IconWrapper icon="mdi:book-open-page-variant" size={20} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{node.courseName}</Typography>
                            <Chip label={`${courseSelectionKeys.length} items`} size="small" sx={{ height: 20 }} />
                            <Box sx={{ flex: 1 }} />
                            <Box component="span" onClick={(e) => { e.stopPropagation(); handleCourseSelectAll(); }} sx={{ cursor: "pointer", color: "primary.main", fontWeight: 600, fontSize: "0.75rem", "&:hover": { textDecoration: "underline" } }}>
                              Select all
                            </Box>
                            <Box component="span" onClick={(e) => { e.stopPropagation(); handleCourseClear(); }} sx={{ cursor: "pointer", color: "text.secondary", fontSize: "0.75rem", "&:hover": { textDecoration: "underline" } }}>
                              Clear
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                            {node.modules.map((mod) => (
                          <Accordion key={`${node.courseName}-${mod.moduleTitle}`} sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
                            <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={18} />} sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}>
                              <IconWrapper icon="mdi:folder-outline" size={18} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{mod.moduleTitle}</Typography>
                              <Chip label={`${mod.submodules.reduce((n, s) => n + s.items.length, 0)}`} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0, pl: 3 }}>
                              {mod.submodules.map((sub) => (
                                <Box key={`${node.courseName}-${mod.moduleTitle}-${sub.submoduleTitle}`} sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                                    {sub.submoduleTitle}
                                  </Typography>
                                  <List dense sx={{ py: 0 }}>
                                    {sub.items.map(({ type, id, item }, idx) => {
                                      const selKey = `${type}-${id}`;
                                      const checked = assignSkillSelections[selKey] ?? false;
                                      const typeIcon = CONTENT_TABS.find((t) => t.id === type)?.icon ?? "mdi:file";
                                      return (
                                        <ListItem key={`assign-${type}-${id}-${idx}`} sx={{ py: 0.25, px: 0 }}>
                                          <FormControlLabel
                                            control={
                                              <Checkbox
                                                size="small"
                                                checked={checked}
                                                onChange={(_, c) => handleToggleAssignSelection(selKey, c)}
                                              />
                                            }
                                            label={
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                                <IconWrapper icon={typeIcon} size={16} />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                  {item.title.length > 60 ? `${item.title.slice(0, 60)}…` : item.title}
                                                </Typography>
                                              </Box>
                                            }
                                            sx={{ alignItems: "flex-start", mr: 0 }}
                                          />
                                        </ListItem>
                                      );
                                    })}
                                  </List>
                                </Box>
                              ))}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  );
                })()
              ))
            );
            })()}
            </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
          <Button onClick={closeAssignSkillModal} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            color="error"
            onClick={async () => {
              if (assignSkillId == null || applyingSkillAssignments) return;
              if (typeof window !== "undefined" && !window.confirm("Delete this skill from the system? It will be removed from all content.")) return;
              const ok = await handleDeleteSkill(assignSkillId);
              if (ok) closeAssignSkillModal();
            }}
            disabled={applyingSkillAssignments || assignSkillId == null}
            startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
            sx={{ textTransform: "none" }}
          >
            Delete skill
          </Button>
          <Button
            variant="contained"
            onClick={handleApplySkillAssignments}
            disabled={applyingSkillAssignments || assignSkillId == null}
            startIcon={applyingSkillAssignments ? <CircularProgress size={16} color="inherit" /> : <IconWrapper icon="mdi:check" size={18} />}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {applyingSkillAssignments ? "Applying…" : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
