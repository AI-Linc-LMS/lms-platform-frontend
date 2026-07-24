"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Button, Chip, Divider } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminLiveActivitiesService,
  LiveActivity,
} from "@/lib/services/admin/admin-live-activities.service";
import { AssignMeetingDialog } from "./AssignMeetingDialog";

export interface ImportedMeetingsInboxHandle {
  refresh: () => void;
}

interface ImportedMeetingsInboxProps {
  /** Called after a meeting is assigned, so the parent can refresh the main list. */
  onAssigned?: () => void;
  formatDateTime: (dateString: string) => string;
}

/**
 * Inbox of meetings created directly in Zoom (imported via webhook/backfill) that
 * are not yet assigned to a course. Renders nothing when the inbox is empty.
 */
export const ImportedMeetingsInbox = forwardRef<
  ImportedMeetingsInboxHandle,
  ImportedMeetingsInboxProps
>(function ImportedMeetingsInbox({ onAssigned, formatDateTime }, ref) {
  const { t } = useTranslation("common");
  const [meetings, setMeetings] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LiveActivity | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminLiveActivitiesService
      .getUnassigned()
      .then((data) => setMeetings(Array.isArray(data) ? data : []))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Webinars/meetings created directly in Zoom arrive via the webhook a few seconds later;
    // poll so they surface without a manual page reload, and refresh the moment the admin
    // switches back to this tab (the common "created it in the Zoom tab" flow).
    const interval = setInterval(load, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useImperativeHandle(ref, () => ({ refresh: load }), [load]);

  if (!loading && meetings.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        bgcolor: "color-mix(in srgb, var(--accent-indigo) 5%, var(--surface) 95%)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <IconWrapper icon="mdi:inbox-arrow-down" size={20} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t("adminLiveSessions.importedInboxTitle", "Imported from Zoom")}
        </Typography>
        <Chip size="small" label={meetings.length} sx={{ ml: 0.5 }} />
      </Box>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1.5 }}>
        {t(
          "adminLiveSessions.importedInboxHint",
          "These meetings were created directly in Zoom. Assign each one to a course so students see it."
        )}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {meetings.map((m, idx) => (
          <Box key={m.id}>
            {idx > 0 && <Divider />}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                py: 1.25,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {m.topic_name}
                  {m.zoom_meeting_type === "webinar" && (
                    <Chip size="small" label={t("adminLiveSessions.webinar", "Webinar")} sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                  {m.class_datetime ? formatDateTime(m.class_datetime) : "-"}
                  {typeof m.duration_minutes === "number" ? ` · ${m.duration_minutes} min` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                {m.zoom_join_url && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(m.zoom_join_url!, "_blank")}
                    startIcon={<IconWrapper icon="mdi:link-variant" size={16} />}
                  >
                    {t("adminLiveSessions.joinLink", "Join link")}
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setSelected(m);
                    setAssignOpen(true);
                  }}
                  sx={{
                    bgcolor: "var(--accent-indigo)",
                    color: "var(--font-light)",
                    "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                  }}
                >
                  {t("adminLiveSessions.assign", "Assign")}
                </Button>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <AssignMeetingDialog
        meeting={selected}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSuccess={() => {
          load();
          onAssigned?.();
        }}
      />
    </Box>
  );
});
