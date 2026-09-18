"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, Chip, CircularProgress, Typography } from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { SectionCard, InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";
import {
  adminLiveActivitiesService,
  RosterRegistrationState,
} from "@/lib/services/admin/admin-live-activities.service";
import { getZoomApiErrorMessage } from "@/lib/utils/live-session-errors";

interface Props {
  liveClassId: number;
}

/**
 * Register this batch with Zoom so attendance is matched instead of guessed.
 *
 * Zoom reports whatever address the attendee's own account carries. Across production, of the
 * webinar attendance rows that arrived with an email at all, 94% belonged to nobody in that
 * tenant - personal addresses from people whose account here uses a different one. Fewer than 1%
 * of webinar rows were matched on an email, and two thirds were filed as unidentified guests.
 *
 * Registering the roster from here fixes that at the source: Zoom returns a registrant id issued
 * against the address we supplied, so the match is a lookup rather than a name comparison.
 *
 * It is a button, not something that happens when the session is created, because it also issues
 * each student a personal join link. That changes how a class gets in, and nobody should discover
 * it by surprise.
 */
export function RosterRegistrationCard({ liveClassId }: Props) {
  const { showToast } = useToast();
  const [state, setState] = useState<RosterRegistrationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      setState(await adminLiveActivitiesService.getRosterRegistration(liveClassId));
    } catch {
      // A session that cannot carry registrants (a Zoom meeting rather than a webinar) answers
      // with an error here. That is not something to shout about on a tab the admin opened for
      // another reason, so the card simply does not render.
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const report = await adminLiveActivitiesService.syncRosterRegistration(liveClassId);
      const failed = report.failed?.length ?? 0;
      showToast(
        failed
          ? `Registered ${report.newly_registered} of ${report.roster}. ${failed} could not be registered.`
          : `All ${report.linked} students on the roster are registered.`,
        failed ? "warning" : "success",
      );
      await load();
    } catch (error) {
      // The endpoint refuses a Zoom MEETING with a human message ("only webinar sessions can
      // pre-register their roster"), and that message is the useful half of this failure.
      const detail = (error as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      showToast(getZoomApiErrorMessage(detail?.error || detail?.message), "error");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }
  if (!state) return null;

  const { roster_size: roster, registered, with_personal_link: withLink } = state;
  const everyoneRegistered = roster > 0 && registered >= roster;

  return (
    <SectionCard title="Attendance matching" icon="mdi:account-check-outline">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.875rem", color: "var(--font-secondary)" }}>
          Register this batch with Zoom under the email addresses they use here. Attendance then
          matches on the person, not on whatever name they type into Zoom.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={`${roster} on the roster`} />
          <Chip
            size="small"
            color={everyoneRegistered ? "success" : "default"}
            label={`${registered} registered`}
          />
          <Chip size="small" label={`${withLink} have a personal link`} />
          {state.registration_required && (
            <Chip size="small" color="primary" variant="outlined" label="Registration required" />
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant={everyoneRegistered ? "outlined" : "contained"}
            disabled={syncing || roster === 0}
            startIcon={
              syncing
                ? <CircularProgress size={14} />
                : <IconWrapper icon="mdi:account-multiple-plus-outline" size={16} />
            }
            onClick={sync}
            sx={{ textTransform: "none" }}
          >
            {everyoneRegistered ? "Re-check registration" : "Register this batch"}
          </Button>
        </Box>

        {everyoneRegistered ? (
          <InfoCallout icon="mdi:information-outline">
            Editing this webinar in Zoom clears its registrant list. If you change the date, the
            topic or the settings over there, come back and re-check.
          </InfoCallout>
        ) : (
          <InfoCallout icon="mdi:information-outline">
            Students who are not registered can still join on the shared link. Their attendance is
            matched on their display name, which is what this fixes.
          </InfoCallout>
        )}
      </Box>
    </SectionCard>
  );
}
