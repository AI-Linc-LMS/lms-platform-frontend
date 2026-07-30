"use client";

import { useEffect, useState } from "react";
import { ProfileLockModal } from "@/components/common/ProfileLockModal";
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
  const { blocked: gateBlocked, showLock, reportError: reportProfileLock } = useModuleLocked("resume");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await profileService.getUserProfile();
        if (alive) setProfile(data);
      } catch (err) {
        // Was swallowed entirely, which is part of why nothing appeared on this page at all.
        reportProfileLock(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (showLock) {
    // The hero stays so the learner still knows which module they are looking at; the modal sits
    // over it. Resume had NO backend gate at all until now, so this page previously just opened.
    return (
      <MainLayout fullWidthContent>
        <ResumeHero />
        <ProfileLockModal open moduleLabel="Resume" />
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
