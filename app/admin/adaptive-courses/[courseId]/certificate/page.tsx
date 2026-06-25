"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingButton } from "@/components/common/LoadingButton";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { Reveal, SectionHero } from "@/components/scorecard/shared";
import { AdminCertificateUploadCard } from "@/components/admin/certificates/AdminCertificateUploadCard";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { AdminCertificateConfig } from "@/lib/types/adaptive-journey";

// Certificate identity accent — amber → orange, matching the course-hub launcher
// card and the learner certificate card.
const AMBER_TOP = "#f59e0b";
const AMBER_BOTTOM = "#f97316";
const AMBER_GRADIENT = `linear-gradient(135deg, ${AMBER_TOP} 0%, ${AMBER_BOTTOM} 100%)`;
// Primary CTA gradient shared across the adaptive admin surfaces.
const INDIGO_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)";

/** A section panel header: gradient icon tile + title + helper, with an optional right slot. */
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
        <Box sx={{ width: 38, height: 38, borderRadius: 2.25, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: gradient }}>
          <Icon icon={icon} width={20} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.2 }}>{title}</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>{sub}</Typography>
        </Box>
      </Stack>
      {right}
    </Stack>
  );
}

const panelSx = {
  p: { xs: 2.25, md: 3 },
  borderRadius: 4,
  bgcolor: "color-mix(in srgb, var(--card-bg) 92%, transparent)",
  border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
} as const;

export default function AdminAdaptiveCertificatePage() {
  const router = useRouter();
  const courseId = Number(useParams().courseId);
  const { showToast } = useToast();

  const [config, setConfig] = useState<AdminCertificateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Local editable copies of the criteria.
  const [enabled, setEnabled] = useState(false);
  const [minCompletion, setMinCompletion] = useState(80);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Template upload state.
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const hydrate = (c: AdminCertificateConfig) => {
    setConfig(c);
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

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const c = await adaptiveJourneyService.uploadCertificateTemplate(courseId, file);
      hydrate(c);
      setFile(null);
      showToast("Certificate template uploaded.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to upload template.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const c = await adaptiveJourneyService.updateCertificateConfig(courseId, {
        enabled,
        min_completion_percent: minCompletion,
        title: title.trim(),
      });
      hydrate(c);
      showToast("Certificate settings saved.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!config &&
    (enabled !== config.enabled ||
      minCompletion !== config.min_completion_percent ||
      title.trim() !== config.title);

  const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const statusChips = config && (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      <Chip
        size="small"
        icon={<Icon icon={config.enabled ? "mdi:check-circle" : "mdi:pause-circle-outline"} width={15} />}
        label={config.enabled ? "Live" : "Off"}
        sx={{
          fontWeight: 800, height: 24,
          color: config.enabled ? "#15803d" : "#64748b",
          bgcolor: config.enabled ? "#dcfce7" : "#f1f5f9",
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
      <Chip
        size="small"
        icon={<Icon icon={config.configured ? "mdi:image-check" : "mdi:image-off-outline"} width={15} />}
        label={config.configured ? "Template uploaded" : "No template"}
        sx={{
          fontWeight: 700, height: 24,
          color: config.configured ? "#b45309" : "#64748b",
          bgcolor: config.configured ? "#fef3c7" : "#f1f5f9",
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    </Stack>
  );

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to course
        </ButtonBase>

        <AdaptiveSectionShell>
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#f59e0b" }} />
            </Box>
          ) : (
            <>
              <SectionHero
                chapter={config?.enabled ? "Live · Certificate" : "Setup · Certificate"}
                title="Course certificate"
                subtitle="Upload the certificate template and decide when learners can download it and share to LinkedIn."
                accentTop={AMBER_TOP}
                accentBottom={AMBER_BOTTOM}
                iconBadge={{
                  icon: "mdi:certificate",
                  gradient: AMBER_GRADIENT,
                  shadow: `0 18px 32px -16px color-mix(in srgb, ${AMBER_TOP} 60%, transparent)`,
                }}
                rightSlot={statusChips}
              />

              <Stack spacing={2.5}>
                {/* Unlock criteria */}
                <Reveal>
                  <Box sx={panelSx}>
                    <PanelHeader
                      icon="mdi:flag-checkered"
                      gradient={INDIGO_GRADIENT}
                      title="Unlock criteria"
                      sub="When learners can claim the certificate."
                    />

                    <FormControlLabel
                      control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Certificate enabled</Typography>
                          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                            Learners see the certificate card and can claim it once they meet the threshold.
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: "flex-start", mb: 2.5, ml: 0 }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Minimum completion %"
                        type="number"
                        value={minCompletion}
                        onChange={(e) => setMinCompletion(clampPct(Number(e.target.value)))}
                        inputProps={{ min: 0, max: 100 }}
                        helperText="Course completion required to unlock (0–100)."
                        sx={{ width: { xs: "100%", sm: 240 } }}
                      />
                      <TextField
                        label="Certificate title (optional)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Data Science Professional"
                        helperText="Shown as the credential name on LinkedIn."
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
                        Save settings
                      </LoadingButton>
                    </Box>
                  </Box>
                </Reveal>

                {/* Certificate template */}
                <Reveal delay={0.06}>
                  <Box sx={panelSx}>
                    <PanelHeader
                      icon="mdi:image-outline"
                      gradient={AMBER_GRADIENT}
                      title="Certificate template"
                      sub="The background image the learner's name is drawn onto."
                      right={
                        config?.configured ? (
                          <Chip size="small" color="success" variant="outlined" label="Uploaded" sx={{ fontWeight: 700 }} />
                        ) : undefined
                      }
                    />

                    <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}>
                      Upload a PNG or JPG. The learner&apos;s name and details are drawn on top when they download or
                      share. Leave empty to use the default branded certificate.
                    </Typography>

                    {config?.template_url && (
                      <Box sx={{ mb: 2, borderRadius: 3, overflow: "hidden", border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)", maxWidth: 540 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={config.template_url} alt="Certificate template" style={{ width: "100%", height: "auto", display: "block" }} />
                      </Box>
                    )}

                    <AdminCertificateUploadCard
                      selectedFile={file}
                      onSelectFile={setFile}
                      onUpload={handleUpload}
                      uploading={uploading}
                      lastUrl={config?.template_url ?? null}
                    />
                  </Box>
                </Reveal>
              </Stack>
            </>
          )}
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
