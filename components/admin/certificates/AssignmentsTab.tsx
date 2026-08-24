"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { adminCertificatesService } from "@/lib/services/certificates.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import { adminAssessmentService } from "@/lib/services/admin/admin-assessment.service";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type {
  CertificateIssuer,
  CertificateRuleCriterion,
  CertificateRuleScope,
} from "@/lib/certificates/types";
import { CertificateRuleEditor, type PinnedRuleSpec } from "./CertificateRuleEditor";
import { buildTemplatePreviewPayload } from "./previewPayload";
import { EmptyState, Surface, certificateAdminKeys } from "./shared";

/**
 * Which design a course or an assessment awards, and on what criterion.
 *
 * The course list here is ADAPTIVE courses, and that is the whole point of this
 * tab. The screen it replaces listed legacy lms_core.Course rows, while every
 * course that actually carries certificate configuration lives in the adaptive
 * catalogue: admins configured certificates against courses no learner was
 * enrolled in, and nothing ever told them. If this list is ever repointed at
 * another course model, check first that the backend's `course_id` on a rule
 * means the same rows.
 *
 * The rule rows themselves are CertificateRuleEditor, the same component the
 * adaptive-course and assessment settings screens embed, rather than a second
 * implementation. Two reasons, both load-bearing:
 *
 * 1. PUT /rules/ is a bulk replace for one scope+object. Two independent
 *    writers, each sending "the rules I know about", is how a rule configured
 *    on one screen disappears when someone saves on the other. That editor
 *    carries the rules it does not display back into the payload.
 * 2. A pinned row does not own its percent. A course's completion threshold IS
 *    its `min_completion_percent`, and an assessment's bands ARE its pass-band
 *    fields. This tab reads those numbers and passes them down read-only, so an
 *    admin cannot type a threshold here that disagrees with the one the gate
 *    actually reads.
 */

export interface AssignmentsTabProps {
  clientId: string | number;
  issuer: CertificateIssuer;
  /** Deep link from the assessment hub or from a template card. */
  initialScope?: CertificateRuleScope;
  initialObjectId?: number | null;
}

/** A pass-band percent as a number, or null when the field is blank. Mirrors
 *  the parser on the assessment settings screen: a band that has not been set
 *  must block its rule rather than write a threshold of zero. */
