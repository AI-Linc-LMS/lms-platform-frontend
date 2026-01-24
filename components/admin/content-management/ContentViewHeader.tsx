"use client";

import { Box, Button, Typography, Paper, Chip } from "@mui/material";
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
  const getTypeColor = (contentType: ContentType) => {
    const colors: Record<ContentType, { bg: string; text: string }> = {
      Quiz: { bg: "#eef2ff", text: "#6366f1" },
      Article: { bg: "#d1fae5", text: "#10b981" },
      Assignment: { bg: "#fef3c7", text: "#f59e0b" },
      CodingProblem: { bg: "#ede9fe", text: "#8b5cf6" },
      DevCodingProblem: { bg: "#fce7f3", text: "#ec4899" },
      VideoTutorial: { bg: "#fee2e2", text: "#ef4444" },
    };
    return colors[contentType] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  const typeColor = getTypeColor(type);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
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
            sx={{ color: "#6b7280" }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
              {title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip
                label={type}
                size="small"
                sx={{
                  bgcolor: typeColor.bg,
                  color: typeColor.text,
                  fontWeight: 600,
                }}
              />
              <Chip
                label={isVerified ? "Verified" : "Unverified"}
                size="small"
                sx={{
                  bgcolor: isVerified ? "#d1fae5" : "#fee2e2",
                  color: isVerified ? "#065f46" : "#991b1b",
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
            bgcolor: isVerified ? undefined : "#10b981",
            color: isVerified ? "#10b981" : "#ffffff",
            borderColor: isVerified ? "#10b981" : undefined,
            "&:hover": {
              bgcolor: isVerified ? "#f0fdf4" : "#059669",
              borderColor: isVerified ? "#10b981" : undefined,
            },
          }}
        >
          {isVerified ? "Unverify" : "Verify"}
        </Button>
      </Box>
    </Paper>
  );
}
