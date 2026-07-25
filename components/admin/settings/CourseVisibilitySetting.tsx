"use client";

import { useState } from "react";
import { Box, FormControlLabel, Paper, Switch, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { isCourseManagerRole } from "@/lib/auth/auth-utils";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useHideAvailableCourses, updateHideAvailableCourses } from "@/lib/admin/courseVisibility";

/**
 * Tenant-wide "Student course visibility" toggle. Relocated from the (now
 * removed) manual course-builder page into admin Settings. Course managers don't
 * manage this tenant-level flag, so the card hides for them.
 */
export function CourseVisibilitySetting() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const hideAvailableCourses = useHideAvailableCourses();
  const { refreshClientInfo } = useClientInfo();
  const [saving, setSaving] = useState(false);

  if (isCourseManagerRole(user?.role)) return null;

  const handleToggle = async (next: boolean) => {
    try {
      setSaving(true);
      await updateHideAvailableCourses(next);
      await refreshClientInfo();
      showToast(
        next
          ? "Available courses are now hidden from students."
          : "Available courses are now visible to students.",
        "success",
      );
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: string } }; message?: string };
      showToast(e?.response?.data?.error || e?.message || "Failed to update course visibility.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
        <Box
          sx={{
            width: 34, height: 34, borderRadius: 2, display: "grid", placeItems: "center", flexShrink: 0,
            color: "var(--accent-purple)", bgcolor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
          }}
        >
          <IconWrapper icon="mdi:eye-off-outline" size={18} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "var(--font-primary)" }}>
          Student course visibility
        </Typography>
      </Box>
      <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mb: 1.75, ml: 0.25 }}>
        When on, the student course module only shows enrolled courses - the &quot;Available Courses&quot; tab is
        hidden. Applies to every student of this tenant.
      </Typography>
      <FormControlLabel
        sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
        control={
          <Switch
            checked={hideAvailableCourses}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={saving}
            color="primary"
          />
        }
        label={
          <Typography variant="body2" fontWeight={600}>
            {saving ? "Saving…" : hideAvailableCourses ? "Available courses hidden" : "Available courses visible"}
          </Typography>
        }
        labelPlacement="start"
      />
    </Paper>
  );
}