function parseBandPercent(raw: string | number | undefined | null): number | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function AssignmentsTab({
  clientId,
  issuer,
  initialScope = "course",
  initialObjectId = null,
}: AssignmentsTabProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const labels = useCertificateArtworkLabels();

  const [scope, setScope] = useState<CertificateRuleScope>(initialScope);
  const [selectedId, setSelectedId] = useState<number | null>(initialObjectId);
  const [search, setSearch] = useState("");
  /** A read-only echo of the designs the editor holds, so the preview below
   *  repaints the moment one is picked without this tab owning rule state. */
  const [chosen, setChosen] = useState<Record<string, number | null>>({});
  const [lastTouched, setLastTouched] = useState<CertificateRuleCriterion | null>(null);

  /**
   * Follow a deep link without an effect.
   *
   * Adjusting state during render is React's own answer to "reset state when a
   * prop changes": the effect version renders the old selection once, then
   * re-renders with the new one, which for this tab means firing the rules
   * request for the previously selected object before abandoning it.
   */
  const linkKey = `${initialScope}:${initialObjectId ?? ""}`;
  const [appliedLink, setAppliedLink] = useState(linkKey);
  if (appliedLink !== linkKey) {
    setAppliedLink(linkKey);
    setScope(initialScope);
    setSelectedId(initialObjectId);
    setChosen({});
    setLastTouched(null);
  }

  const coursesQuery = useQuery({
    queryKey: certificateAdminKeys.adaptiveCourses(),
    queryFn: () => adminAdaptiveCourseService.listCourses(),
    staleTime: 5 * 60 * 1000,
  });
  const assessmentsQuery = useQuery({
    queryKey: certificateAdminKeys.assessments(clientId),
    queryFn: () => adminAssessmentService.getAssessments(clientId),
    staleTime: 5 * 60 * 1000,
  });
  const templatesQuery = useQuery({
    queryKey: certificateAdminKeys.templates(clientId),
    queryFn: () => adminCertificatesService.listTemplates(clientId),
  });

  const listLoading = scope === "course" ? coursesQuery.isLoading : assessmentsQuery.isLoading;
  const listError = scope === "course" ? coursesQuery.isError : assessmentsQuery.isError;

  const items = useMemo(() => {
    if (scope === "course") {
      return (coursesQuery.data ?? []).map((course) => ({
        id: course.id,
        primary: course.title,
        secondary: course.is_published
          ? t("certificatesUpload.coursePublished", "Published")
          : t("certificatesUpload.courseDraft", "Draft"),
        haystack: `${course.title} ${course.slug ?? ""}`.toLowerCase(),
      }));
    }
    return (assessmentsQuery.data ?? []).map((assessment) => ({
      id: assessment.id,
      primary: assessment.title,
      secondary: assessment.slug,
      haystack: `${assessment.title} ${assessment.slug}`.toLowerCase(),
    }));
  }, [scope, coursesQuery.data, assessmentsQuery.data, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.haystack.includes(q));
  }, [items, search]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  /* The thresholds the pinned rows fire at, read from wherever the gate reads
     them. Neither number is editable here: this tab decides which DESIGN is
     awarded, the settings screens decide at what percent. */
  const courseConfigQuery = useQuery({
    queryKey: ["certificates", "admin", "course-cert-config", selectedId],
    queryFn: () => adaptiveJourneyService.getCertificateConfig(selectedId as number),
    enabled: scope === "course" && selectedId != null,
    staleTime: 60 * 1000,
  });
  const assessmentDetailQuery = useQuery({
    queryKey: ["certificates", "admin", "assessment-detail", clientId, selectedId],
    queryFn: () => adminAssessmentService.getAssessmentById(clientId, selectedId as number),
    enabled: scope === "assessment" && selectedId != null,
    staleTime: 60 * 1000,
  });

  const pinned: PinnedRuleSpec[] = useMemo(() => {
    if (scope === "course") {
      return [
        {
          criterion: "completion",
          label: t("certificatesUpload.pinCompletion", "Course completion"),
          hint: t(
            "certificatesUpload.pinCompletionHint",
            "Fires at the minimum completion percent set on the course itself, so the two can never disagree.",
          ),
          threshold: courseConfigQuery.data?.min_completion_percent ?? null,
        },
      ];
    }
    const detail = assessmentDetailQuery.data;
    return [
      {
        criterion: "participation",
        label: t("certificatesUpload.tierParticipation", "Participation"),
        hint: t(
          "certificatesUpload.pinParticipationHint",
          "Fires from the assessment's lower pass band up to the upper one.",
        ),
        threshold: parseBandPercent(detail?.pass_band_lower_min_percent),
      },
      {
        criterion: "excellence",
        label: t("certificatesUpload.tierExcellence", "Excellence"),
        hint: t(
          "certificatesUpload.pinExcellenceHint",
          "Fires from the assessment's upper pass band up.",
        ),
        threshold: parseBandPercent(detail?.pass_band_upper_min_percent),
      },
    ];
  }, [scope, courseConfigQuery.data, assessmentDetailQuery.data, t]);

  const thresholdsLoading =
    scope === "course" ? courseConfigQuery.isLoading : assessmentDetailQuery.isLoading;
  const thresholdsMissing =
    selectedId != null && !thresholdsLoading && pinned.every((row) => row.threshold == null);

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  const previewContext = useMemo(
    () => ({
      subtitle: selected?.primary ?? "",
      source: {
        kind: scope === "course" ? ("adaptive_course" as const) : ("assessment" as const),
        id: selectedId,
        label: selected?.primary ?? "",
      },
    }),
    [selected, scope, selectedId],
  );

  const previewTemplateId =
    (lastTouched ? chosen[lastTouched] : undefined) ??
    Object.values(chosen).find((id) => id != null) ??
    null;
  const previewTemplate = templates.find((tpl) => tpl.id === previewTemplateId) ?? null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 340px) minmax(0, 1fr)" },
        gap: 2.5,
        alignItems: "start",
      }}
    >
      {/* ---------------- picker ---------------- */}
      <Surface padded={false} sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, pb: 1.5 }}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={scope}
            onChange={(_, v) => {
              if (!v) return;
              setScope(v as CertificateRuleScope);
              setSelectedId(null);
              setChosen({});
              setLastTouched(null);
            }}
            sx={{
              mb: 1.5,
              "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, borderRadius: 2 },
            }}
          >
            <ToggleButton value="course">
              <IconWrapper icon="mdi:school-outline" size={18} />
              <Box component="span" sx={{ ml: 0.75 }}>
                {t("certificatesUpload.scopeCourses", "Adaptive courses")}
              </Box>
            </ToggleButton>
            <ToggleButton value="assessment">
              <IconWrapper icon="mdi:clipboard-text-outline" size={18} />
              <Box component="span" sx={{ ml: 0.75 }}>
                {t("certificatesUpload.scopeAssessments", "Assessments")}
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              scope === "course"
                ? t("certificatesUpload.searchAdaptiveCourses", "Search adaptive courses")
                : t("certificatesUpload.searchAssessments", "Search assessments…")
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconWrapper icon="mdi:magnify" size={20} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 520, overflowY: "auto", px: 1.5, pb: 1.5 }}>
          {listLoading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" height={54} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          ) : listError ? (
            <EmptyState
              dense
              icon="mdi:cloud-alert-outline"
              title={t("certificatesUpload.listErrorTitle", "That list did not load")}
              body={t(
                "certificatesUpload.listErrorBody",
                "The catalogue service did not answer. Nothing has been changed, so retrying is safe.",
              )}
              action={
                <Button
                  onClick={() =>
                    scope === "course" ? coursesQuery.refetch() : assessmentsQuery.refetch()
                  }
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {t("common.retry", "Try again")}
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              dense
              icon={scope === "course" ? "mdi:book-off-outline" : "mdi:file-search-outline"}
              title={
                items.length === 0
                  ? scope === "course"
                    ? t("certificatesUpload.noCoursesTitle", "No adaptive courses yet")
                    : t("certificatesUpload.noAssessmentsTitle", "No assessments yet")
                  : t("certificatesUpload.noMatchTitle", "Nothing matches that")
              }
              body={
                items.length === 0
                  ? scope === "course"
                    ? t(
                        "certificatesUpload.noCoursesBody",
                        "Build a course in the adaptive catalogue and it appears here, ready to award a certificate.",
                      )
                    : t(
                        "certificatesUpload.noAssessmentsBody",
                        "Publish an assessment and it appears here, ready to award a certificate.",
                      )
                  : t("certificatesUpload.noMatchBodyShort", "Try a different search.")
              }
            />
          ) : (
            <List disablePadding>
              {filtered.map((item) => {
                const active = item.id === selectedId;
                return (
                  <ListItemButton
                    key={item.id}
                    selected={active}
                    onClick={() => {
                      setSelectedId(item.id);
                      setChosen({});
                      setLastTouched(null);
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      border: "1px solid",
                      borderColor: active ? alpha(theme.palette.warning.main, 0.5) : "transparent",
                      "&.Mui-selected": {
                        bgcolor: alpha(
                          theme.palette.warning.main,
                          theme.palette.mode === "dark" ? 0.16 : 0.08,
                        ),
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.primary}
                      secondary={item.secondary}
                      primaryTypographyProps={{
                        variant: "subtitle2",
                        fontWeight: 700,
                        sx: { lineHeight: 1.35 },
                      }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                    <IconWrapper icon="mdi:chevron-right" size={22} />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Surface>

      {/* ---------------- rule editor ---------------- */}
      {selected == null ? (
        <EmptyState
          icon="mdi:tune-variant"
          title={t("certificatesUpload.pickObjectTitle", "Pick a course or an assessment")}
          body={t(
            "certificatesUpload.pickObjectBody",
            "Each one can award a different design depending on how well a learner did. Choose one on the left to set which design each criterion awards, for example one certificate for finishing and a different one for scoring highly.",
          )}
        />
      ) : (
        <Stack spacing={2.5}>
          <Surface>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ sm: "center" }}
              sx={{ mb: 2 }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary" }}>
                  {scope === "course"
                    ? t("certificatesUpload.scopeCourses", "Adaptive courses")
                    : t("certificatesUpload.scopeAssessments", "Assessments")}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.3 }}>
                  {selected.primary}
                </Typography>
              </Box>
              <Chip
                size="small"
                variant="outlined"
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
                icon={<IconWrapper icon="mdi:identifier" size={15} />}
                label={`ID ${selected.id}`}
              />
            </Stack>

            {thresholdsLoading ? (
              <Stack spacing={1}>
                {[0, 1].map((i) => (
                  <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            ) : (
              <>
                {thresholdsMissing ? (
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    {scope === "course"
                      ? t(
                          "certificatesUpload.pinCourseUnset",
                          "This course has no minimum completion percent yet. Set one in the course's certificate settings and the completion row here starts awarding.",
                        )
                      : t(
                          "certificatesUpload.pinAssessmentUnset",
                          "This assessment has no pass bands yet. Set them in the assessment's settings and the bands here start awarding.",
                        )}
                  </Alert>
                ) : null}
                <CertificateRuleEditor
                  clientId={clientId}
                  scope={scope}
                  courseId={scope === "course" ? selected.id : null}
                  assessmentId={scope === "assessment" ? selected.id : null}
                  templates={templates}
                  templatesLoading={templatesQuery.isLoading}
                  previewContext={previewContext}
                  pinned={pinned}
                  allowCustomRows
                  dense
                  onTemplateChange={(criterion, templateId) => {
                    setChosen((prev) => ({ ...prev, [criterion]: templateId }));
                    setLastTouched(criterion);
                  }}
                  saveLabel={t("certificatesUpload.saveCriteria", "Save criteria")}
                />
              </>
            )}
          </Surface>

          {previewTemplate ? (
            <Surface>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <IconWrapper icon="mdi:eye-outline" size={18} />
                <Typography variant="subtitle2" fontWeight={800}>
                  {t("certificatesUpload.awardedPreview", "What a learner receives")}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Chip
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1.5, fontWeight: 700 }}
                  label={previewTemplate.name || previewTemplate.title}
                />
              </Stack>
              <Box sx={{ maxWidth: 760, mx: "auto" }}>
                <CertificatePreview
                  payload={buildTemplatePreviewPayload(previewTemplate, issuer, previewContext)}
                  labels={labels}
                />
              </Box>
            </Surface>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
