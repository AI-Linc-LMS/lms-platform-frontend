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
  Pagination,
} from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import {
  ModulePageHeader,
  HeaderActionButton,
} from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ReportIssueDialog } from "@/components/common/ReportIssueDialog";
import { TicketHeroIcon } from "@/components/tickets/TicketHeroIcon";
import { MyTicketRows } from "@/components/tickets/TicketRows";
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
              minHeight: { xs: 52, sm: 48 },
              backgroundColor: "var(--card-bg)",
              // Five tabs do not fit 390px. They already scrolled, but the row simply ended at
              // the screen edge with nothing to say more existed - so a learner never found
              // "Reopened". Fade the edge on a phone, which is the one thing that reads as
              // "drag me", and hide the scrollbar iOS was not drawing anyway.
              "& .MuiTabs-scroller": {
                maskImage: {
                  xs: "linear-gradient(to right, #000 calc(100% - 28px), transparent 100%)",
                  sm: "none",
                },
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "var(--font-secondary)",
                minHeight: { xs: 52, sm: 48 },
                px: { xs: 1.75, sm: 2 },
                minWidth: { xs: 0, sm: 90 },
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
                    // A thumb needs 44px; this pill was 40.
                    minHeight: { xs: 48, sm: 0 },
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
                    minHeight: { xs: 48, sm: 0 },
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
              {/* Cards on a phone, the same table on a desktop. This list used to be a 794px
                  table inside a horizontal scroller: on a 390px screen a learner could see two
                  columns of their own tickets at a time. */}
              <Box sx={{ px: { xs: 2, sm: 0 }, py: { xs: 2, sm: 0 } }}>
                <MyTicketRows
                  data-tour-id="tickets-list"
                  tickets={tickets}
                  onOpen={(t) => router.push(`/tickets/${t.id}`)}
                  onIntent={(t) => router.prefetch(`/tickets/${t.id}`)}
                />
              </Box>

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
                    sx={{
                      // 32px pagination buttons are a miss on a thumb.
                      "& .MuiPaginationItem-root": {
                        minWidth: { xs: 40, sm: 32 },
                        height: { xs: 40, sm: 32 },
                      },
                    }}
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
