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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");

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
            border: "1px solid #e5e7eb",
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
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
            boxShadow: "0 12px 40px rgba(99, 102, 241, 0.35)",
          }}
        >
          <IconWrapper icon="mdi:laptop" size={44} color="#ffffff" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mb: 1.5 }}>
          {t("assessments.desktopOnly.title")}
        </Typography>
        <Typography variant="body1" sx={{ color: "#6b7280", lineHeight: 1.65 }}>
          {t("assessments.desktopOnly.description")}
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
            backgroundColor: "#6366f1",
            boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.35)",
            "&:hover": { backgroundColor: "#4f46e5" },
          }}
        >
          {t("assessments.desktopOnly.gotIt")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AssessmentDesktopOnlyFullPage({ slug }: { slug: string }) {
  const { t } = useTranslation("common");
  const router = useRouter();

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
            border: "1px solid #e5e7eb",
            textAlign: "center",
            background:
              "linear-gradient(180deg, #fafbff 0%, #ffffff 40%, #ffffff 100%)",
          }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
              boxShadow: "0 12px 40px rgba(99, 102, 241, 0.35)",
            }}
          >
            <IconWrapper icon="mdi:monitor" size={44} color="#ffffff" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mb: 1.5 }}>
            {t("assessments.desktopOnly.title")}
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280", lineHeight: 1.65, mb: 3 }}>
            {t("assessments.desktopOnly.description")}
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
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              {t("assessments.desktopOnly.backToOverview")}
            </Button>
            <Button
              variant="text"
              size="medium"
              onClick={() => router.push("/assessments")}
              sx={{ textTransform: "none", fontWeight: 600, color: "#6b7280" }}
            >
              {t("assessments.backToAssessments")}
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
