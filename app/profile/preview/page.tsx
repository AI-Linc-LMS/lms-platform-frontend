"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { PROFILE, ON_DARK, HERO_BG, HERO_SHADOW } from "@/components/profile/theme/profileTokens";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { profileService, type UserProfile } from "@/lib/services/profile.service";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

/**
 * "See exactly how my public profile looks."
 *
 * Renders PublicProfileView, the same component app/admin/profile/[id] uses, against the
 * student's own data. Sharing the component rather than rebuilding a lookalike is the whole
 * point: it is what makes "exactly" true, and keeps it true as the read-only view changes.
 *
 * Read-only by construction, not by a flag: no save handler is threaded in, and
 * PublicProfileView passes no edit callbacks down, so nothing here can mutate the profile.
 */
export default function ProfilePreviewPage() {
  const { t } = useTranslation("common");
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Deliberately the raw API profile, with no localStorage merge. The edit page merges
      // unsaved local drafts back in so you do not lose typing; showing those here would be
      // a lie, because nobody else can see a draft that never reached the server.
      setProfile(await profileService.getUserProfile());
    } catch {
      showToast(t("profile.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <CircularProgress size={48} sx={{ color: PROFILE.violet }} />
          </motion.div>
        </Box>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Typography sx={{ color: PROFILE.inkMuted }}>{t("profile.notFound")}</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidthContent>
      <Box
        className="profile-surface"
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: PROFILE.canvas,
          pb: 6,
          px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
          pt: 2.5,
        }}
      >
        {/* A dark bar, not a light one: it has to be obvious at a glance that this is a
            preview and not the editable page, or a student will try to edit here and think
            the page is broken. */}
        <Box
          sx={{
            borderRadius: 3,
            background: HERO_BG,
            boxShadow: HERO_SHADOW,
            color: "#fff",
            px: { xs: 2, sm: 2.5 },
            py: 1.75,
            mb: 2.5,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                bgcolor: ON_DARK.fillStrong,
                border: `1px solid ${ON_DARK.border}`,
              }}
            >
              <IconWrapper icon="mdi:earth" size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
                {t("profile.previewTitle", { defaultValue: "This is your public profile" })}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: ON_DARK.textFaint, mt: 0.25 }}>
                {t("profile.previewSubtitle", {
                  defaultValue: "Exactly what instructors and recruiters see. Nothing here is editable.",
                })}
              </Typography>
            </Box>
            <Box
              component="button"
              onClick={() => push("/profile")}
              sx={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: 999,
                border: `1px solid ${ON_DARK.border}`,
                bgcolor: ON_DARK.fillStrong,
                color: "#fff",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.8125rem",
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(255,255,255,0.24)" },
                "&:focus-visible": { outline: "none", boxShadow: `0 0 0 2px ${PROFILE.night}, 0 0 0 4px #fff` },
              }}
            >
              <IconWrapper icon="mdi:pencil-outline" size={16} />
              {t("profile.backToEditing", { defaultValue: "Back to editing" })}
            </Box>
          </Stack>
        </Box>

        <PublicProfileView
          profile={profile}
          variant="preview"
          organizationName={clientInfo ? clientInfo.name || "AI-Linc Learning" : undefined}
        />
      </Box>
    </MainLayout>
  );
}
