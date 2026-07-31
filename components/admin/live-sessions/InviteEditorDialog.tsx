"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { useToast } from "@/components/common/Toast";
import { adminLiveActivitiesService } from "@/lib/services/admin/admin-live-activities.service";

/**
 * Edit the invite before sending it.
 *
 * Two things this deliberately does NOT do:
 *
 * It does not open on an empty box. The editor is seeded with the invite as a student would
 * actually receive it, because an admin handed a blank field writes a bare paragraph and loses the
 * join button, the times and the branding they never had to think about.
 *
 * It does not save separately from sending. The body travels WITH the send, because the server
 * persists before it queues — a separate "save" step is a race the admin loses, and the invite
 * goes out as the old copy while the new copy silently becomes the wording for reminders only.
 */

interface Props {
  open: boolean;
  liveClassId: number;
  /** Shown on the confirm button so the admin knows how many people this reaches. */
  recipientCount?: number;
  onClose: () => void;
  onSent: (message: string) => void;
}

export function InviteEditorDialog({
  open,
  liveClassId,
  recipientCount,
  onClose,
  onSent,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const res = await adminLiveActivitiesService.getInviteTemplate(liveClassId);
        if (cancelled) return;
        const data = res.data;
        setSubject(data?.subject ?? "");
        setPlaceholders(data?.placeholders ?? []);
        // Only seed the editor when the session has its own wording. The default invite is a
        // full branded document; dropping that into a rich-text field would let an admin
        // accidentally edit the layout rather than the message.
        setBodyHtml(data?.body_html ?? "");
      } catch {
        if (!cancelled) setError("Couldn't load this session's invite.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, liveClassId]);

  const send = useCallback(async () => {
    setSending(true);
    try {
      const res = await adminLiveActivitiesService.sendInvites(liveClassId, {
        subject: subject.trim(),
        body_html: bodyHtml.trim(),
      });
      if (res.status === "success") {
        onSent(res.message || "Invites are on their way.");
        onClose();
      } else {
        // The server rejects a body it will not send (scripts, oversized paste). Surface its
        // reason rather than a generic failure — the admin can act on "remove the script tag".
        showToast(res.message || "Could not send the invites.", "error");
      }
    } catch (e) {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(detail || "Could not send the invites.", "error");
    } finally {
      setSending(false);
    }
  }, [liveClassId, subject, bodyHtml, onSent, onClose, showToast]);

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
        Edit the invite
        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 500, mt: 0.5 }}>
          What you write here becomes this session&apos;s wording — its reminders will use it too.
          Leave it empty to send the standard invite.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={26} />
          </Box>
        ) : error ? (
          <Typography sx={{ color: "error.main", py: 2 }}>{error}</Typography>
        ) : (
          <Stack spacing={2.5}>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: 255 } }}
              helperText="Leave as-is to keep the default subject."
            />

            <RichTextEditor
              label="Message"
              value={bodyHtml}
              onChange={setBodyHtml}
              minHeight={220}
              maxHeight={420}
              placeholder="Add anything students should know before the session — what it covers, what to bring, prerequisites…"
              helperText="The join button, date, time and your branding are added automatically. You're writing the message, not the whole email."
            />

            {placeholders.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, mb: 0.75 }}>
                  Insert a value
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {placeholders.map((ph) => (
                    <Chip
                      key={ph}
                      size="small"
                      label={`{${ph}}`}
                      onClick={() => setBodyHtml((b) => `${b}{${ph}}`)}
                      sx={{ fontFamily: "monospace", fontSize: "0.72rem", cursor: "pointer" }}
                    />
                  ))}
                </Stack>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.75 }}>
                  Each is replaced when the email is sent. Anything else in braces is left exactly
                  as you typed it.
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={sending} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void send()}
          disabled={loading || sending || !!error}
          startIcon={
            sending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:email-fast-outline" size={16} />
            )
          }
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {recipientCount
            ? `Send to ${recipientCount} student${recipientCount === 1 ? "" : "s"}`
            : "Send invites"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
