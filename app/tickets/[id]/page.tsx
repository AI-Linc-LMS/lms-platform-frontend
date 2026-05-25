"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { TicketStatusChip } from "@/components/tickets/TicketStatusChip";
import { TicketThread } from "@/components/tickets/TicketThread";
import { ReopenTicketDialog } from "@/components/tickets/ReopenTicketDialog";
import { config } from "@/lib/config";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { useAuth } from "@/lib/auth/auth-context";
import { ticketService, Ticket } from "@/lib/services/ticket.service";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
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

export default function MyTicketDetailPage() {
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

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reopenOpen, setReopenOpen] = useState(false);

  const load = useCallback(async () => {
    if (!clientId || !ticketId || Number.isNaN(ticketId)) return;
    setLoading(true);
    try {
      const data = await ticketService.get(clientId, ticketId);
      setTicket(data);
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

  const userName =
    ticket?.raised_by?.full_name ||
    user?.first_name ||
    user?.email ||
    "You";
  const userEmail = ticket?.raised_by?.email || user?.email || "";

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 920, mx: "auto" }}>
        <Button
          variant="text"
          onClick={() => router.push("/tickets")}
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--font-secondary)",
            mb: 2.5,
            "&:hover": { backgroundColor: "var(--ticket-row-divider)", color: "var(--ticket-text-strong)" },
          }}
        >
          Back to my tickets
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
            <Typography variant="body2" sx={{ mt: 0.5, color: "var(--font-secondary)" }}>
              This ticket may have been removed, or you don't have access to it.
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
                <TicketStatusChip status={ticket.status} />
              </Stack>

              <Divider sx={{ my: 2, borderColor: "var(--ticket-row-divider)" }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1, sm: 3 }}
                sx={{ color: "var(--font-secondary)", flexWrap: "wrap" }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <IconWrapper icon="mdi:clock-outline" size={14} color="var(--font-tertiary)" />
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
              raiserName={userName}
              raiserEmail={userEmail}
              currentResolutionExtra={
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  sx={{
                    mt: 2.5,
                    pt: 2,
                    borderTop: "1px dashed var(--ticket-success-border)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--ats-success-muted)", flex: 1, fontWeight: 500 }}
                  >
                    Still facing the same issue?
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setReopenOpen(true)}
                    startIcon={<IconWrapper icon="mdi:lock-reset" size={16} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 999,
                      px: 2,
                      py: 0.5,
                      borderColor: "var(--ticket-reopen)",
                      color: "var(--ticket-reopen-strong)",
                      backgroundColor: "var(--card-bg)",
                      "&:hover": {
                        backgroundColor: "var(--ticket-reopen-bg)",
                        borderColor: "var(--ticket-reopen-hover)",
                        color: "var(--warning-strong)",
                      },
                    }}
                  >
                    Reopen ticket
                  </Button>
                </Stack>
              }
              trailing={
                ticket.status !== "RESOLVED" ? (
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "1px dashed var(--border-light)",
                      backgroundColor: "var(--surface)",
                      textAlign: "center",
                      boxShadow: "none",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconWrapper
                        icon="mdi:clock-time-four-outline"
                        size={20}
                        color="var(--font-secondary)"
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "var(--font-secondary)", fontWeight: 500 }}
                      >
                        Our team is on it. You'll get an email and an in‑app
                        notification when this ticket is resolved.
                      </Typography>
                    </Stack>
                  </Paper>
                ) : null
              }
            />
          </Stack>
        )}
      </Box>

      {ticket && (
        <ReopenTicketDialog
          open={reopenOpen}
          ticketId={ticket.id}
          clientId={clientId}
          onClose={() => setReopenOpen(false)}
          onReopened={(updated) => setTicket(updated)}
        />
      )}
    </MainLayout>
  );
}
