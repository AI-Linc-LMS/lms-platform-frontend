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
import { AdminCertificateUploadCard } from "@/components/admin/certificates/AdminCertificateUploadCard";
import { useToast } from "@/components/common/Toast";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { AdminCertificateConfig } from "@/lib/types/adaptive-journey";

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

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to course
        </ButtonBase>

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" }}>
            <Icon icon="mdi:certificate" width={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.3rem" }}>Course certificate</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              Upload the certificate template and set when learners can download &amp; share it on LinkedIn.
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#6366f1" }} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Criteria */}
            <Box sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, bgcolor: "var(--card-bg, #fff)", border: "1px solid var(--border-default, #ececf1)" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Unlock criteria</Typography>
                {config?.configured ? (
                  <Chip size="small" color="success" variant="outlined" label="Template uploaded" sx={{ fontWeight: 700 }} />
                ) : (
                  <Chip size="small" color="warning" variant="outlined" label="No template yet" sx={{ fontWeight: 700 }} />
                )}
              </Stack>

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
                sx={{ alignItems: "flex-start", mb: 2, ml: 0 }}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Minimum completion %"
                  type="number"
                  value={minCompletion}
                  onChange={(e) => setMinCompletion(clampPct(Number(e.target.value)))}
                  inputProps={{ min: 0, max: 100 }}
                  helperText="Course completion required to unlock (0–100)."
                  sx={{ width: { xs: "100%", sm: 220 } }}
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
                  sx={{ backgroundColor: "#6366f1", "&:hover": { backgroundColor: "#4f46e5" } }}
                >
                  Save settings
                </LoadingButton>
              </Box>
            </Box>

            {/* Template upload */}
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 0.5 }}>Certificate template</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}>
                Upload a background image (PNG/JPG). The learner&apos;s name and details are drawn on top when they
                download or share. Leave empty to use the default branded certificate.
              </Typography>

              {config?.template_url && (
                <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden", border: "1px solid var(--border-default, #ececf1)", maxWidth: 520 }}>
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
        )}
      </Box>
    </MainLayout>
  );
}
