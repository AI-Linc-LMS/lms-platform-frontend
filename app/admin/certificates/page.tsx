"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Typography,
  Paper,
  TextField,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  CircularProgress,
  InputAdornment,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { config } from "@/lib/config";
import { adminAssessmentService } from "@/lib/services/admin/admin-assessment.service";
import type { Assessment } from "@/lib/services/admin/admin-assessment.service";
import { adminCourseBuilderService } from "@/lib/services/admin/admin-course-builder.service";
import type { Course } from "@/components/admin/course-builder/CourseCard";

function SectionCard(props: {
  title: string;
  hint: string;
  icon: string;
  accent: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.55 : 1),
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 24px 48px -16px ${alpha("#000", 0.4)}`
            : `0 20px 42px -28px ${alpha("#0f172a", 0.18)}`,
        display: "flex",
        flexDirection: "column",
        minHeight: 420,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: `linear-gradient(135deg, ${alpha(props.accent, theme.palette.mode === "dark" ? 0.35 : 0.14)} 0%, ${alpha(
            props.accent,
            theme.palette.mode === "dark" ? 0.12 : 0.04,
          )} 100%)`,
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.6),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: alpha(props.accent, theme.palette.mode === "dark" ? 0.45 : 0.2),
              color: props.accent,
              width: 48,
              height: 48,
            }}
          >
            <IconWrapper icon={props.icon} size={26} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
              {props.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
              {props.hint}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>{props.children}</Box>
    </Paper>
  );
}

export default function AdminCertificatesHubPage() {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const { showToast } = useToast();
  const { clientInfo, loading: loadingClient } = useClientInfo();

  const enabledNames = useMemo(
    () => new Set(clientInfo?.features?.map((f) => f.name) ?? []),
    [clientInfo?.features],
  );
  const adminFeatures = useMemo(
    () => [...enabledNames].filter((n) => n.startsWith("admin_")),
    [enabledNames],
  );
  const relaxedFeatures = adminFeatures.length === 0;
  const showAssessments =
    relaxedFeatures || enabledNames.has("admin_assessment");
  const showCourses =
    relaxedFeatures || enabledNames.has("admin_course_builder");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingA, setLoadingA] = useState(showAssessments);
  const [loadingC, setLoadingC] = useState(showCourses);
  const [qAssessment, setQAssessment] = useState("");
  const [qCourse, setQCourse] = useState("");

  useEffect(() => {
    if (!showAssessments) {
      setLoadingA(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingA(true);
        const data = await adminAssessmentService.getAssessments(config.clientId);
        if (!cancelled) setAssessments(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) {
          showToast(
            e instanceof Error ? e.message : t("certificatesUpload.loadAssessmentsError"),
            "error",
          );
          setAssessments([]);
        }
      } finally {
        if (!cancelled) setLoadingA(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAssessments, showToast, t]);

  useEffect(() => {
    if (!showCourses) {
      setLoadingC(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingC(true);
        const data = await adminCourseBuilderService.getCourses();
        if (!cancelled) setCourses(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) {
          showToast(
            e instanceof Error ? e.message : t("certificatesUpload.loadCoursesError"),
            "error",
          );
          setCourses([]);
        }
      } finally {
        if (!cancelled) setLoadingC(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCourses, showToast, t]);

  const filteredAssessments = useMemo(() => {
    const q = qAssessment.trim().toLowerCase();
    if (!q) return assessments;
    return assessments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q),
    );
  }, [assessments, qAssessment]);

  const filteredCourses = useMemo(() => {
    const q = qCourse.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [courses, qCourse]);

  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary?.main ?? "#0d9488";

  if (loadingClient) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            minHeight: "50vh",
          }}
        >
          <CircularProgress size={36} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t("certificatesUpload.loadingWorkspace")}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  if (!showAssessments && !showCourses) {
    return (
      <MainLayout>
        <Box
          sx={{
            p: 4,
            maxWidth: 560,
            mx: "auto",
            mt: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                mx: "auto",
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: "warning.main",
              }}
            >
              <IconWrapper icon="mdi:lock-outline" size={36} />
            </Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t("certificatesUpload.noAccessTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("certificatesUpload.noAccess")}
            </Typography>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ pb: 6 }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(primary, theme.palette.mode === "dark" ? 0.22 : 0.1)} 0%, ${alpha(
              secondary,
              theme.palette.mode === "dark" ? 0.18 : 0.07,
            )} 55%, ${alpha(theme.palette.background.default, 1)} 100%)`,
            borderBottom: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.5),
            mb: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, md: 5 } }}>
            <Chip
              size="small"
              label={t("certificatesUpload.heroBadge")}
              sx={{
                mb: 2,
                fontWeight: 600,
                bgcolor: alpha(primary, 0.15),
                color: primary,
                border: "none",
              }}
            />
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                mb: 1.5,
                lineHeight: 1.15,
              }}
            >
              {t("certificatesUpload.hubTitle")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 640, lineHeight: 1.7, fontSize: "1.05rem" }}
            >
              {t("certificatesUpload.hubSubtitle")}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 3 }}>
              {showAssessments ? (
                <Chip
                  variant="outlined"
                  icon={<IconWrapper icon="mdi:file-document-edit" size={18} />}
                  label={
                    loadingA
                      ? t("certificatesUpload.countLoading")
                      : `${assessments.length} ${t("certificatesUpload.assessmentSection")}`
                  }
                  sx={{ fontWeight: 600, borderRadius: 2, py: 2.5, px: 0.5 }}
                />
              ) : null}
              {showCourses ? (
                <Chip
                  variant="outlined"
                  icon={<IconWrapper icon="mdi:book-open-variant" size={18} />}
                  label={
                    loadingC
                      ? t("certificatesUpload.countLoading")
                      : `${courses.length} ${t("certificatesUpload.courseSection")}`
                  }
                  sx={{ fontWeight: 600, borderRadius: 2, py: 2.5, px: 0.5 }}
                />
              ) : null}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            px: { xs: 2, sm: 3 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          {showAssessments ? (
            <SectionCard
              title={t("certificatesUpload.assessmentSection")}
              hint={t("certificatesUpload.cardHintAssessments")}
              icon="mdi:certificate-outline"
              accent={primary}
            >
              <TextField
                size="small"
                fullWidth
                placeholder={t("certificatesUpload.searchAssessments")}
                value={qAssessment}
                onChange={(e) => setQAssessment(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconWrapper icon="mdi:magnify" size={20} color="#64748b" />
                    </InputAdornment>
                  ),
                }}
              />
              {loadingA ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary">
                    {t("certificatesUpload.loadingList")}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ flex: 1, maxHeight: 380, overflow: "auto", mr: -0.5, pr: 0.5 }}>
                  {filteredAssessments.map((a) => (
                    <ListItemButton
                      key={a.id}
                      component={Link}
                      href={`/admin/certificates/assessment/${encodeURIComponent(a.slug)}`}
                      sx={{
                        borderRadius: 2,
                        mb: 0.75,
                        py: 1.25,
                        border: "1px solid",
                        borderColor: "transparent",
                        transition: theme.transitions.create(["background-color", "border-color", "transform"]),
                        "&:hover": {
                          bgcolor: alpha(primary, theme.palette.mode === "dark" ? 0.12 : 0.06),
                          borderColor: alpha(primary, 0.25),
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(primary, theme.palette.mode === "dark" ? 0.3 : 0.12),
                            color: primary,
                          }}
                        >
                          <IconWrapper icon="mdi:clipboard-text-outline" size={22} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={a.title}
                        secondary={a.slug}
                        primaryTypographyProps={{
                          variant: "subtitle2",
                          fontWeight: 700,
                          sx: { lineHeight: 1.35 },
                        }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          sx: {
                            fontFamily: "ui-monospace, monospace",
                            color: "text.secondary",
                          },
                        }}
                      />
                      <IconWrapper icon="mdi:chevron-right" size={24} color="#94a3b8" />
                    </ListItemButton>
                  ))}
                  {filteredAssessments.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 4,
                        borderRadius: 2,
                        textAlign: "center",
                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                      }}
                    >
                      <Box sx={{ mb: 1, opacity: 0.55 }}>
                        <IconWrapper icon="mdi:file-search-outline" size={40} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t("certificatesUpload.emptyAssessments")}
                      </Typography>
                    </Paper>
                  ) : null}
                </List>
              )}
            </SectionCard>
          ) : null}

          {showCourses ? (
            <SectionCard
              title={t("certificatesUpload.courseSection")}
              hint={t("certificatesUpload.cardHintCourses")}
              icon="mdi:book-plus-outline"
              accent={secondary}
            >
              <TextField
                size="small"
                fullWidth
                placeholder={t("certificatesUpload.searchCourses")}
                value={qCourse}
                onChange={(e) => setQCourse(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconWrapper icon="mdi:magnify" size={20} color="#64748b" />
                    </InputAdornment>
                  ),
                }}
              />
              {loadingC ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary">
                    {t("certificatesUpload.loadingList")}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ flex: 1, maxHeight: 380, overflow: "auto", mr: -0.5, pr: 0.5 }}>
                  {filteredCourses.map((c) => (
                    <ListItemButton
                      key={c.id}
                      component={Link}
                      href={`/admin/certificates/course/${c.id}`}
                      sx={{
                        borderRadius: 2,
                        mb: 0.75,
                        py: 1.25,
                        border: "1px solid",
                        borderColor: "transparent",
                        transition: theme.transitions.create(["background-color", "border-color", "transform"]),
                        "&:hover": {
                          bgcolor: alpha(secondary, theme.palette.mode === "dark" ? 0.12 : 0.06),
                          borderColor: alpha(secondary, 0.25),
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(secondary, theme.palette.mode === "dark" ? 0.3 : 0.12),
                            color: secondary,
                          }}
                        >
                          <IconWrapper icon="mdi:school-outline" size={22} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={c.title}
                        secondary={`ID · ${c.id}`}
                        primaryTypographyProps={{
                          variant: "subtitle2",
                          fontWeight: 700,
                          sx: { lineHeight: 1.35 },
                        }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          sx: {
                            fontFamily: "ui-monospace, monospace",
                            color: "text.secondary",
                          },
                        }}
                      />
                      <IconWrapper icon="mdi:chevron-right" size={24} color="#94a3b8" />
                    </ListItemButton>
                  ))}
                  {filteredCourses.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 4,
                        borderRadius: 2,
                        textAlign: "center",
                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                      }}
                    >
                      <Box sx={{ mb: 1, opacity: 0.55 }}>
                        <IconWrapper icon="mdi:book-off-outline" size={40} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t("certificatesUpload.emptyCourses")}
                      </Typography>
                    </Paper>
                  ) : null}
                </List>
              )}
            </SectionCard>
          ) : null}
        </Box>
      </Box>
    </MainLayout>
  );
}
