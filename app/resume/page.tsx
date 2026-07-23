"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Breadcrumbs, CircularProgress, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { ResumeBuilder } from "@/components/profile/resume/ResumeBuilder";
import { ResumeHero } from "@/components/profile/resume/ResumeHero";
import { profileService, UserProfile } from "@/lib/services/profile.service";
import { buildResumeInitialData } from "@/lib/utils/buildResumeInitialData";

/**
 * Standalone Resume Builder route, reachable directly from the sidebar.
 * Leads with a dashboard-style hero, then the builder seeded from the user's
 * saved profile (same mapping as the /profile Resume tab); the builder still
 * works if the profile fetch fails.
 */
export default function ResumePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await profileService.getUserProfile();
        if (alive) setProfile(data);
      } catch {
        // Non-fatal: ResumeBuilder falls back to an empty/draft resume.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <MainLayout fullWidthContent>
      <Breadcrumbs
        separator="›"
        sx={{ mb: 2, fontSize: "0.85rem", color: "var(--font-tertiary)" }}
      >
        <Link
          href="/dashboard"
          style={{ color: "var(--font-tertiary)", textDecoration: "none" }}
        >
          Home
        </Link>
        <Typography sx={{ fontSize: "0.85rem", color: "var(--font-primary)", fontWeight: 600 }}>
          Resume Builder
        </Typography>
      </Breadcrumbs>

      <ResumeHero />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ResumeBuilder
          initialData={profile ? buildResumeInitialData(profile) : undefined}
        />
      )}
    </MainLayout>
  );
}
