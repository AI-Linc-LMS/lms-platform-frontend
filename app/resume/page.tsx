"use client";

import { useEffect, useState } from "react";
import { ProfileLockedGate } from "@/components/common/ProfileLockedGate";
import { useModuleLocked } from "@/lib/contexts/ProfileGateContext";
import { Box, CircularProgress } from "@mui/material";
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
  const { locked: profileLocked, ready: gateReady } = useModuleLocked("resume");

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

  if (gateReady && profileLocked) {
    // Server-enforced too — this only saves a wasted 403 and explains the fix. The hero stays so
    // the learner still knows which module they are looking at.
    return (
      <MainLayout fullWidthContent>
        <ResumeHero />
        <ProfileLockedGate moduleLabel="Resume" />
      </MainLayout>
    );
  }

  return (
    <MainLayout fullWidthContent>
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
