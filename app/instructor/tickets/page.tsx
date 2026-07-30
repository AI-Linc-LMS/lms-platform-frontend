"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { config } from "@/lib/config";
import { ticketService, type Ticket, type TicketStatus } from "@/lib/services/ticket.service";

/**
 * An instructor's ticket queue: the doubts raised by students in the cohorts they staff.
 *
 * This is the surface that replaces "My Tickets" for a teacher. The distinction matters — an
 * instructor is not a person filing support requests, they are the person answering their batch's
 * questions, and the previous menu entry pointed them at the learner raise-flow instead.
 *
 * Scoping is entirely the backend's: `tickets/instructor/` returns every ticket from a cohort this
 * caller staffs plus anything assigned to them directly, and nothing else. There is deliberately no
 * client-side filter standing in for that, so the two cannot disagree.
 */

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  OPEN: { bg: "color-mix(in srgb,#f59e0b 14%,transparent)", fg: "#b45309" },
  IN_PROGRESS: { bg: "color-mix(in srgb,#6366f1 14%,transparent)", fg: "#4338ca" },
  RESOLVED: { bg: "color-mix(in srgb,#10b981 14%,transparent)", fg: "#047857" },
  CLOSED: { bg: "color-mix(in srgb,#64748b 14%,transparent)", fg: "#475569" },
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
];

export default function InstructorTicketsPage() {
  const { push } = useInstantNavigation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await ticketService.listInstructor(
          config.clientId,
          status ? { status: status as TicketStatus } : undefined
        );
        if (!cancelled) setTickets(rows);
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === "OPEN").length;
    return { total: tickets.length, open };
  }, [tickets]);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Support"
        icon="mdi:ticket-confirmation-outline"
        title="Cohort tickets"
        description="Doubts raised by students in the batches you teach."
      />

      <Reveal>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key || "all"}
              label={f.label}
              onClick={() => setStatus(f.key)}
              sx={{
                fontWeight: 700,
                cursor: "pointer",
                bgcolor: status === f.key ? "var(--primary-500)" : "var(--card-bg)",
                color: status === f.key ? "#fff" : "var(--font-secondary)",
                border: "1px solid var(--border-default)",
              }}
            />
          ))}
        </Stack>
      </Reveal>

      {loading ? (
        <Typography sx={{ color: "var(--font-secondary)" }}>Loading…</Typography>
      ) : tickets.length === 0 ? (
        <Reveal>
          <Box
            sx={{
              borderRadius: 3,
              border: "1px dashed var(--border-default)",
              p: 4,
              textAlign: "center",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Icon icon="mdi:ticket-outline" width={34} style={{ color: "#94a3b8" }} />
            <Typography sx={{ fontWeight: 700, mt: 1 }}>No tickets yet</Typography>
            {/* The most likely cause by far, so say it plainly rather than let a teacher
                conclude the page is broken. */}
            <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mt: 0.5 }}>
              Tickets from students in the cohorts you teach appear here. If you expect to see some,
              ask an admin to confirm you are assigned to that cohort.
            </Typography>
          </Box>
        </Reveal>
      ) : (
        <Stack spacing={1.25}>
          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.8rem" }}>
            {counts.total} ticket{counts.total === 1 ? "" : "s"}
            {counts.open ? ` · ${counts.open} open` : ""}
          </Typography>
          {tickets.map((t) => {
            const tone = STATUS_TONES[t.status] ?? STATUS_TONES.CLOSED;
            return (
              <Reveal key={t.id}>
                <Box
                  onClick={() => push(`/tickets/${t.id}`)}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid var(--border-default)",
                    bgcolor: "var(--card-bg)",
                    p: 1.75,
                    cursor: "pointer",
                    transition: "border-color .15s",
                    "&:hover": { borderColor: "var(--primary-400)" },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.94rem" }} noWrap>
                        {t.subject}
                      </Typography>
                      <Typography
                        sx={{ color: "var(--font-secondary)", fontSize: "0.78rem", mt: 0.3 }}
                      >
                        {t.raised_by?.full_name || "A student"}
                        {t.cohort_name ? ` · ${t.cohort_name}` : ""}
                        {` · ${t.category_display}`}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1, py: 0.3, borderRadius: 999, fontSize: "0.68rem", fontWeight: 800,
                        bgcolor: tone.bg, color: tone.fg, flexShrink: 0,
                      }}
                    >
                      {t.status_display || t.status}
                    </Box>
                  </Stack>
                  {/* Assigned vs unassigned is the triage signal a teacher scans for. */}
                  {t.assigned_to_user && (
                    <Typography
                      sx={{ color: "var(--font-secondary)", fontSize: "0.72rem", mt: 0.6 }}
                    >
                      <Icon icon="mdi:account-check-outline" width={13} style={{ verticalAlign: -2 }} />{" "}
                      {t.assigned_to_user.full_name}
                      {t.assigned_by_user === null ? " (auto-routed)" : ""}
                    </Typography>
                  )}
                </Box>
              </Reveal>
            );
          })}
        </Stack>
      )}
    </PageShell>
  );
}
