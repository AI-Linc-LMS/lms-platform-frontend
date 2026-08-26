"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@/components/common/LoadingButton";
import { CertificateRuleEditor } from "@/components/admin/certificates/CertificateRuleEditor";
import { useCertificateTemplates } from "@/components/admin/certificates/TemplatePickerField";
import {
  buildTemplatePreviewPayload,
  useCertificateIssuer,
} from "@/components/admin/certificates/previewPayload";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import { useCertificateArtworkLabels } from "@/components/certificate/CertificateArtwork";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { CertificateRuleCriterion } from "@/lib/certificates/types";
import type { AdminCertificateConfig } from "@/lib/types/adaptive-journey";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { CERT_BADGE_GRADIENT } from "@/lib/certificates/ui-tokens";

/**
 * This page's own gradient, used for both its section tiles and its primary
 * actions by CalibrationAdminSection, MockInterviewAdminSection, CourseStudentsPanel
 * and the page header itself. The certificate panels below take the certificate
 * identity for their tiles; the course-config save stays with the host's.
 */
const INDIGO_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)";

/**
 * The card the rest of this page uses, value for value: CalibrationAdminSection,
 * CohortScheduleSection and MockInterviewAdminSection all render a solid
 * `var(--card-bg)` panel on a solid `var(--border-default)` hairline at radius 3.
 * The previous version faded both through `color-mix(... transparent)` at radius 4,
 * which is why this tab read as a different screen from the one next to it.
 */
const panelSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: 3,
  bgcolor: "var(--card-bg, #fff)",
  border: "1px solid var(--border-default, #ececf1)",
} as const;

/** The 30px section tile the app uses everywhere (parts.tsx SectionHeader, and
 *  CourseSettingsPanel's own cards on this same page). Was 38px at radius 2.25. */
function PanelHeader({
  icon,
  gradient,
  title,
  sub,
  right,
}: {
  icon: string;
  gradient: string;
  title: string;
  sub: string;
  right?: React.ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: gradient }}>
          <Icon icon={icon} width={17} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2, color: "var(--font-primary)" }}>{title}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", mt: "1px" }}>{sub}</Typography>
        </Box>
      </Stack>
      {right}
    </Stack>
  );
}

/**
 * The status pill this page already uses (MockInterviewAdminSection:83). A MUI
 * `<Chip color="warning">` here was painting `palette.warning.main`, which
 * ThemeProvider never overrides, so it rendered MUI's factory orange #ed6c02 - a
 * colour that appears nowhere else in the product.
 */
function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 1,
        py: 0.35,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: "0.66rem",
        color: on ? "#15803d" : "#64748b",
        bgcolor: on ? "#dcfce7" : "#f1f5f9",
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Certificate authoring for one adaptive course.
 *
 * Two backends meet on this screen and they own different halves of the
 * decision, which is why there are two save buttons rather than one:
 *
 * - WHEN a learner earns it (enabled, minimum completion percent, the credential
 *   title) is adaptive-journey's own certificate config, unchanged from the
 *   original version of this section. Those three fields already gate the
 *   learner's claim button, so moving them would have broken every course that
 *   already has them set.
 * - WHAT they receive is the certificates module's rule: "at this percent on
 *   this course, award this design". That lives behind the rules endpoint,
 *   which is a bulk replace for the whole course, so the rule editor is the
 *   single writer of it on this page.
 *
 * The percent is deliberately NOT duplicated into the rule editor: the pinned
 * completion row reads the value out of the field above it, so an admin cannot
 * end up with a course whose unlock threshold and whose award threshold
 * disagree, which is exactly the kind of divergence the certificates module was
 * written to end.
 */
