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
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "var(--font-light)" }}>
        {t("mockInterview.modeSelector.chooseQuickStartIf")}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, listStyle: "disc" }}>
        <li><Typography variant="body2" sx={{ color: "var(--font-light)" }}>{t("mockInterview.modeSelector.quickStartTip1")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "var(--font-light)" }}>{t("mockInterview.modeSelector.quickStartTip2")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "var(--font-light)" }}>{t("mockInterview.modeSelector.quickStartTip3")}</Typography></li>
      </Box>
    </Box>
  );

  const scheduleTooltip = (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "var(--font-light)" }}>
        {t("mockInterview.modeSelector.chooseScheduleIf")}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, listStyle: "disc" }}>
        <li><Typography variant="body2" sx={{ color: "var(--font-light)" }}>{t("mockInterview.modeSelector.scheduleTip1")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "var(--font-light)" }}>{t("mockInterview.modeSelector.scheduleTip2")}</Typography></li>
        <li><Typography variant="body2" sx={{ color: "var(--font-light)" }}>{t("mockInterview.modeSelector.scheduleTip3")}</Typography></li>
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
            background:
              "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t("mockInterview.modeSelector.chooseInterviewMode")}
        </Typography>
        <Typography variant="body1" sx={{ color: "var(--font-secondary)", fontSize: "1rem" }}>
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
            borderColor: quickStartHover ? "var(--success-500)" : "color-mix(in srgb, var(--success-500) 35%, var(--border-default))",
            backgroundColor: "color-mix(in srgb, var(--success-500) 10%, var(--surface))",
            position: "relative",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: quickStartHover ? "translateY(-8px)" : "translateY(0)",
            boxShadow: quickStartHover
              ? "0 20px 40px color-mix(in srgb, var(--success-500) 35%, transparent)"
              : "0 4px 12px color-mix(in srgb, var(--success-500) 18%, transparent)",
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
              backgroundColor: "var(--success-500)",
              color: "var(--font-light)",
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
                backgroundColor: "var(--success-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px color-mix(in srgb, var(--success-500) 35%, transparent)",
                transition: "all 0.3s ease",
                transform: quickStartHover ? "scale(1.05) rotate(5deg)" : "scale(1)",
              }}
            >
              <IconWrapper icon="mdi:lightning-bolt" size={36} color="var(--font-light)" />
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
                      backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
                      color: "var(--success-500)",
                      width: 24,
                      height: 24,
                      "&:hover": {
                        backgroundColor: "color-mix(in srgb, var(--success-500) 24%, transparent)",
                      },
                    }}
                  >
                    <IconWrapper icon="mdi:information" size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ color: "var(--success-500)", fontWeight: 600, fontSize: "0.9rem" }}>
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
                  backgroundColor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--success-500) 24%, transparent)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: "var(--success-500)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={item.icon} size={18} color="var(--font-light)" />
                </Box>
                <Typography variant="body2" sx={{ color: "var(--font-primary)", fontSize: "0.9rem", fontWeight: 500 }}>
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
              backgroundColor: "var(--success-500)",
              color: "var(--font-light)",
              fontWeight: 700,
              py: 1.75,
              fontSize: "1.05rem",
              borderRadius: 2.5,
              textTransform: "none",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--success-500) 40%, transparent)",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--success-500) 84%, var(--accent-indigo-dark))",
                boxShadow: "0 6px 20px color-mix(in srgb, var(--success-500) 50%, transparent)",
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
            borderColor: scheduleHover ? "var(--accent-indigo)" : "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default))",
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface))",
            position: "relative",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: scheduleHover ? "translateY(-8px)" : "translateY(0)",
            boxShadow: scheduleHover
              ? "0 20px 40px color-mix(in srgb, var(--accent-indigo) 35%, transparent)"
              : "0 4px 12px color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
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
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
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
                backgroundColor: "var(--accent-indigo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                transition: "all 0.3s ease",
                transform: scheduleHover ? "scale(1.05) rotate(-5deg)" : "scale(1)",
              }}
            >
              <IconWrapper icon="mdi:calendar-clock" size={36} color="var(--font-light)" />
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
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                      color: "var(--accent-indigo-dark)",
                      width: 24,
                      height: 24,
                      "&:hover": {
                        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 24%, transparent)",
                      },
                    }}
                  >
                    <IconWrapper icon="mdi:information" size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ color: "var(--accent-indigo)", fontWeight: 600, fontSize: "0.9rem" }}>
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
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 24%, transparent)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: "var(--accent-indigo)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={item.icon} size={18} color="var(--font-light)" />
                </Box>
                <Typography variant="body2" sx={{ color: "var(--font-primary)", fontSize: "0.9rem", fontWeight: 500 }}>
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
              borderColor: "var(--accent-indigo)",
              color: "var(--accent-indigo)",
              fontWeight: 700,
              py: 1.75,
              fontSize: "1.05rem",
              borderRadius: 2.5,
              textTransform: "none",
              borderWidth: 2,
              boxShadow:
                "0 4px 14px color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "var(--accent-indigo-dark)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                borderWidth: 2,
                boxShadow:
                  "0 6px 20px color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
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

