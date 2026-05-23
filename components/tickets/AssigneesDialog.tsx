"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  ticketService,
  TicketAssignee,
} from "@/lib/services/ticket.service";

interface Props {
  open: boolean;
  clientId: number;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AssigneesDialog({ open, clientId, onClose }: Props) {
  const { showToast } = useToast();
  const [assignees, setAssignees] = useState<TicketAssignee[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const list = await ticketService.listAssignees(clientId);
      setAssignees(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load assignees",
        "error",
      );
      setAssignees([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, showToast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const reset = () => {
    setEmail("");
    setName("");
  };

  const handleClose = () => {
    if (adding || removingId !== null) return;
    reset();
    onClose();
  };

  const handleAdd = async () => {
    const cleaned = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleaned)) {
      showToast("Enter a valid email address.", "error");
      return;
    }
    setAdding(true);
    try {
      const created = await ticketService.addAssignee(clientId, {
        email: cleaned,
        name: name.trim() || undefined,
      });
      setAssignees((prev) => [created, ...prev]);
      reset();
      showToast(
        `${created.email} will now be notified when students raise tickets.`,
        "success",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add assignee",
        "error",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (assignee: TicketAssignee) => {
    setRemovingId(assignee.id);
    try {
      await ticketService.removeAssignee(clientId, assignee.id);
      setAssignees((prev) => prev.filter((a) => a.id !== assignee.id));
      showToast(`Removed ${assignee.email}.`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to remove assignee",
        "error",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const initialsFor = (a: TicketAssignee) => {
    const source = (a.name || a.email).trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
          fontWeight: 700,
          fontSize: "1.15rem",
          color: "var(--ticket-text-strong)",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, var(--ticket-cta-green) 0%, var(--course-cta) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(22,163,74,0.28)",
          }}
        >
          <IconWrapper icon="mdi:account-group" size={22} color="var(--font-light)" />
        </Box>
        Support assignees
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          sx={{ color: "var(--font-muted)", fontWeight: 500, mb: 2 }}
        >
          Anyone you list here will receive an email from AI Linc each time a
          student raises a new ticket. The email links straight to the ticket
          so they can jump in and respond.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
            gap: 1.25,
            mb: 2.5,
          }}
        >
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="support@yourcompany.com"
            type="email"
            size="small"
            disabled={adding}
            InputLabelProps={{
              sx: {
                color: "var(--font-muted)",
                fontWeight: 500,
                "&.Mui-focused": { color: "var(--ticket-cta-green)" },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "& fieldset": { borderColor: "var(--border-light)" },
                "&:hover fieldset": { borderColor: "var(--font-tertiary)" },
              },
              "& .MuiInputBase-input": {
                color: "var(--ticket-text-strong)",
                fontWeight: 500,
              },
            }}
          />
          <TextField
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Priya Sharma"
            size="small"
            disabled={adding}
            InputLabelProps={{
              sx: {
                color: "var(--font-muted)",
                fontWeight: 500,
                "&.Mui-focused": { color: "var(--ticket-cta-green)" },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "& fieldset": { borderColor: "var(--border-light)" },
                "&:hover fieldset": { borderColor: "var(--font-tertiary)" },
              },
              "& .MuiInputBase-input": {
                color: "var(--ticket-text-strong)",
                fontWeight: 500,
              },
            }}
          />
          <Button
            onClick={handleAdd}
            disabled={adding || !email.trim()}
            variant="contained"
            startIcon={
              adding ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:plus" size={16} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              borderRadius: 1.5,
              backgroundColor: "var(--ticket-cta-green)",
              color: "var(--font-light)",
              boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
              "&:hover": {
                backgroundColor: "var(--ticket-cta-green-hover)",
                boxShadow: "0 6px 16px rgba(22,163,74,0.32)",
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--border-default)",
                color: "var(--font-tertiary)",
              },
            }}
          >
            {adding ? "Adding…" : "Add"}
          </Button>
        </Box>

        <Divider sx={{ borderColor: "var(--ticket-row-divider)", mb: 2 }} />

        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "var(--font-secondary)",
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          Current assignees
          {assignees.length > 0 && (
            <Box
              component="span"
              sx={{
                ml: 0.75,
                px: 0.875,
                py: 0.125,
                borderRadius: 999,
                fontSize: "0.65rem",
                fontWeight: 700,
                backgroundColor: "var(--ticket-cta-green-soft)",
                color: "var(--ticket-cta-green-deep)",
              }}
            >
              {assignees.length}
            </Box>
          )}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : assignees.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              border: "1px dashed var(--border-light)",
              borderRadius: 2,
              backgroundColor: "var(--surface)",
            }}
          >
            <IconWrapper
              icon="mdi:email-off-outline"
              size={28}
              color="var(--font-tertiary)"
            />
            <Typography
              variant="body2"
              sx={{ mt: 1, color: "var(--font-muted)", fontWeight: 500 }}
            >
              No assignees yet
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "var(--font-secondary)" }}
            >
              Add an email above to start receiving ticket notifications.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {assignees.map((a) => (
              <Box
                key={a.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  border: "1px solid var(--border-default)",
                  borderRadius: 2,
                  backgroundColor: "var(--card-bg)",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "var(--ticket-cta-green)",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.10)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    backgroundColor: "var(--ticket-cta-green-soft)",
                    color: "var(--ticket-cta-green-hover)",
                  }}
                >
                  {initialsFor(a)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {a.name && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "var(--ticket-text-strong)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.name}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "var(--font-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.email}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleRemove(a)}
                  disabled={removingId === a.id}
                  aria-label={`Remove ${a.email}`}
                  sx={{
                    color: "var(--font-secondary)",
                    "&:hover": {
                      color: "var(--error-500)",
                      backgroundColor: "var(--error-100)",
                    },
                  }}
                >
                  {removingId === a.id ? (
                    <CircularProgress size={16} />
                  ) : (
                    <IconWrapper icon="mdi:trash-can-outline" size={18} />
                  )}
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={adding || removingId !== null}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 999,
            px: 3,
            color: "var(--font-primary-dark)",
            borderColor: "var(--border-light)",
            "&:hover": {
              backgroundColor: "var(--ticket-row-divider)",
              borderColor: "var(--font-tertiary)",
            },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
