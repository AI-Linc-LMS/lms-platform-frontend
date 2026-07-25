"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { AdminCertificateUploadCard } from "@/components/admin/certificates/AdminCertificateUploadCard";
import { config } from "@/lib/config";
import {
  uploadAdminCertificateAsset,
  type CertificateUploadTier,
} from "@/lib/services/file-upload.service";
import { adminAssessmentService } from "@/lib/services/admin/admin-assessment.service";
import type { Assessment } from "@/lib/services/admin/admin-assessment.service";

export default function AdminAssessmentCertificateUploadPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.slug as string;
  const slug = useMemo(() => decodeURIComponent(slugParam || ""), [slugParam]);

  const theme = useTheme();
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [tier, setTier] = useState<CertificateUploadTier>("participation");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingList(true);
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
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast, t]);

  const assessment = useMemo(
    () => assessments.find((a) => a.slug === slug),
    [assessments, slug],
  );

  const clientId = Number(config.clientId);

  useEffect(() => {
    setTier("participation");
    setFile(null);
  }, [slug]);

  useEffect(() => {
    setFile(null);
  }, [tier]);

  const handleUpload = async () => {
    if (!file || !assessment) return;
    try {
      setUploading(true);
      await uploadAdminCertificateAsset(clientId, file, {
        scope: "assessment",
        slug: assessment.slug,
        tier,
      });
      setFile(null);
      showToast(t("certificatesUpload.uploadSuccess"), "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t("certificatesUpload.uploadError"), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell maxWidth={760}>
        <ModulePageHeader
          eyebrow="Certificates"
          title={t("certificatesUpload.uploadTitleAssessment")}
          description={t("certificatesUpload.helperAdminCertificate")}
          accent="indigo"
          icon="mdi:certificate"
          action={
            <HeaderActionButton
              icon="mdi:arrow-left"
              variant="ghost"
              onClick={() => router.push("/admin/certificates")}
            >
              {t("certificatesUpload.hubTitle")}
            </HeaderActionButton>
          }
        />

        <Box>
          {loadingList ? (
            <Paper
              elevation={0}
              sx={{
                py: 8,
                borderRadius: 3,
                textAlign: "center",
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
              }}
            >
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("certificatesUpload.loadingList")}
              </Typography>
            </Paper>
          ) : !slug || !assessment ? (
            <Alert
              severity="warning"
              icon={<IconWrapper icon="mdi:alert-outline" size={22} />}
              sx={{ borderRadius: 2 }}
            >
              {t("certificatesUpload.invalidAssessment")}
            </Alert>
          ) : (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  mb: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.85),
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.5 : 1),
                  boxShadow: `0 12px 32px ${alpha("#0f172a", theme.palette.mode === "dark" ? 0.35 : 0.06)}`,
                }}
              >
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", fontWeight: 700 }}>
                  {t("certificatesUpload.targetLabel")}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.75, mb: 1.25, lineHeight: 1.3 }}>
                  {assessment.title}
                </Typography>
                <Chip
                  size="small"
                  label={assessment.slug}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                />
              </Paper>

              <AdminCertificateUploadCard
                tier={{ value: tier, onChange: setTier }}
                selectedFile={file}
                onSelectFile={setFile}
                onUpload={handleUpload}
                uploading={uploading}
              />
            </>
          )}
        </Box>
    </PageShell>
  );
}
