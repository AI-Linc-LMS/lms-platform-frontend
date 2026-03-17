"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MainLayout } from "@/components/layout/MainLayout";
import { CoverPhoto } from "@/components/profile/CoverPhoto";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { UserDetailsCard } from "@/components/profile/UserDetailsCard";
import { AdminProfileSectionsReadOnly } from "@/components/admin/AdminProfileSectionsReadOnly";
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
            <CircularProgress size={48} sx={{ color: "#0a66c2" }} />
          </motion.div>
        </Box>
      </MainLayout>
    );
  }

  if (!profile || !studentId) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Typography sx={{ color: "#6b7280", fontSize: "1rem" }}>
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

  const location =
    profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : profile.city || profile.state || "";

  return (
    <MainLayout fullWidthContent>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #f1f5f9 0%, #f8fafc 24%, #ffffff 100%)",
          pb: 6,
        }}
      >
        {/* Back button */}
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
            pt: 2,
          }}
        >
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.back()}
            sx={{
              textTransform: "none",
              color: "#64748b",
              fontWeight: 600,
              "&:hover": { backgroundColor: "rgba(100, 116, 139, 0.08)" },
            }}
          >
            {t("common.back")}
          </Button>
        </Box>

        {/* Hero: Cover + Profile */}
        <Box sx={{ width: "100%", position: "relative" }}>
          <CoverPhoto coverPhotoUrl={profile.cover_photo_url ?? undefined} />
          <Box
            sx={{
              width: "100%",
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
              pt: 0,
              pb: 3,
              backgroundColor: "#ffffff",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <ProfileHeader
              userName={`${profile.first_name} ${profile.last_name}`}
              profilePicUrl={profile.profile_picture}
              role={profile.role || t("profile.student")}
              headline={profile.headline ?? undefined}
              location={location}
            />
          </Box>
        </Box>

        {/* Profile Content */}
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
            pt: 3,
            pb: 1,
          }}
        >
          <Box sx={{ width: "100%", pt: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", xl: "340px 1fr" },
                  gap: { xs: 3, lg: 4 },
                  alignItems: "start",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    order: { xs: 2, xl: 1 },
                  }}
                >
                  <UserDetailsCard
                    username={profile.username}
                    emailAddress={profile.email}
                    socialLinks={{
                      github: profile.social_links?.github || "",
                      linkedin: profile.social_links?.linkedin || "",
                    }}
                    externalProfiles={{
                      portfolio_website_url: profile.portfolio_website_url ?? undefined,
                      leetcode_url: profile.leetcode_url ?? undefined,
                      hackerrank_url: profile.hackerrank_url ?? undefined,
                      kaggle_url: profile.kaggle_url ?? undefined,
                      medium_url: profile.medium_url ?? undefined,
                    }}
                  />
                  {clientInfo && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                        Organization
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {clientInfo.name || "AI-Linc Learning"}
                      </Typography>
                    </Paper>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    order: { xs: 1, xl: 2 },
                    minWidth: 0,
                  }}
                >
                  <ProfileSummary profile={profile} readOnly />
                  <AdminProfileInfoCard profile={profile} />
                  <AdminProfileSectionsReadOnly profile={profile} />
                </Box>
              </Box>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}

function AdminProfileInfoCard({
  profile,
}: {
  profile: UserProfile;
}) {
  const { t } = useTranslation("common");
  const fields = [
    { label: t("profile.collegeName"), value: profile.college_name },
    { label: t("profile.degreeType"), value: profile.degree_type },
    { label: t("profile.branch"), value: profile.branch },
    { label: t("profile.graduationYear"), value: profile.graduation_year },
    { label: t("profile.phoneNumber"), value: profile.phone_number },
    { label: t("profile.dateOfBirth"), value: profile.date_of_birth },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {t("profile.personalInformation")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {fields.map(({ label, value }) => (
          <Box key={label}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: "#111827", mt: 0.25, display: "block" }}>
              {value || "-"}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
