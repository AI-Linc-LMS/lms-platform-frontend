"use client";

import { useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { profileService, UserProfile } from "@/lib/services/profile.service";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";
import { useRouter } from "next/navigation";

export function ProfileCompletionReminder() {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    profileService
      .getUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (!profile || !isVisible) return null;

  const { percentage } = calculateProfileCompletion(profile);

  if (percentage === 100) return null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        boxShadow:
          "0 4px 6px -1px color-mix(in srgb, var(--font-primary) 6%, transparent), 0 2px 4px -1px color-mix(in srgb, var(--font-primary) 4%, transparent)",
        display: "flex",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.3s ease",
        overflow: "hidden",
        "&:hover": {
          boxShadow:
            "0 10px 15px -3px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 4px 6px -2px color-mix(in srgb, var(--font-primary) 6%, transparent)",
          transform: "translateY(-2px)",
          borderColor: "var(--border-light)",
        },
      }}
      onClick={() => router.push("/profile#profile-strength")}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background:
            "linear-gradient(90deg, var(--accent-indigo) 0%, var(--primary-400) 100%)",
        }}
        aria-hidden
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "12px",
          backgroundColor:
            "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
          color: "var(--accent-indigo)",
          mr: 2,
          flexShrink: 0,
          mt: 0.5,
        }}
        aria-hidden
      >
        <IconWrapper icon="mdi:account-arrow-up-outline" size={24} />
      </Box>

      <Box sx={{ flex: 1, pr: 3, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            mb: 0.5,
            lineHeight: 1.2,
            fontSize: "1rem",
          }}
        >
          {t("profile.dashboardStrengthenTitle")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-secondary)",
            fontSize: "0.875rem",
            mb: 2,
            lineHeight: 1.4,
          }}
        >
          {t("profile.dashboardStrengthenBody", { percent: percentage })}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              flex: 1,
              height: 8,
              backgroundColor: "var(--surface)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: "var(--accent-indigo)",
                borderRadius: 4,
                transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "var(--accent-indigo)",
              minWidth: 32,
              fontSize: "0.8125rem",
            }}
          >
            {percentage}%
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: "absolute", top: 12, right: 12 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          aria-label={t("profile.dashboardStrengthenDismiss")}
          sx={{
            color: "var(--font-tertiary)",
            "&:hover": {
              backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, var(--surface))",
              color: "var(--font-secondary)",
            },
          }}
        >
          <IconWrapper icon="mdi:close" size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}
