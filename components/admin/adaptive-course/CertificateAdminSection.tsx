"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { AdminCertificateUploadCard } from "@/components/admin/certificates/AdminCertificateUploadCard";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { AdminCertificateConfig } from "@/lib/types/adaptive-journey";

const AMBER_GRADIENT = "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)";
const INDIGO_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)";

const panelSx = {
  p: { xs: 2.25, md: 3 },
  borderRadius: 4,
  bgcolor: "color-mix(in srgb, var(--card-bg) 92%, transparent)",
  border: "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
} as const;

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

/**
 * Admin certificate authoring — upload the template + set the unlock criteria
 * (enabled, min completion %, title). Self-contained section, rendered both as
 * the Certificate tab on the course detail page and on the standalone sub-page.
 */
export function CertificateAdminSection({ courseId }: { courseId: number }) {
  const { showToast } = useToast();

  const [config, setConfig] = useState<AdminCertificateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState(false);
  const [minCompletion, setMinCompletion] = useState(80);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

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

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <CircularProgress sx={{ color: "#f59e0b" }} />
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
          title="Unlock criteria"
          sub="When learners can claim the certificate."
          right={
            <Chip
              size="small"
              color={config?.configured ? "success" : "warning"}
              variant="outlined"
              label={config?.configured ? "Template uploaded" : "No template yet"}
              sx={{ fontWeight: 700 }}
            />
          }
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

      {/* Certificate template */}
      <Box sx={panelSx}>
        <PanelHeader
          icon="mdi:image-outline"
          gradient={AMBER_GRADIENT}
          title="Certificate template"
          sub="The background image the learner's name is drawn onto."
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
    </Stack>
  );
}
