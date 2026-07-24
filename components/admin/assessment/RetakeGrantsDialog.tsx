"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@/components/common/LoadingButton";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  AssessmentRetakeGrant,
  grantAssessmentRetake,
  listAssessmentRetakeGrants,
  revokeAssessmentRetake,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";

interface RetakeGrantsDialogProps {
  open: boolean;
  onClose: () => void;
  assessmentId: number | null;
  assessmentTitle: string;
}

export function RetakeGrantsDialog({
  open,
  onClose,
  assessmentId,
  assessmentTitle,
}: RetakeGrantsDialogProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [grants, setGrants] = useState<AssessmentRetakeGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !assessmentId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await listAssessmentRetakeGrants(config.clientId, assessmentId);
        if (!cancelled) setGrants(data);
      } catch (err: any) {
        if (!cancelled) {
          showToast(err?.message || "Failed to load re-attempt grants", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, assessmentId, showToast]);

  const handleGrant = async () => {
    if (!assessmentId) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      showToast("Enter a learner email first.", "warning");
      return;
    }
    try {
      setGranting(true);
      const created = await grantAssessmentRetake(config.clientId, assessmentId, {
        user_email: trimmed,
        note: note.trim() || undefined,
      });
      // Idempotent backend may return existing grant - dedupe by id.
      setGrants((prev) => {
        if (prev.some((g) => g.id === created.id)) return prev;
        return [created, ...prev];
      });
      showToast(`Re-attempt granted to ${created.user_email}`, "success");
      setEmail("");
      setNote("");
    } catch (err: any) {
      showToast(err?.message || "Failed to grant re-attempt", "error");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (grant: AssessmentRetakeGrant) => {
    if (!assessmentId) return;
    try {
      setRevokingId(grant.id);
      await revokeAssessmentRetake(config.clientId, assessmentId, grant.id);
      setGrants((prev) => prev.filter((g) => g.id !== grant.id));
      showToast(`Revoked re-attempt for ${grant.user_email}`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to revoke re-attempt", "error");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:replay" size={22} color="var(--accent-indigo)" />
          <Typography component="span" sx={{ fontWeight: 700 }}>
            Manage re-attempts
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
          {assessmentTitle}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          aria-label="Close"
        >
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Each grant lets one learner re-attempt this assessment once. The grant
          is consumed when they start their new attempt; their latest score will
          replace the previous one on their result page.
        </Alert>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Grant a new re-attempt
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <TextField
            label="Learner email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
            fullWidth
            disabled={granting}
            type="email"
          />
          <TextField
            label="Note (optional, internal)"
            placeholder="e.g., approved after instructor review"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            size="small"
            fullWidth
            disabled={granting}
            inputProps={{ maxLength: 255 }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <LoadingButton
              variant="contained"
              loading={granting}
              loadingText={t("common.submitting")}
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              onClick={handleGrant}
              disabled={!email.trim()}
            >
              Grant re-attempt
            </LoadingButton>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Active grants
          </Typography>
          <Chip
            size="small"
            label={`${grants.length} active`}
            sx={{ bgcolor: "var(--surface)", fontWeight: 600 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : grants.length === 0 ? (
          <Typography variant="body2" sx={{ color: "var(--font-tertiary)", py: 2 }}>
            No active re-attempts. Grant one above to give a specific learner
            another attempt.
          </Typography>
        ) : (
          <Stack spacing={1} divider={<Divider flexItem />}>
            {grants.map((g) => (
              <Box
                key={g.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 0.75,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "var(--font-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.user_name || g.user_email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                    {g.user_email} · granted{" "}
                    {new Date(g.granted_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {g.granted_by_email ? ` by ${g.granted_by_email}` : ""}
                  </Typography>
                  {g.note ? (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "var(--font-secondary)", mt: 0.25 }}
                    >
                      Note: {g.note}
                    </Typography>
                  ) : null}
                </Box>
                <Tooltip title="Revoke">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleRevoke(g)}
                      disabled={revokingId === g.id}
                      sx={{ color: "var(--error-500)" }}
                      aria-label="Revoke re-attempt"
                    >
                      {revokingId === g.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <IconWrapper icon="mdi:close-circle-outline" size={20} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
