"use client";

import { useEffect, useState } from "react";
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
import { uploadAdminCertificateAsset } from "@/lib/services/file-upload.service";
import { adminCourseBuilderService } from "@/lib/services/admin/admin-course-builder.service";

export default function AdminCourseCertificateUploadPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  const theme = useTheme();
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [title, setTitle] = useState<string | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) {
      setLoadingCourse(false);
      setTitle(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingCourse(true);
        const data = await adminCourseBuilderService.viewCourseDetails(courseId);
        if (!cancelled && data && typeof data === "object") {
          const raw = data as { course_title?: string; title?: string };
          const t0 = raw.course_title ?? raw.title;
          setTitle(typeof t0 === "string" ? t0 : null);
        }
      } catch {
        if (!cancelled) setTitle(null);
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const clientId = Number(config.clientId);

  useEffect(() => {
    setFile(null);
  }, [courseId]);

  const handleUpload = async () => {
    if (!file || !Number.isFinite(courseId) || courseId <= 0) return;
    try {
      setUploading(true);
      await uploadAdminCertificateAsset(clientId, file, {
        scope: "course",
        courseId,
      });
      setFile(null);
      showToast(t("certificatesUpload.uploadSuccess"), "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : t("certificatesUpload.uploadError"), "error");
    } finally {
      setUploading(false);
    }
  };

  const invalidId = !Number.isFinite(courseId) || courseId <= 0;
  const courseMissing = !loadingCourse && !invalidId && title == null;

  return (
    <PageShell maxWidth={760}>
        <ModulePageHeader
          eyebrow="Certificates"
          title={t("certificatesUpload.uploadTitleCourse")}
          description={t("certificatesUpload.helperAdminCertificate")}
          accent="emerald"
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
          {loadingCourse ? (
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
          ) : invalidId || courseMissing ? (
            <Alert
              severity="warning"
              icon={<IconWrapper icon="mdi:alert-outline" size={22} />}
              sx={{ borderRadius: 2 }}
            >
              {t("certificatesUpload.invalidCourse")}
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
                  {title}
                </Typography>
                <Chip
                  size="small"
                  label={`${t("certificatesUpload.courseIdChip")} ${courseId}`}
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
