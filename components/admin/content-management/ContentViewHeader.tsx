"use client";

import { Box, Button, Typography, Paper, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ContentType } from "@/lib/services/admin/admin-content-management.service";

interface ContentViewHeaderProps {
  title: string;
  type: ContentType;
  isVerified: boolean;
  verifying: boolean;
  onBack: () => void;
  onToggleVerification: () => void;
}

export function ContentViewHeader({
  title,
  type,
  isVerified,
  verifying,
  onBack,
  onToggleVerification,
}: ContentViewHeaderProps) {
  const { t } = useTranslation("common");
  const getTypeColor = (contentType: ContentType) => {
    const colors: Record<ContentType, { bg: string; text: string }> = {
      Quiz: { bg: "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)", text: "var(--accent-indigo)" },
      Article: { bg: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)", text: "var(--success-500)" },
      Assignment: { bg: "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)", text: "var(--warning-500)" },
      CodingProblem: { bg: "color-mix(in srgb, var(--accent-purple) 14%, var(--surface) 86%)", text: "var(--accent-purple)" },
      DevCodingProblem: { bg: "color-mix(in srgb, var(--accent-purple) 10%, var(--surface) 90%)", text: "var(--accent-purple)" },
      VideoTutorial: { bg: "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)", text: "var(--error-500)" },
    };
    return colors[contentType] || { bg: "var(--surface)", text: "var(--font-secondary)" };
  };

  const typeColor = getTypeColor(type);
  const typeToLabelKey: Record<ContentType, string> = {
    Quiz: "adminContentManagement.typeQuiz",
    Article: "adminContentManagement.typeArticle",
    Assignment: "adminContentManagement.typeAssignment",
    CodingProblem: "adminContentManagement.typeCodingProblem",
    DevCodingProblem: "adminContentManagement.typeDevCodingProblem",
    VideoTutorial: "adminContentManagement.typeVideoTutorial",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        zIndex: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={onBack}
            sx={{ color: "var(--font-secondary)" }}
          >
            {t("adminContentManagement.back")}
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              {title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip
                label={t(typeToLabelKey[type])}
                size="small"
                sx={{
                  bgcolor: typeColor.bg,
                  color: typeColor.text,
                  fontWeight: 600,
                }}
              />
              <Chip
                label={isVerified ? t("adminContentManagement.verified") : t("adminContentManagement.unverified")}
                size="small"
                sx={{
                  bgcolor: isVerified
                    ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                    : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                  color: isVerified ? "var(--success-500)" : "var(--error-500)",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>
        </Box>
        <Button
          variant={isVerified ? "outlined" : "contained"}
          onClick={onToggleVerification}
          disabled={verifying}
          startIcon={
            <IconWrapper
              icon={isVerified ? "mdi:check-circle" : "mdi:circle-outline"}
              size={18}
            />
          }
          sx={{
            bgcolor: isVerified ? undefined : "var(--success-500)",
            color: isVerified ? "var(--success-500)" : "var(--font-light)",
            borderColor: isVerified ? "var(--success-500)" : undefined,
            "&:hover": {
              bgcolor: isVerified
                ? "color-mix(in srgb, var(--success-500) 10%, var(--surface) 90%)"
                : "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))",
              borderColor: isVerified ? "var(--success-500)" : undefined,
            },
            "&.Mui-disabled": {
              color: "var(--font-secondary)",
              backgroundColor:
                "color-mix(in srgb, var(--success-500) 24%, var(--surface) 76%)",
              borderColor: "var(--border-default)",
            },
          }}
        >
          {isVerified ? t("adminContentManagement.unverify") : t("adminContentManagement.verify")}
        </Button>
      </Box>
    </Paper>
  );
}
