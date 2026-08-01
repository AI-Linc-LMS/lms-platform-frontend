"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MainLayout } from "@/components/layout/MainLayout";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { PROFILE } from "@/components/profile/theme/profileTokens";
import { adminProfileService } from "@/lib/services/admin/admin-profile.service";
import { useToast } from "@/components/common/Toast";
import type { UserProfile } from "@/lib/services/profile.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

export default function AdminProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const studentId = params?.id ? Number(params.id) : null;

  const [profile, setProfile] = useState<(UserProfile & { id?: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const loadProfile = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await adminProfileService.getStudentProfile(studentId);
      setProfile(data);
    } catch {
      showToast(t("profile.failedToLoad"), "error");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            width: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Was #0a66c2, a hardcoded LinkedIn blue that appeared nowhere else in the product. */}
            <CircularProgress size={48} sx={{ color: PROFILE.violet }} />
          </motion.div>
        </Box>
      </MainLayout>
    );
  }

  if (!profile || !studentId) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "1rem" }}>
            {t("profile.notFound")}
          </Typography>
          <Button
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            {t("common.back")}
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidthContent>
      {/* Same palette scope as the student page. This view deliberately keeps the LinkedIn
          shape (cover, then overlapping avatar, then facts) rather than the student page's
          completion hero: an admin inspecting someone else's profile should not be coached
          to finish it, and a "Finish your profile" CTA would be meaningless here. */}
      <Box
        className="profile-surface"
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: PROFILE.canvas,
          pb: 6,
          px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
          pt: 2,
        }}
      >
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          onClick={() => router.back()}
          sx={{
            textTransform: "none",
            color: PROFILE.inkMuted,
            fontWeight: 700,
            fontSize: "0.8125rem",
            borderRadius: 999,
            mb: 2,
            px: 1.5,
            "&:hover": { backgroundColor: "#eef2f7" },
          }}
        >
          {t("common.back")}
        </Button>

        <PublicProfileView
          profile={profile}
          variant="admin"
          organizationName={clientInfo ? clientInfo.name || "AI-Linc Learning" : undefined}
        />
      </Box>
    </MainLayout>
  );
}
