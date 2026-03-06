"use client";

import { Box, Paper, Typography, Button, Tooltip, IconButton, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const InterviewModeSelectorComponent = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [quickStartHover, setQuickStartHover] = useState(false);
  const [scheduleHover, setScheduleHover] = useState(false);

  const handleQuickStart = () => {
    router.push("/mock-interview/quick-start");
  };

  const handleSchedule = () => {
    router.push("/mock-interview/schedule");
  };

  const quickStartTooltip = (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#ffffff" }}>
        {t("mockInterview.modeSelector.chooseQuickStartIf")}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, listStyle: "disc" }}>
        <li><Typography variant="body2" sx={{ color: "#ffffff" }}>{t("mockInterview.modeSelector.quickStartTip1")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "#ffffff" }}>{t("mockInterview.modeSelector.quickStartTip2")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "#ffffff" }}>{t("mockInterview.modeSelector.quickStartTip3")}</Typography></li>
      </Box>
    </Box>
  );

  const scheduleTooltip = (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#ffffff" }}>
        {t("mockInterview.modeSelector.chooseScheduleIf")}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, listStyle: "disc" }}>
        <li><Typography variant="body2" sx={{ color: "#ffffff" }}>{t("mockInterview.modeSelector.scheduleTip1")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "#ffffff" }}>{t("mockInterview.modeSelector.scheduleTip2")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "#ffffff" }}>{t("mockInterview.modeSelector.scheduleTip3")}</Typography></li>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography
          variant="h4"
          sx={{
            mb: 1.5,
            fontWeight: 700,
            fontSize: { xs: "1.75rem", md: "2.25rem" },
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t("mockInterview.modeSelector.chooseInterviewMode")}
        </Typography>
        <Typography variant="body1" sx={{ color: "#6b7280", fontSize: "1rem" }}>
          {t("mockInterview.modeSelector.selectModeSubtitle")}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 4,
          mb: 4,
        }}
      >
        {/* Quick Start Card */}
        <Paper
          elevation={0}
          onMouseEnter={() => setQuickStartHover(true)}
          onMouseLeave={() => setQuickStartHover(false)}
          sx={{
            p: 4,
            borderRadius: 4,
            border: "2px solid",
            borderColor: quickStartHover ? "#10b981" : "#a7f3d0",
            backgroundColor: "#ecfdf5",
            position: "relative",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: quickStartHover ? "translateY(-8px)" : "translateY(0)",
            boxShadow: quickStartHover
              ? "0 20px 40px rgba(16, 185, 129, 0.25)"
              : "0 4px 12px rgba(16, 185, 129, 0.08)",
            overflow: "visible",
          }}
        >
          {/* Recommended Badge */}
          <Chip
            label={t("mockInterview.modeSelector.recommended")}
            size="small"
            sx={{
              position: "absolute",
              top: -12,
              right: 20,
              backgroundColor: "#10b981",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.5px",
              px: 1,
              height: 24,
            }}
          />

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2.5,
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
                transform: quickStartHover ? "scale(1.05) rotate(5deg)" : "scale(1)",
              }}
            >
              <IconWrapper icon="mdi:lightning-bolt" size={36} color="#ffffff" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
                  {t("mockInterview.modeSelector.quickStartTitle")}
                </Typography>
                <Tooltip title={quickStartTooltip} arrow placement="top">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: "#d1fae5",
                      color: "#059669",
                      width: 24,
                      height: 24,
                      "&:hover": {
                        backgroundColor: "#a7f3d0",
                      },
                    }}
                  >
                    <IconWrapper icon="mdi:information" size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ color: "#059669", fontWeight: 600, fontSize: "0.9rem" }}>
                {t("mockInterview.modeSelector.startImmediately")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3.5 }}>
            {[
              { text: t("mockInterview.modeSelector.quickStartBullet1"), icon: "mdi:tune" },
              { text: t("mockInterview.modeSelector.quickStartBullet2"), icon: "mdi:auto-fix" },
              { text: t("mockInterview.modeSelector.quickStartBullet3"), icon: "mdi:play-circle" },
              { text: t("mockInterview.modeSelector.quickStartBullet4"), icon: "mdi:star-circle" },
            ].map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#d1fae5",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#a7f3d0",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={item.icon} size={18} color="#ffffff" />
                </Box>
                <Typography variant="body2" sx={{ color: "#065f46", fontSize: "0.9rem", fontWeight: 500 }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleQuickStart}
            endIcon={<IconWrapper icon="mdi:arrow-right" size={22} />}
            sx={{
              backgroundColor: "#10b981",
              color: "#ffffff",
              fontWeight: 700,
              py: 1.75,
              fontSize: "1.05rem",
              borderRadius: 2.5,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#059669",
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.5)",
                transform: "scale(1.02)",
              },
            }}
          >
            {t("mockInterview.modeSelector.goQuick")}
          </Button>
        </Paper>

        {/* Schedule Interview Card */}
        <Paper
          elevation={0}
          onMouseEnter={() => setScheduleHover(true)}
          onMouseLeave={() => setScheduleHover(false)}
          sx={{
            p: 4,
            borderRadius: 4,
            border: "2px solid",
            borderColor: scheduleHover ? "#6366f1" : "#c7d2fe",
            backgroundColor: "#f5f7ff",
            position: "relative",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: scheduleHover ? "translateY(-8px)" : "translateY(0)",
            boxShadow: scheduleHover
              ? "0 20px 40px rgba(99, 102, 241, 0.25)"
              : "0 4px 12px rgba(99, 102, 241, 0.08)",
            overflow: "visible",
          }}
        >
          {/* Professional Badge */}
          <Chip
            label={t("mockInterview.modeSelector.professional")}
            size="small"
            sx={{
              position: "absolute",
              top: -12,
              right: 20,
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.5px",
              px: 1,
              height: 24,
            }}
          />

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2.5,
                backgroundColor: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(99, 102, 241, 0.3)",
                transition: "all 0.3s ease",
                transform: scheduleHover ? "scale(1.05) rotate(-5deg)" : "scale(1)",
              }}
            >
              <IconWrapper icon="mdi:calendar-clock" size={36} color="#ffffff" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
                  {t("mockInterview.modeSelector.scheduleInterviewTitle")}
                </Typography>
                <Tooltip title={scheduleTooltip} arrow placement="top">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: "#e0e7ff",
                      color: "#4f46e5",
                      width: 24,
                      height: 24,
                      "&:hover": {
                        backgroundColor: "#c7d2fe",
                      },
                    }}
                  >
                    <IconWrapper icon="mdi:information" size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ color: "#6366f1", fontWeight: 600, fontSize: "0.9rem" }}>
                {t("mockInterview.modeSelector.planAhead")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3.5 }}>
            {[
              { text: t("mockInterview.modeSelector.scheduleBullet1"), icon: "mdi:file-document-multiple" },
              { text: t("mockInterview.modeSelector.scheduleBullet2"), icon: "mdi:robot" },
              { text: t("mockInterview.modeSelector.scheduleBullet3"), icon: "mdi:clock-outline" },
              { text: t("mockInterview.modeSelector.scheduleBullet4"), icon: "mdi:certificate" },
            ].map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#e0e7ff",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#c7d2fe",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={item.icon} size={18} color="#ffffff" />
                </Box>
                <Typography variant="body2" sx={{ color: "#3730a3", fontSize: "0.9rem", fontWeight: 500 }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleSchedule}
            endIcon={<IconWrapper icon="mdi:arrow-right" size={22} />}
            sx={{
              borderColor: "#6366f1",
              color: "#6366f1",
              fontWeight: 700,
              py: 1.75,
              fontSize: "1.05rem",
              borderRadius: 2.5,
              textTransform: "none",
              borderWidth: 2,
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.2)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "#4f46e5",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderWidth: 2,
                boxShadow: "0 6px 20px rgba(99, 102, 241, 0.3)",
                transform: "scale(1.02)",
              },
            }}
          >
            {t("mockInterview.modeSelector.scheduleNow")}
          </Button>
        </Paper>
      </Box>

    </Box>
  );
};

export const InterviewModeSelector = memo(InterviewModeSelectorComponent);
InterviewModeSelector.displayName = "InterviewModeSelector";

