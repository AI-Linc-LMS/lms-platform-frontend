"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Pagination,
  Chip,
} from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import {
  ModulePageHeader,
  HeaderActionButton,
} from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ReportIssueDialog } from "@/components/common/ReportIssueDialog";
import { TicketStatusChip } from "@/components/tickets/TicketStatusChip";
import { TicketHeroIcon } from "@/components/tickets/TicketHeroIcon";
import { config } from "@/lib/config";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  ticketService,
  Ticket,
  TicketStatus,
} from "@/lib/services/ticket.service";

const PAGE_SIZE = 10;

type StatusTab = "ALL" | TicketStatus | "REOPENED";

const TABS: Array<{ value: StatusTab; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REOPENED", label: "Reopened" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function UpdatedCell({ ticket }: { ticket: Ticket }) {
  if (ticket.status === "RESOLVED" && ticket.resolved_at) {
    return (
      <Box
        component="span"
        sx={{ color: "var(--font-secondary)", fontSize: "0.825rem" }}
      >
        {formatDate(ticket.resolved_at)}
      </Box>
    );
  }
  if (ticket.reopened_at) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "var(--font-secondary)",
          fontSize: "0.825rem",
        }}
      >
        <IconWrapper icon="mdi:lock-reset" size={14} color="var(--ticket-reopen)" />
        {formatDate(ticket.updated_at || ticket.reopened_at)}
      </Box>
    );
  }
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        color: "var(--font-tertiary)",
      }}
      title="Awaiting first response"
    >
      <IconWrapper icon="mdi:clock-outline" size={16} color="var(--font-tertiary)" />
    </Box>
  );
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { clientInfo } = useClientInfo();
  const { showToast } = useToast();

  const clientId = useMemo(
    () => Number(clientInfo?.id ?? config.clientId),
    [clientInfo?.id],
  );

  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await ticketService.listMine(clientId, {
        status:
          statusTab === "ALL" || statusTab === "REOPENED" ? "" : statusTab,
        reopened: statusTab === "REOPENED" ? true : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTickets(res.results);
      setTotal(res.count);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load tickets",
        "error",
      );
      setTickets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [clientId, statusTab, page, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (_: React.SyntheticEvent, value: StatusTab) => {
    setStatusTab(value);
    setPage(1);
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Support"
        title="My Tickets"
        description="Raise support requests and track their status through to resolution."
        accent="amber"
        icon="mdi:ticket-confirmation-outline"
        action={
          <HeaderActionButton
            icon="mdi:plus"
            onClick={() => setDialogOpen(true)}
          >
            New ticket
          </HeaderActionButton>
        }
      />
      <Paper
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            mb: 2,
            border: "1px solid var(--border-default)",
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            position: "relative",
            backgroundColor: "var(--card-bg)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, var(--ticket-brand) 0%, var(--accent-indigo) 100%)",
              zIndex: 1,
            },
          }}
        >
          <Tabs
            data-tour-id="tickets-tabs"
            value={statusTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: "1px solid var(--ticket-row-divider)",
              px: 1,
              minHeight: 48,
              backgroundColor: "var(--card-bg)",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "var(--font-secondary)",
                minHeight: 48,
                "&.Mui-selected": { color: "var(--ticket-brand)" },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--ticket-brand)",
                height: 3,
                borderRadius: 3,
              },
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} />
            ))}
          </Tabs>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 8,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : tickets.length === 0 ? (
            statusTab === "ALL" ? (
              <Box
                sx={{
                  py: { xs: 6, md: 8 },
                  px: { xs: 3, md: 5 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  background:
                    "radial-gradient(ellipse at top, var(--info-surface) 0%, var(--card-bg) 65%)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.5,
                    filter:
                      "drop-shadow(0 6px 14px rgba(66,133,244,0.22))",
                  }}
                >
                  <TicketHeroIcon size={148} color="var(--ticket-brand)" />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "var(--ticket-text-strong)",
                    fontSize: { xs: "1.125rem", md: "1.25rem" },
                  }}
                >
                  You haven't raised any support tickets yet
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1.25,
                    color: "var(--font-secondary)",
                    maxWidth: 480,
                    lineHeight: 1.6,
                  }}
                >
                  Have a question or running into an issue? Open a ticket and
                  our support team will get back to you - usually within one
                  business day. You'll be notified by email and in‑app the
                  moment we respond.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => setDialogOpen(true)}
                  startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                  sx={{
                    mt: 3.5,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1.1,
                    borderRadius: 999,
                    backgroundColor: "var(--ticket-brand)",
                    boxShadow: "0 6px 16px rgba(66,133,244,0.25)",
                    "&:hover": {
                      backgroundColor: "var(--ticket-brand-hover)",
                      boxShadow: "0 8px 20px rgba(66,133,244,0.32)",
                    },
                  }}
                >
                  Raise a ticket
                </Button>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ mt: 2.5, color: "var(--font-secondary)" }}
                >
                  <IconWrapper
                    icon="mdi:clock-fast"
                    size={14}
                    color="var(--font-secondary)"
                  />
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    Average first response &lt; 24h on business days
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  py: { xs: 6, md: 8 },
                  px: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    opacity: 0.85,
                  }}
                >
                  <TicketHeroIcon size={120} color="var(--font-tertiary)" />
                </Box>
                <Typography
                  variant="body1"
                  sx={{ color: "var(--font-primary-dark)", fontWeight: 600 }}
                >
                  {statusTab === "REOPENED"
                    ? "No reopened tickets"
                    : `No ${
                        statusTab === "OPEN"
                          ? "open"
                          : statusTab === "IN_PROGRESS"
                            ? "in‑progress"
                            : "resolved"
                      } tickets`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.75, color: "var(--font-secondary)", maxWidth: 380 }}
                >
                  {statusTab === "RESOLVED"
                    ? "You don't have any resolved tickets yet. Once our team closes a ticket it will appear here."
                    : statusTab === "REOPENED"
                      ? "You haven't reopened any tickets. If a resolution doesn't fix your issue, you can reopen it from the ticket detail page."
                      : "Nothing here right now. Switch tabs to see your other tickets, or raise a new one if you need help."}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setDialogOpen(true)}
                  startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                  sx={{
                    mt: 3,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2.5,
                    py: 1,
                    borderRadius: 999,
                    backgroundColor: "var(--ticket-brand)",
                    boxShadow: "0 4px 12px rgba(66,133,244,0.22)",
                    "&:hover": {
                      backgroundColor: "var(--ticket-brand-hover)",
                    },
                  }}
                >
                  Raise a ticket
                </Button>
              </Box>
            )
          ) : (
            <>
              <TableContainer data-tour-id="tickets-list">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "var(--card-bg)" }}>
                      {["ID", "Subject", "Category", "Status", "Created", "Updated"].map(
                        (h) => (
                          <TableCell
                            key={h}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              color: "var(--font-secondary)",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              borderBottom: "1px solid var(--border-default)",
                              py: 1.75,
                              backgroundColor: "var(--card-bg)",
                            }}
                          >
                            {h}
                          </TableCell>
                        ),
                      )}
                      <TableCell
                        sx={{
                          borderBottom: "1px solid var(--border-default)",
                          backgroundColor: "var(--card-bg)",
                        }}
                      />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tickets.map((t) => (
                      <TableRow
                        key={t.id}
                        sx={{
                          cursor: "pointer",
                          transition: "background-color 0.12s ease",
                          "&:hover": { backgroundColor: "var(--surface)" },
                          "& .MuiTableCell-root": {
                            borderBottom: "1px solid var(--ticket-row-divider)",
                          },
                        }}
                        onClick={() => router.push(`/tickets/${t.id}`)}
                      >
                        <TableCell
                          sx={{
                            color: "var(--font-secondary)",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          #{t.id}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>
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
                            {t.subject}
                          </Typography>
                          {t.description && t.description !== t.subject && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--font-secondary)",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.category_display}
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
                        </TableCell>
                        <TableCell>
                          <TicketStatusChip status={t.status} />
                        </TableCell>
                        <TableCell
                          sx={{ color: "var(--font-secondary)", fontSize: "0.825rem" }}
                        >
                          {formatDate(t.created_at)}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.825rem" }}>
                          <UpdatedCell ticket={t} />
                        </TableCell>
                        <TableCell align="right">
                          <IconWrapper
                            icon="mdi:chevron-right"
                            size={18}
                            color="var(--border-light)"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box
                  data-tour-id="tickets-pagination"
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 2,
                    borderTop: "1px solid var(--ticket-row-divider)",
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
      </Paper>

      <ReportIssueDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </PageShell>
  );
}
