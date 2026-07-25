"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Divider,
  Chip,
  IconButton,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { TicketStatusChip } from "@/components/tickets/TicketStatusChip";
import { TicketThread } from "@/components/tickets/TicketThread";
import { config } from "@/lib/config";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessAdminArea } from "@/lib/auth/role-utils";
import { uploadFile } from "@/lib/services/file-upload.service";
import { ticketService, Ticket } from "@/lib/services/ticket.service";

const MAX_ATTACHMENTS = 5;
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Number(params?.id);
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();
  const clientId = useMemo(
    () => Number(clientInfo?.id ?? config.clientId),
    [clientInfo?.id],
  );
  const isAdmin = canAccessAdminArea(user?.role);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!clientId || !ticketId || Number.isNaN(ticketId)) return;
    setLoading(true);
    try {
      const data = await ticketService.get(clientId, ticketId);
      setTicket(data);
      setNotes(data.admin_resolution_notes || "");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load ticket",
        "error",
      );
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [clientId, ticketId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const additions = Array.from(incoming);
    setFiles((prev) => {
      const room = MAX_ATTACHMENTS - prev.length;
      if (room <= 0) {
        showToast(
          `You can attach up to ${MAX_ATTACHMENTS} files per resolution.`,
          "warning",
        );
        return prev;
      }
      return [...prev, ...additions.slice(0, room)];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleMarkInProgress = async () => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      const updated = await ticketService.updateStatus(
        clientId,
        ticket.id,
        "IN_PROGRESS",
      );
      setTicket(updated);
      showToast("Ticket marked as In Progress", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update status",
        "error",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReopen = async () => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      const updated = await ticketService.updateStatus(
        clientId,
        ticket.id,
        "OPEN",
      );
      setTicket(updated);
      showToast("Ticket reopened", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to reopen ticket",
        "error",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket) return;
    if (!notes.trim()) {
      showToast("Resolution notes are required.", "error");
      return;
    }
    setResolving(true);
    try {
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const uploads = await Promise.all(
          files.map((file) => uploadFile(clientId, file, "report_issue")),
        );
        attachmentUrls = uploads.map((u) => u.url).filter(Boolean);
        setUploading(false);
      }

      const updated = await ticketService.resolve(clientId, ticket.id, {
        admin_resolution_notes: notes.trim(),
        admin_attachments: attachmentUrls,
      });
      setTicket(updated);
      setFiles([]);
      showToast(
        "Ticket resolved. The user has been notified by email and in-app.",
        "success",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to resolve ticket",
        "error",
      );
    } finally {
      setResolving(false);
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <IconWrapper icon="mdi:lock" size={48} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
            Admin access required
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 980, mx: "auto" }}>
        <Button
          variant="text"
          onClick={() => router.push("/admin/tickets")}
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--font-secondary)",
            mb: 2.5,
            "&:hover": { backgroundColor: "var(--ticket-row-divider)", color: "var(--ticket-text-strong)" },
          }}
        >
          Back to ticket management
        </Button>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress size={32} />
          </Box>
        ) : !ticket ? (
          <Paper
            sx={{
              p: 5,
              borderRadius: 3,
              textAlign: "center",
              border: "1px solid var(--border-default)",
              boxShadow: "none",
            }}
          >
            <IconWrapper icon="mdi:ticket-outline" size={52} color="var(--font-tertiary)" />
            <Typography
              variant="h6"
              sx={{ mt: 2, color: "var(--ticket-text-strong)", fontWeight: 700 }}
            >
              Ticket not found
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2.5}>
            {/* Header card */}
            <Paper
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                border: "1px solid var(--border-default)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--font-secondary)",
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        fontSize: "0.7rem",
                      }}
                    >
                      Ticket #{ticket.id}
                    </Typography>
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: "var(--border-light)",
                      }}
                    />
                    <Chip
                      label={ticket.category_display}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        backgroundColor: "var(--surface-indigo-light)",
                        color: "var(--ticket-brand-strong)",
                        border: "1px solid var(--ticket-brand-soft)",
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "var(--ticket-text-strong)",
                      fontSize: { xs: "1.1rem", md: "1.25rem" },
                      lineHeight: 1.35,
                    }}
                  >
                    {ticket.subject}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ flexShrink: 0 }}
                >
                  <TicketStatusChip status={ticket.status} />
                  {ticket.status === "OPEN" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleMarkInProgress}
                      disabled={updatingStatus}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 999,
                      }}
                    >
                      Mark in progress
                    </Button>
                  )}
                  {ticket.status === "RESOLVED" && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={handleReopen}
                      disabled={updatingStatus}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 999,
                      }}
                    >
                      Reopen
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Divider sx={{ my: 2, borderColor: "var(--ticket-row-divider)" }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1, sm: 3 }}
                sx={{ color: "var(--font-secondary)", flexWrap: "wrap" }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <IconWrapper
                    icon="mdi:account-outline"
                    size={14}
                    color="var(--font-tertiary)"
                  />
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    {ticket.raised_by?.full_name ||
                      ticket.raised_by?.email ||
                      "Unknown user"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <IconWrapper
                    icon="mdi:clock-outline"
                    size={14}
                    color="var(--font-tertiary)"
                  />
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    Created {formatDateTime(ticket.created_at)}
                  </Typography>
                </Stack>
                {ticket.resolved_at && (
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <IconWrapper
                      icon="mdi:check-circle-outline"
                      size={14}
                      color="var(--ats-success-muted)"
                    />
                    <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                      Resolved {formatDateTime(ticket.resolved_at)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Paper>

            <TicketThread
              ticket={ticket}
              raiserName={
                ticket.raised_by?.full_name ||
                ticket.raised_by?.email ||
                "Unknown user"
              }
              raiserEmail={ticket.raised_by?.email}
              trailing={ticket.status !== "RESOLVED" ? (
              <Paper
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: "var(--surface-indigo-light)",
                      color: "var(--ticket-brand-strong)",
                    }}
                  >
                    <IconWrapper icon="mdi:reply" size={18} color="var(--ticket-brand-strong)" />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: "var(--ticket-text-strong)", lineHeight: 1.2 }}
                    >
                      Resolve this ticket
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                      The user will be notified by email and in‑app.
                    </Typography>
                  </Box>
                </Stack>

                <TextField
                  label="Resolution notes *"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={5}
                  fullWidth
                  placeholder="Explain what you did to fix the issue, and any follow-up steps the user should take."
                  disabled={resolving || uploading}
                  InputLabelProps={{
                    sx: {
                      color: "var(--font-muted)",
                      fontWeight: 500,
                      "&.Mui-focused": { color: "var(--ticket-brand)" },
                    },
                  }}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "& fieldset": { borderColor: "var(--border-light)" },
                      "&:hover fieldset": { borderColor: "var(--font-tertiary)" },
                    },
                    "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                      color: "var(--ticket-text-strong)",
                      fontWeight: 500,
                    },
                    "& .MuiInputBase-input::placeholder, & .MuiInputBase-inputMultiline::placeholder":
                      { color: "var(--font-secondary)", opacity: 1 },
                  }}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES}
                  onChange={(e) => handleAddFiles(e.target.files)}
                  style={{ display: "none" }}
                />

                <Box
                  onClick={() =>
                    !resolving && !uploading && fileInputRef.current?.click()
                  }
                  sx={{
                    border: "1.5px dashed var(--border-light)",
                    borderRadius: 2,
                    p: 2,
                    cursor: resolving || uploading ? "default" : "pointer",
                    backgroundColor: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor:
                        resolving || uploading ? undefined : "var(--info-accent)",
                      backgroundColor:
                        resolving || uploading ? undefined : "var(--ticket-row-divider)",
                    },
                  }}
                >
                  <IconWrapper
                    icon="mdi:paperclip"
                    size={20}
                    color={files.length > 0 ? "var(--ats-success-muted)" : "var(--font-secondary)"}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--font-primary-dark)", fontWeight: 500 }}
                  >
                    {uploading
                      ? "Uploading attachments..."
                      : files.length > 0
                        ? `${files.length} file${files.length === 1 ? "" : "s"} attached - click to add more`
                        : `Attach images / docs for the user (optional, up to ${MAX_ATTACHMENTS})`}
                  </Typography>
                </Box>

                {files.length > 0 && (
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {files.map((f, i) => (
                      <Box
                        key={`${f.name}-${i}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          p: 1,
                          border: "1px solid var(--border-default)",
                          borderRadius: 1.5,
                          backgroundColor: "var(--card-bg)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            overflow: "hidden",
                          }}
                        >
                          <IconWrapper
                            icon="mdi:file-document-outline"
                            size={18}
                            color="var(--font-secondary)"
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: "var(--ticket-text-strong)",
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeFileAt(i)}
                          disabled={uploading || resolving}
                          aria-label="Remove attachment"
                          sx={{ color: "var(--font-secondary)" }}
                        >
                          <IconWrapper icon="mdi:close" size={16} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mt: 3, justifyContent: "flex-end" }}
                >
                  <Button
                    onClick={() => router.push("/admin/tickets")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "var(--font-primary-dark)",
                      "&:hover": { backgroundColor: "var(--ticket-row-divider)" },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleResolve}
                    disabled={resolving || uploading || !notes.trim()}
                    startIcon={
                      resolving || uploading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <IconWrapper icon="mdi:check" size={18} />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      borderRadius: 999,
                      backgroundColor: "var(--ats-success-muted)",
                      boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
                      "&:hover": {
                        backgroundColor: "var(--ats-success-muted)",
                        boxShadow: "0 6px 16px rgba(22,163,74,0.32)",
                      },
                    }}
                  >
                    {uploading
                      ? "Uploading..."
                      : resolving
                        ? "Resolving..."
                        : "Resolve & notify user"}
                  </Button>
                </Stack>
              </Paper>
            ) : null}
            />
          </Stack>
        )}
      </Box>
    </MainLayout>
  );
}
