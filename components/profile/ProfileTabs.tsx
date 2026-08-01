"use client";

import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PROFILE } from "./theme/profileTokens";

/**
 * The Profile / Resume / Saved Resumes switcher.
 *
 * Pulled out of app/profile/page.tsx so the page reads as layout. Keeps the sliding pill
 * (it survived the redesign because it is genuinely good) but drops the inset shadow and
 * retunes the palette to the dashboard's hairline + violet.
 */

const TABS = [
  { id: 0, icon: "mdi:account-circle-outline", labelKey: "profile.tabProfile" },
  { id: 1, icon: "mdi:file-document-outline", labelKey: "profile.tabResume" },
  { id: 2, icon: "mdi:file-document-multiple-outline", labelKey: "profile.tabSavedResume" },
] as const;

export function ProfileTabs({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation("common");

  return (
    <Box
      role="tablist"
      sx={{
        display: "flex",
        width: "100%",
        maxWidth: 560,
        mb: 2.5,
        p: 0.5,
        borderRadius: 3.5,
        bgcolor: "#f1f5f9",
        border: `1px solid ${PROFILE.hairline}`,
      }}
    >
      <Box sx={{ display: "flex", flex: 1, position: "relative", borderRadius: 3 }}>
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "calc(33.333% - 2px)",
            borderRadius: 10,
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(16,24,40,0.10)",
          }}
          animate={{ left: value === 0 ? 0 : value === 1 ? "calc(33.333% + 1px)" : "calc(66.666% + 2px)" }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
        />
        {TABS.map((tab) => {
          const active = value === tab.id;
          return (
            <Box
              key={tab.id}
              component="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                py: 1.15,
                px: 1.5,
                border: "none",
                borderRadius: "10px",
                backgroundColor: "transparent",
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.8125rem",
                transition: "color 0.2s ease",
                color: active ? PROFILE.violet : PROFILE.inkFaint,
                "&:hover": { color: active ? PROFILE.violet : PROFILE.inkMuted },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: `0 0 0 2px #f1f5f9, 0 0 0 4px ${PROFILE.violet}`,
                },
              }}
            >
              <IconWrapper icon={tab.icon} size={18} color={active ? PROFILE.violet : PROFILE.inkFaint} />
              <span>{t(tab.labelKey)}</span>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
