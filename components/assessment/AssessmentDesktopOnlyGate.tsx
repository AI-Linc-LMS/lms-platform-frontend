"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";

export function AssessmentDesktopOnlyDialog({
  open,
  onClose,
  allowedTypes,
}: {
  open: boolean;
  onClose: () => void;
  /** Human-readable device labels that ARE allowed, e.g. ["desktop", "tablet"] */
  allowedTypes?: string[];
}) {
  const { t } = useTranslation("common");

  const hasAllowedTypes = allowedTypes && allowedTypes.length > 0;
  const allowedList = hasAllowedTypes
    ? allowedTypes!.map((d) => t(`assessmentDevice.classNames.${d}`, d)).join(", ")
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid var(--border-default)",
          },
        },
      }}
    >
      <DialogContent sx={{ pt: 4, pb: 2, px: 3, textAlign: "center" }}>
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-warning, #f59e0b) 0%, var(--accent-warning-dark, #d97706) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
            boxShadow: "0 12px 40px color-mix(in srgb, #f59e0b 30%, transparent)",
          }}
        >
          <IconWrapper icon="mdi:devices" size={44} color="var(--font-light)" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary-dark)", mb: 1.5 }}>
          {t("assessmentDevice.learnerAlertTitle")}
        </Typography>
        <Typography variant="body1" sx={{ color: "var(--font-secondary)", lineHeight: 1.65 }}>
          {hasAllowedTypes
            ? t("assessmentDevice.learnerAlertBody", { types: allowedList })
            : t("assessments.desktopOnly.description")}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 4,
            py: 1.25,
            borderRadius: 2,
            backgroundColor: "var(--accent-indigo)",
            boxShadow: "0 4px 14px 0 color-mix(in srgb, var(--accent-indigo) 38%, transparent)",
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
          }}
        >
          {t("assessments.desktopOnly.gotIt")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AssessmentDesktopOnlyFullPage({
  slug,
  allowedTypes,
}: {
  slug: string;
  /** Human-readable device labels that ARE allowed, e.g. ["desktop", "tablet"] */
  allowedTypes?: string[];
}) {
  const { t } = useTranslation("common");
  const router = useRouter();

  const hasAllowedTypes = allowedTypes && allowedTypes.length > 0;
  const allowedList = hasAllowedTypes
    ? allowedTypes!.map((d) => t(`assessmentDevice.classNames.${d}`, d)).join(", ")
    : null;

  return (
    <MainLayout>
      <Box
        sx={{
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 440,
            width: "100%",
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: "1px solid var(--border-default)",
            textAlign: "center",
            background:
              "linear-gradient(180deg, var(--card-bg) 0%, var(--font-light) 40%, var(--font-light) 100%)",
          }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-warning, #f59e0b) 0%, var(--accent-warning-dark, #d97706) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
              boxShadow: "0 12px 40px color-mix(in srgb, #f59e0b 30%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:devices" size={44} color="var(--font-light)" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary-dark)", mb: 1.5 }}>
            {t("assessmentDevice.learnerAlertTitle")}
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--font-secondary)", lineHeight: 1.65, mb: 3 }}>
            {hasAllowedTypes
              ? t("assessmentDevice.learnerAlertBody", { types: allowedList })
              : t("assessments.desktopOnly.description")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => router.push(`/assessments/${slug}`)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                py: 1.25,
                borderRadius: 2,
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {t("assessments.desktopOnly.backToOverview")}
            </Button>
            <Button
              variant="text"
              size="medium"
              onClick={() => router.push("/assessments")}
              sx={{ textTransform: "none", fontWeight: 600, color: "var(--font-secondary)" }}
            >
              {t("assessments.backToAssessments")}
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
