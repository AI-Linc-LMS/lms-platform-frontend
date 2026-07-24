"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  Breadcrumbs,
  Alert,
  CircularProgress,
  Paper,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
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
  const primary = theme.palette.primary.main;

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
    <MainLayout>
      <Box sx={{ pb: 6 }}>
        <Box
          sx={{
            background: `linear-gradient(145deg, ${alpha(primary, theme.palette.mode === "dark" ? 0.2 : 0.09)} 0%, ${alpha(
              theme.palette.background.default,
              1,
            )} 70%)`,
            borderBottom: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.55),
          }}
        >
          <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 2.5, md: 4 } }}>
            <Breadcrumbs
              sx={{
                mb: 2,
                "& a": {
                  textDecoration: "none",
                  color: "primary.main",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  "&:hover": { textDecoration: "underline" },
                },
              }}
            >
              <Link href="/admin/certificates">{t("certificatesUpload.hubTitle")}</Link>
              <Typography color="text.secondary" variant="body2" fontWeight={500}>
                {t("certificatesUpload.assessmentSection")}
              </Typography>
              <Typography color="text.primary" variant="body2" fontWeight={700} sx={{ wordBreak: "break-all" }}>
                {slug || "-"}
              </Typography>
            </Breadcrumbs>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box
                sx={{
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  borderRadius: 2.5,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(primary, theme.palette.mode === "dark" ? 0.28 : 0.15),
                  color: primary,
                  boxShadow: `0 10px 28px ${alpha(primary, 0.22)}`,
                }}
              >
                <IconWrapper icon="mdi:certificate" size={30} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    fontSize: { xs: "1.35rem", sm: "1.65rem" },
                    mb: 0.75,
                    lineHeight: 1.2,
                  }}
                >
                  {t("certificatesUpload.uploadTitleAssessment")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.65 }}>
                  {t("certificatesUpload.helperAdminCertificate")}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, mt: -2 }}>
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
      </Box>
    </MainLayout>
  );
}