export function CertificateAdminSection({
  courseId,
  courseTitle,
}: {
  courseId: number;
  /** The real course title, so the live preview shows what a learner will
   *  actually receive rather than a placeholder. */
  courseTitle?: string;
}) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const clientId = config.clientId;

  const [certConfig, setCertConfig] = useState<AdminCertificateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState(false);
  const [minCompletion, setMinCompletion] = useState(80);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  /** Mirrors the completion rule's design so the preview repaints the moment an
   *  admin picks one, without waiting for a save. The rule editor stays the
   *  owner of the value; this is a read-only echo of it. */
  const [completionTemplateId, setCompletionTemplateId] = useState<number | null>(null);

  const { templates, loading: templatesLoading } = useCertificateTemplates(clientId);
  const issuer = useCertificateIssuer();
  const artLabels = useCertificateArtworkLabels();

  const hydrate = (c: AdminCertificateConfig) => {
    setCertConfig(c);
    setEnabled(c.enabled);
    setMinCompletion(c.min_completion_percent);
    setTitle(c.title);
  };

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await adaptiveJourneyService.getCertificateConfig(courseId);
        if (!cancelled) hydrate(c);
      } catch {
        /* surfaced as empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const c = await adaptiveJourneyService.updateCertificateConfig(courseId, {
        enabled,
        min_completion_percent: minCompletion,
        title: title.trim(),
      });
      hydrate(c);
      showToast(
        t("certificatesUpload.cfgSaved", "Certificate settings saved."),
        "success",
      );
    } catch (e) {
      showToast(
        getAxiosErrorDetail(
          e,
          t("certificatesUpload.cfgSaveError", "Failed to save settings."),
        ),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!certConfig &&
    (enabled !== certConfig.enabled ||
      minCompletion !== certConfig.min_completion_percent ||
      title.trim() !== certConfig.title);

  const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === completionTemplateId) ?? null,
    [templates, completionTemplateId],
  );

  const subtitle = courseTitle?.trim() || "";

  const previewPayload = useMemo(
    () =>
      buildTemplatePreviewPayload(selectedTemplate, issuer, {
        subtitle,
        title: title.trim() || undefined,
        source: { kind: "adaptive_course", id: courseId, label: subtitle },
        metrics: [
          {
            label: t("certificatesUpload.cfgMetricCompletion", "Completion"),
            value: `${minCompletion}%`,
          },
        ],
      }),
    [selectedTemplate, issuer, subtitle, title, courseId, minCompletion, t],
  );

  // The same context for the miniatures inside the picker, so an admin
  // comparing designs compares them on their own course rather than on a
  // generic sample.
  const previewContext = useMemo(
    () => ({
      subtitle,
      title: title.trim() || undefined,
      source: { kind: "adaptive_course" as const, id: courseId, label: subtitle },
    }),
    [subtitle, title, courseId],
  );

  const handleTemplateChange = (
    criterion: CertificateRuleCriterion,
    templateId: number | null,
  ) => {
    if (criterion === "completion") setCompletionTemplateId(templateId);
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <CircularProgress sx={{ color: "#7c3aed" }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      {/* Unlock criteria */}
      <Box sx={panelSx}>
        <PanelHeader
          icon="mdi:flag-checkered"
          gradient={INDIGO_GRADIENT}
          title={t("certificatesUpload.cfgCriteriaTitle", "Unlock criteria")}
          sub={t(
            "certificatesUpload.cfgCriteriaSub",
            "When learners can claim the certificate.",
          )}
          right={
            <StatusPill
              on={enabled}
              label={
                enabled
                  ? t("certificatesUpload.cfgStatusOn", "Awarded on completion")
                  : t("certificatesUpload.cfgStatusOff", "Not awarded yet")
              }
            />
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7c3aed" },
              }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--font-primary)" }}>
                {t("certificatesUpload.cfgEnabled", "Certificate enabled")}
              </Typography>
              <Typography sx={{ fontSize: "0.76rem", color: "var(--font-secondary)", lineHeight: 1.5 }}>
                {t(
                  "certificatesUpload.cfgEnabledHint",
                  "Learners see the certificate card and can claim it once they meet the threshold.",
                )}
              </Typography>
            </Box>
          }
          sx={{ alignItems: "flex-start", mb: 2.5, ml: 0 }}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label={t("certificatesUpload.cfgMinCompletion", "Minimum completion %")}
            type="number"
            value={minCompletion}
            onChange={(e) => setMinCompletion(clampPct(Number(e.target.value)))}
            inputProps={{ min: 0, max: 100 }}
            helperText={t(
              "certificatesUpload.cfgMinCompletionHint",
              "Course completion required to unlock (0 to 100).",
            )}
            sx={{ width: { xs: "100%", sm: 240 } }}
          />
          <TextField
            label={t("certificatesUpload.cfgTitle", "Certificate title (optional)")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(
              "certificatesUpload.cfgTitlePlaceholder",
              "e.g. Data Science Professional",
            )}
            helperText={t(
              "certificatesUpload.cfgTitleHint",
              "Shown as the credential name on LinkedIn.",
            )}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Box sx={{ mt: 2.5 }}>
          <LoadingButton
            variant="contained"
            onClick={handleSave}
            loading={saving}
            disabled={!dirty}
            sx={{
              textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2.5,
              background: INDIGO_GRADIENT,
              "&.Mui-disabled": { background: "#e2e8f0", color: "#94a3b8" },
            }}
          >
            {t("certificatesUpload.cfgSaveSettings", "Save settings")}
          </LoadingButton>
        </Box>
      </Box>

      {/* What the learner receives */}
      <Box sx={panelSx}>
        <PanelHeader
          icon="mdi:certificate"
          gradient={CERT_BADGE_GRADIENT}
          title={t("certificatesUpload.cfgPreviewTitle", "What learners receive")}
          sub={t(
            "certificatesUpload.cfgPreviewSub",
            "A live preview on your institution's branding, with a sample learner's name.",
          )}
        />
        <Box sx={{ maxWidth: 620, mx: "auto" }}>
          <CertificatePreview payload={previewPayload} labels={artLabels} radius={10} />
        </Box>
      </Box>

      {/* Design + award bands. Single writer of this course's rules. */}
      <Box sx={panelSx}>
        <PanelHeader
          icon="mdi:palette-outline"
          gradient={CERT_BADGE_GRADIENT}
          title={t("certificatesUpload.cfgDesignTitle", "Certificate design")}
          sub={t(
            "certificatesUpload.cfgDesignSub",
            "The design awarded when a learner completes this course, plus any extra bands.",
          )}
        />
        <CertificateRuleEditor
          clientId={clientId}
          scope="adaptive_course"
          courseId={Number.isFinite(courseId) ? courseId : null}
          templates={templates}
          templatesLoading={templatesLoading}
          previewContext={previewContext}
          allowCustomRows
          pinned={[
            {
              criterion: "completion",
              label: t("certificatesUpload.cfgCompletionRow", "Course completion"),
              hint: t(
                "certificatesUpload.cfgCompletionRowHint",
                "Uses the minimum completion percent set above, so the two can never disagree.",
              ),
              threshold: minCompletion,
            },
          ]}
          onTemplateChange={handleTemplateChange}
          saveLabel={t("certificatesUpload.cfgSaveDesign", "Save certificate design")}
        />
      </Box>

      {/*
        The legacy per-course background upload used to sit here. It wrote an
        S3 key into `certificate_config["template"]`, and the certificates
        module never reads that key: artwork is resolved rule -> tier -> tenant
        default -> seeded slug, and none of those paths consult a raw blob. So
        an admin uploaded their institution's artwork, was shown it back, and
        every learner still received the seeded parametric design - two design
        mechanisms on one screen with only one of them connected.

        The control is gone rather than rewired, because a per-course image is
        exactly what a `CertificateTemplate` of kind="upload" replaces: that one
        has a preset, a palette, field placements and a real preview, and it can
        be bound to as many courses as the tenant likes. Upload it in the
        certificates module and pick it above.
      */}
    </Stack>
  );
}
